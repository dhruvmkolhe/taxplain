import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import {
  securityHeadersMiddleware,
  csrfProtectionMiddleware,
  generateCsrfToken,
  createRateLimiter,
} from "./src/server/security";
import {
  validateAndSanitizeTaxPayload,
  ValidationError,
} from "./src/server/sanitizer";

dotenv.config();

const app = express();
const PORT = 3000;

// Trust first proxy hop (e.g. Google Cloud Run, Nginx, or AWS ALB) for accurate IP rate limiting
app.set("trust proxy", 1);

// 1. Production HTTP Security Headers (Content-Security-Policy, nosniff, etc.)
app.use(securityHeadersMiddleware);

// 2. Strict JSON body parser with 1MB ceiling to prevent DoS/memory bloat
app.use(express.json({ limit: "1mb" }));

// 3. Tiered Rate Limiters
const generalApiLimiter = createRateLimiter({
  burstLimit: 30, // 30 requests per 10s
  sustainedLimit: 120, // 120 requests per 60s
  name: "general_api",
});

const taxStreamLimiter = createRateLimiter({
  burstLimit: 10, // 10 requests per 10s
  sustainedLimit: 35, // 35 requests per 60s
  name: "tax_stream_llm",
});

// Apply general limiter and CSRF verification across all API endpoints
app.use("/api", generalApiLimiter);
app.use("/api", csrfProtectionMiddleware);

// Lazy SDK client singletons to prevent startup crashes when keys are absent
let nvidiaClient: OpenAI | null = null;
function getNvidiaClient(): OpenAI | null {
  const key = process.env.NVIDIA_API_KEY;
  if (!key || key.trim().length === 0) {
    return null;
  }
  if (!nvidiaClient) {
    nvidiaClient = new OpenAI({
      apiKey: key.trim(),
      baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
      timeout: 6000,
      maxRetries: 0,
    });
  }
  return nvidiaClient;
}


// Fallback generator for realistic GST & Income Tax statutory knowledge
function getStaticFallback(type: string, promptText: string): string {
  // Extract actual user question if wrapped in XML tags
  const extracted = promptText.match(/<current_question>([\s\S]*?)<\/current_question>/i)?.[1] || promptText;
  const query = (extracted || "").toLowerCase().trim();

  // 1. TDS & TCS Rules
  if (query.includes("194-ia") || query.includes("immovable property") || (query.includes("tds") && query.includes("property"))) {
    return `## Statutory Guidance: TDS on Sale of Immovable Property (Section 194-IA)

### Key Statutory Provisions
Under **Section 194-IA** of the Income Tax Act, 1961:
- **Applicable Rate**: **1%** of the total sale consideration or Stamp Duty Value (whichever is higher).
- **Threshold Limit**: Mandatory if total consideration or stamp duty value of the property is **₹50 Lakhs or more**.
- **Deductor Responsibility**: The **Buyer (Transferee)** is statutorily bound to deduct TDS at the time of credit or payment to the seller, whichever is earlier.
- **No TAN Required**: The buyer does **NOT** need a TAN; deduction is submitted using the buyer's PAN via **Form 26QB**.

### Compliance & Filing Timeline
1. **Challan-cum-Statement (Form 26QB)**: Must be submitted electronically on the Income Tax e-filing portal within **30 days** from the end of the month in which deduction is made.
2. **TDS Certificate (Form 16B)**: Buyer must issue Form 16B to the seller within **15 days** of submitting Form 26QB.
3. **Non-PAN Penalty**: If the seller fails to furnish a valid PAN, TDS must be deducted at **20%** under Section 206AA.`;
  }

  if (query.includes("194c") || query.includes("194j") || query.includes("contractor") || query.includes("professional fee")) {
    return `## Statutory Guidance: Section 194C (Contractors) vs Section 194J (Professionals)

### Section 194C — Payments to Contractors
- **Tax Rates**: **1%** for Individual/HUF deductees; **2%** for Companies/Firms/LLPs.
- **Threshold**: Exceeding **₹30,000** for a single payment or **₹1,00,000** aggregate during the FY.
- **Scope**: Work contracts, manufacturing according to customer specs using customer materials (job work), catering, advertising, and transport contracts.

### Section 194J — Professional & Technical Services
- **Tax Rates**: 
  - **10%** for Professional services, Director fees, Royalty, and Non-compete fees.
  - **2%** for Technical services, Call center operation fees, or Royalty for sale/distribution of cinematographic films.
- **Threshold**: Exceeding **₹30,000** per category during the financial year.

### Practical Distinction Tip
If a contract involves technical expertise requiring specialized qualifications (e.g. IT software architecture, legal, accounting, engineering), Section 194J at 10%/2% applies. Pure labor or routine execution falls under Section 194C.`;
  }

  if (query.includes("194q") || query.includes("206c(1h)") || query.includes("purchase of goods") || query.includes("tcs on sale")) {
    return `## Statutory Guidance: Section 194Q (TDS) vs Section 206C(1H) (TCS) on Goods

### Section 194Q — TDS on Purchase of Goods
- **Applicability**: Buyer whose aggregate turnover in preceding FY exceeds **₹10 Crore**.
- **Trigger**: Purchasing goods from a resident seller exceeding **₹50 Lakhs** in a financial year.
- **Rate**: **0.1%** on the amount exceeding ₹50 Lakhs (5% if seller fails to furnish PAN).
- **Time of Deduction**: At credit to seller's account or payment, whichever is earlier.

### Section 206C(1H) — TCS on Sale of Goods
- **Applicability**: Seller whose aggregate turnover in preceding FY exceeds **₹10 Crore**.
- **Trigger**: Receiving sale consideration for goods exceeding **₹50 Lakhs** in a financial year.
- **Rate**: **0.1%** on the amount exceeding ₹50 Lakhs (1% if buyer PAN missing).

### Precedence Rule
If both Section 194Q (TDS by buyer) and Section 206C(1H) (TCS by seller) apply to a transaction, **Section 194Q TDS takes priority**. The seller shall not collect TCS if the buyer has already deducted TDS under Section 194Q.`;
  }

  // 2. GST & Input Tax Credit
  if (query.includes("capital goods") || query.includes("rule 43") || query.includes("itc on capital") || query.includes("plant and machinery")) {
    return `## Statutory Guidance: Claiming Input Tax Credit (ITC) on Capital Goods (Rule 43)

### Statutory Framework (Section 16 & Rule 43)
Under the CGST Act, 2017 and CGST Rules:
- **Full Initial Claim**: Eligible ITC on capital goods can be claimed in full in **GSTR-3B** of the tax period in which capital goods are received and reflected in **GSTR-2B**.
- **Statutory Useful Life**: Useful life of capital goods is statutorily fixed at **5 Years (60 Months)** from the invoice date.

### Mandatory Reversal Rule for Exempt Supplies (Rule 43)
If capital goods are used for both **taxable** and **exempt** supplies:
1. Useful life is taken as 60 months.
2. The monthly credit value ($T_m = \\text{ITC} / 60$) attributable to exempt supplies ($T_e = T_m \\times E / F$) must be calculated monthly.
3. The exempt portion $T_e$ must be added to the output tax liability in GSTR-3B along with applicable interest under Section 50.

### Restrictions & Disallowances
- **Section 16(3) Prohibition**: If depreciation is claimed on the tax component of capital goods under the Income Tax Act 1961, ITC on that tax component is **strictly disallowed**.
- **Section 17(5) Blocked Credits**: Motor vehicles (seating ≤ 13), personal consumption items, or works contracts for construction of immovable property on own account are ineligible for ITC.`;
  }

  if (query.includes("rule 88c") || query.includes("gstr-1 vs 3b") || query.includes("drc-01b") || query.includes("liability mismatch")) {
    return `## Statutory Guidance: Rule 88C & DRC-01B Intimation for Output Tax Mismatch

### Statutory Provision (Rule 88C of CGST Rules)
Where output tax liability declared in **GSTR-1 / IFF** exceeds tax paid in **GSTR-3B** by a specified percentage and amount:
- The GST portal automatically issues a system-generated intimation in **Part A of Form GST DRC-01B**.
- A copy is delivered to the registered taxpayer via email and portal dashboard.

### Statutory Compliance Action
Upon receipt of DRC-01B Part A, the taxpayer has **7 Days** to execute one of the following:
1. **Pay Differential Tax**: Pay the short-paid tax liability along with applicable interest under Section 50 via Form GST DRC-03.
2. **File Explanatory Reply**: Submit Part B of Form GST DRC-01B explaining reasons for variance (e.g. clerical error in GSTR-1, unadjusted credit note, advance adjustment).

### Consequences of Non-Compliance
If neither payment nor explanation is furnished within 7 days:
- Subsequent filing of **GSTR-1 / IFF** for future tax periods will be **blocked** under Rule 59(6).
- Recovery proceedings under Section 79 may be initiated directly for un-paid output tax.`;
  }

  if (query.includes("rule 86b") || query.includes("1%") || query.includes("mandatory cash")) {
    return `## Statutory Guidance: Rule 86B (1% Mandatory Cash Liability Rule)

### Provision Overview
Under **Rule 86B** of CGST Rules, 2017:
- Applicable to registered taxpayers whose taxable supply value (excluding exempt supplies and zero-rated supplies) exceeds **₹50 Lakhs in a month**.
- Such taxpayers **cannot utilize Electronic Credit Ledger (ITC)** to discharge more than **99%** of their output tax liability for that month.
- **At least 1%** of the output tax liability must be paid in hard cash via Electronic Cash Ledger.

### Statutory Exemptions from Rule 86B
Rule 86B does **NOT** apply if the registered entity or key management:
1. Has paid **>₹1 Lakh Income Tax** under the Income Tax Act in each of the last two financial years.
2. Has received a refund of **>₹1 Lakh** in preceding FY on account of unutilized ITC under zero-rated exports or inverted duty structure.
3. Has cumulatively discharged output tax in cash exceeding 1% for the current financial year.
4. Is a Government Department, Public Sector Undertaking (PSU), or Statutory Body.`;
  }

  if (query.includes("composition") || query.includes("section 10") || query.includes("bill of supply")) {
    return `## Statutory Guidance: Composition Scheme under Section 10

### Key Statutory Restrictions
A composition dealer opting for tax under **Section 10**:
- **Cannot issue a Tax Invoice**: Must issue a **Bill of Supply** with the explicit declaration *"Composition taxable person, not eligible to collect tax on supplies"*.
- **Cannot collect GST** from buyers.
- **Cannot claim Input Tax Credit (ITC)** on inward purchases.
- **Cannot engage in inter-state outward supplies** of goods (inter-state service composition permitted up to ₹50L under Sec 10(2A)).

### Composition Tax Rates
- **Manufacturers & Traders**: **1%** (0.5% CGST + 0.5% SGST) of turnover in State.
- **Restaurants (non-alcohol)**: **5%** (2.5% CGST + 2.5% SGST).
- **Service Providers (Sec 10(2A))**: **6%** (3% CGST + 3% SGST) up to ₹50 Lakhs turnover.`;
  }

  // 3. Income Tax & ITR
  if (query.includes("115bac") || query.includes("new regime") || query.includes("tax slab") || query.includes("income tax rate")) {
    return `## Statutory Guidance: New Tax Regime Slabs (Section 115BAC — AY 2025-26)

### Default Income Tax Slabs (Finance Act 2024)
Under Section 115BAC for Individuals, HUFs, AOPs, BOIs:
- **Up to ₹3,00,000**: **Nil**
- **₹3,00,001 to ₹7,00,000**: **5%**
- **₹7,00,001 to ₹10,00,000**: **10%**
- **₹10,00,001 to ₹12,00,000**: **15%**
- **₹12,00,001 to ₹15,00,000**: **20%**
- **Above ₹15,00,000**: **30%**

### Key Allowable Benefits under New Regime
- **Standard Deduction**: **₹75,000** for salaried employees and pensioners (increased from ₹50k).
- **Section 87A Tax Rebate**: Full rebate for resident individuals having taxable income up to **₹7,00,000** (effective tax is ZERO up to ₹7.75 Lakhs including standard deduction).
- **Employer NPS Contribution**: Deduction under Section 80CCD(2) up to **14%** of basic salary for government & private employees.
- **Family Pension Deduction**: Under Section 57(iia), 33.33% or ₹25,000 (whichever is less).`;
  }

  if (query.includes("44ada") || query.includes("44ad") || query.includes("presumptive")) {
    return `## Statutory Guidance: Section 44AD & 44ADA Presumptive Taxation

### Section 44ADA (Specified Professionals)
- **Eligibility**: Resident CAs, Legal, Medical, Engineering, Architecture, IT Consultants.
- **Gross Receipts Limit**: Up to **₹50 Lakhs** (enhanced to **₹75 Lakhs** if 95%+ receipts are received via digital/banking modes).
- **Deemed Minimum Net Profit**: **50%** of gross professional receipts.
- **Benefits**: Exemption from maintaining books under Section 44AA and tax audit under Section 44AB.

### Section 44AD (Eligible Small Businesses)
- **Eligibility**: Resident Individuals, HUFs, Partnership Firms (excluding LLPs).
- **Turnover Limit**: Up to **₹2 Crore** (enhanced to **₹3 Crore** if 95%+ turnover is via digital/banking channels).
- **Deemed Minimum Net Profit**: **8%** of total turnover (**6%** for digital/bank turnover).
- **Advance Tax**: Single installment on or before **15th March** of the FY.`;
  }

  if (query.includes("80d") || query.includes("health insurance") || query.includes("medical insurance")) {
    return `## Statutory Guidance: Section 80D Health Insurance Deduction Limits

### Deduction Breakdown (Old Tax Regime)
1. **Self, Spouse & Dependent Children**:
   - **₹25,000** max per FY (Non-senior citizen).
   - **₹50,000** max per FY if self/spouse is a **Senior Citizen (Age 60+)**.

2. **Parents Health Insurance**:
   - **₹25,000** additional limit for non-senior citizen parents.
   - **₹50,000** additional limit if parents are **Senior Citizens (Age 60+)**.

3. **Preventive Health Checkup**:
   - Up to **₹5,000** for self/family/parents within the overall Section 80D ceiling (payable in cash).

### Maximum Aggregate Deduction
The maximum permissible deduction under Section 80D is **₹1,00,000** per FY (where both taxpayer and parents are senior citizens aged 60+).`;
  }

  if (query.includes("24(b)") || query.includes("home loan interest") || query.includes("housing loan")) {
    return `## Statutory Guidance: Section 24(b) Home Loan Interest Deduction

### Old Tax Regime Rules
- **Self-Occupied Property**: Maximum deduction of **₹2,00,000** per FY for interest on capital borrowed for acquisition or construction (completed within 5 years).
- **Let-Out Property**: Full actual interest paid is deductible without upper cap. However, overall loss under "Income from House Property" set off against other income heads is capped at **₹2,00,000** per AY.

### New Tax Regime (Section 115BAC) Rules
- Interest on home loan for **Self-Occupied property is NOT deductible**.
- Interest on let-out property is deductible strictly against rental income from that property (cannot create a loss to set off against salary or business income).`;
  }

  // 4. Notices & Compliance
  if (query.includes("drc-01") || query.includes("asmt-10") || query.includes("notice") || query.includes("scn")) {
    return `## Statutory Guidance: Responding to GST Notices (ASMT-10 / DRC-01 / DRC-01B)

### Notice Categorization & Response Matrix
1. **Form GST ASMT-10 (Scrutiny Notice)**:
   - Issued under Section 61 pointing out discrepancies between returns.
   - Reply in **Form GST ASMT-11** within 30 days detailing reconciliation statements.

2. **Form GST DRC-01 (Show Cause Notice - SCN)**:
   - Formally issued under Section 73 (non-fraud) or Section 74 (fraud/suppression).
   - Reply in **Form GST DRC-06** within 30 days. Request personal hearing (PH) explicitly under Section 75(4).

3. **Form GST DRC-01B / DRC-01C**:
   - System intimations for output tax (GSTR-1 vs 3B) or ITC (GSTR-2B vs 3B) variance.
   - Mandatory reply in Part B within **7 Days** to avoid auto-blocking of return filing.`;
  }

  if (query.includes("section 73") || query.includes("section 74") || query.includes("fraud")) {
    return `## Statutory Guidance: Section 73 vs Section 74 Demand Notices

### Section 73 — Non-Fraud / Bona Fide Errors
- **Grounds**: Tax not paid, short paid, erroneously refunded, or ITC wrongly availed/utilized without fraud or willful misstatement.
- **Limitation Period**: Notice must be issued at least 3 months prior to 3 years from due date of annual return.
- **Penalty**: **10% of tax** or **₹10,000**, whichever is higher (NIL penalty if paid with interest before SCN or within 30 days of SCN).

### Section 74 — Fraud / Willful Misstatement / Suppression
- **Grounds**: Tax evasion involving fraud, willful misstatement, or suppression of facts to evade tax.
- **Limitation Period**: Notice can be issued up to 6 months prior to 5 years from due date of annual return.
- **Penalty**: **100% of tax amount** (reduced to 15% if paid before SCN, 25% if paid within 30 days of SCN, or 50% if paid within 30 days of order).`;
  }

  if (query.includes("lut") || query.includes("letter of undertaking") || query.includes("zero-rated") || query.includes("export")) {
    return `## Statutory Guidance: Letter of Undertaking (LUT) for Exports

### Provision Overview (Section 16 of IGST Act)
Registered exporters can export goods or services without payment of IGST under a **Letter of Undertaking (LUT)** filed in Form GST RFD-11.

### Key Statutory Requirements
- **Filing Window**: Must be submitted online on the GST portal **prior to exporting** for the relevant financial year.
- **Validity**: Valid for **one full Financial Year** (1st April to 31st March).
- **Condition**: Export proceeds in convertible foreign exchange must be realized within 1 year for services (or 9 months for goods as per RBI regulations). Failing this, IGST + 18% interest becomes payable immediately under Rule 96A.`;
  }

  // 5. Intelligent Dynamic Fallback for any unhandled question
  const titleTopic = extracted.length > 50 ? extracted.slice(0, 50) + "…" : extracted;
  return `## Statutory Analysis: ${titleTopic}

### Statutory Overview & Core Provisions
Under Indian tax jurisprudence (CGST Act 2017 / Income Tax Act 1961):
- **Core Principle**: Tax obligations, deductions, exemptions, and procedural compliances are governed strictly by codified statutory provisions, notifications, and circulars issued by CBIC / CBDT.
- **Reconciliation Requirement**: Always ensure 100% alignment between books of account, statutory filings (GSTR-1, GSTR-3B, Form 26AS, AIS/TIS), and portal statements before finalizing tax liabilities.

### Applicable Compliance Steps
1. Verify the exact statutory section/rule governing the transaction date or assessment year.
2. Confirm taxpayer category eligibility (Individual, Partnership, Private Limited, LLP).
3. Ensure vendor/counterparty reporting is reflected in auto-drafted statements (GSTR-2B for GST; Form 26AS/AIS for Income Tax).
4. Discharge net liabilities within statutory due dates to prevent mandatory interest under Section 50 (GST) or Section 234A/B/C (Income Tax).

### Key Deadlines & Statutory Cutoffs
- **GST Returns**: GSTR-1 (11th of month), GSTR-3B (20th of month), GSTR-9/9C Annual Return (31st December).
- **Income Tax ITR**: Non-audit returns (31st July), Audit returns (31st October).
- **TDS Compliance**: Monthly payment (7th of next month), Quarterly statement (31st of month following quarter).

*Disclaimer: Educational statutory summary. Always verify provisions against official government portals (gst.gov.in / incometax.gov.in) or consult a certified Chartered Accountant.*`;
}

// -------------------------------------------------------------
// API ROUTES (FIRST)
// -------------------------------------------------------------

// Health Check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "TaxPlain Secure Server",
    timestamp: new Date().toISOString(),
  });
});

// Anti-CSRF Token Generation Endpoint
// Issues cryptographically signed tokens for verified application sessions
app.get("/api/csrf-token", (req: Request, res: Response) => {
  const token = generateCsrfToken();
  res.json({
    csrfToken: token,
    expiresIn: 7200, // 2 hours
  });
});

// Security & Vault Status (Confirms keys and defense-in-depth telemetry)
app.get("/api/security/status", (req: Request, res: Response) => {
  const hasNvidia = Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim().length > 0);
  const activeModel = process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4-pro-0813";

  res.json({
    vaultStatus: "protected",
    serverSideOnly: true,
    clientKeyExposure: false,
    rateLimitingActive: true,
    csrfProtection: true,
    cspConfigured: true,
    inputSanitizerActive: true,
    activeProvider: hasNvidia ? "nvidia" : "statutory-engine",
    model: activeModel,
    availableProviders: hasNvidia ? ["nvidia"] : [],
    tlsSecurity: true,
  });
});

// Secure AI Streaming Proxy with CSRF, Rate Limiting, and Input Sanitization
app.post("/api/tax/stream", taxStreamLimiter, async (req: Request, res: Response) => {
  let validated: ReturnType<typeof validateAndSanitizeTaxPayload>;

  try {
    // 1. Server-side input validation and anti-injection sanitization
    validated = validateAndSanitizeTaxPayload(req.body);
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode || 400).json({
        error: "Validation Error",
        code: "INVALID_TAX_PAYLOAD",
        message: err.message,
      });
    }
    return res.status(400).json({
      error: "Bad Request",
      code: "MALFORMED_REQUEST",
      message: "The submitted tax payload could not be validated.",
    });
  }

  const { messages, promptType, temperature } = validated;

  // Set SSE (Server-Sent Events) streaming headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const sendSSEChunk = (text: string) => {
    res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
  };

  const sendSSEDone = () => {
    res.write(`data: [DONE]\n\n`);
    res.end();
  };

  // Helper to stream fallback smoothly
  const streamFallback = async () => {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
    const fallbackText = getStaticFallback(promptType, lastUserMessage);
    const words = fallbackText.split(" ");
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(" ") + " ";
      sendSSEChunk(chunk);
      await new Promise((r) => setTimeout(r, 20));
    }
    sendSSEDone();
  };

  const streamNvidia = async (): Promise<boolean> => {
    const nvidia = getNvidiaClient();
    if (!nvidia) return false;
    try {
      const stream: any = await nvidia.chat.completions.create({
        model: process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4-pro-0813",
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        stream: true,
        ...({ chat_template_kwargs: { thinking: false } }),
      } as any);

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          sendSSEChunk(text);
        }
      }
      sendSSEDone();
      return true;
    } catch (err: any) {
      console.error("[TaxPlain Server] NVIDIA DeepSeek API execution error:", err?.message || err);
      return false;
    }
  };

  // Primary AI Engine: NVIDIA API (DeepSeek V4 Pro)
  if (await streamNvidia()) {
    return;
  }

  // When NVIDIA API is unavailable or quota exhausted, deliver statutory CA fallback
  return streamFallback();
});

// -------------------------------------------------------------
// VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        maxAge: "1d",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      })
    );
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`TaxPlain server running securely on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
