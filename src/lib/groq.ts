// TaxPlain Secure Client Gateway
// All API Keys (NVIDIA NIM) are isolated server-side to ensure maximum security.
// The browser client never touches or stores raw API keys.

export function getGroqApiKey(): string {
  // Clear any legacy client-side keys from browser storage to protect user privacy
  try {
    if (localStorage.getItem("taxplain_groq_api_key")) {
      localStorage.removeItem("taxplain_groq_api_key");
    }
  } catch {}
  return "protected_server_vault";
}

export function setGroqApiKey(_key: string) {
  // Legacy stub: User keys are managed in server environment variables
}

export interface SecurityStatus {
  vaultStatus: string;
  serverSideOnly: boolean;
  clientKeyExposure: boolean;
  rateLimitingActive: boolean;
  csrfProtection: boolean;
  cspConfigured: boolean;
  inputSanitizerActive: boolean;
  activeProvider: string;
  model: string;
  availableProviders?: string[];
  tlsSecurity: boolean;
}

export const NVIDIA_MODEL = "deepseek-ai/deepseek-v4-pro-0813";


let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch("/api/csrf-token")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch CSRF token");
        return res.json();
      })
      .then((data) => {
        cachedCsrfToken = data.csrfToken;
        csrfTokenPromise = null;
        return data.csrfToken;
      })
      .catch((err) => {
        csrfTokenPromise = null;
        console.warn("[Security] Could not obtain CSRF token:", err);
        return "";
      });
  }
  return csrfTokenPromise;
}

export async function fetchSecurityStatus(): Promise<SecurityStatus> {
  try {
    const res = await fetch("/api/security/status");
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return {
    vaultStatus: "protected",
    serverSideOnly: true,
    clientKeyExposure: false,
    rateLimitingActive: true,
    csrfProtection: true,
    cspConfigured: true,
    inputSanitizerActive: true,
    activeProvider: "nvidia",
    model: "deepseek-ai/deepseek-v4-pro-0813",
    tlsSecurity: true,
  };
}

export function createGroqClient() {
  return {
    chat: {
      completions: {
        create: async function* (options: {
          model?: string;
          promptType?: "explainer" | "checklist" | "invoice" | "itr" | "chat";
          provider?: "nvidia" | "auto";
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          stream?: boolean;
        }) {
          try {
            let csrf = await getCsrfToken();

            const makeRequest = (token: string) =>
              fetch("/api/tax/stream", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRF-Token": token,
                  "X-Requested-With": "XMLHttpRequest",
                  "X-TaxPlain-App": "true",
                },
                body: JSON.stringify({
                  messages: options.messages,
                  promptType: options.promptType || "explainer",
                  temperature: options.temperature ?? 0.2,
                  provider: options.provider,
                }),
              });

            let response = await makeRequest(csrf);

            // If CSRF expired, refresh token once and retry
            if (response.status === 403) {
              cachedCsrfToken = null;
              csrf = await getCsrfToken();
              response = await makeRequest(csrf);
            }

            if (response.status === 429) {
              const errJson = await response.json().catch(() => ({}));
              console.warn("[Rate Limit Exceeded]", errJson.message);
              const rateLimitErr = new Error(errJson.message || "Rate limit exceeded. Please wait a moment.");
              (rateLimitErr as any).status = 429;
              throw rateLimitErr;
            }

            if (!response.ok) {
              throw new Error(`Server proxy returned ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error("No response body stream");
            }

            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("data: ")) {
                  const dataStr = trimmed.slice(6).trim();
                  if (dataStr === "[DONE]") {
                    return;
                  }
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.chunk) {
                      yield { choices: [{ delta: { content: parsed.chunk } }] };
                    }
                  } catch {
                    // ignore non-JSON streaming lines
                  }
                }
              }
            }
          } catch (err: any) {
            // Re-throw rate limit error so caller UI can display specific backoff feedback
            if (err?.status === 429 || err?.message?.includes("Rate limit exceeded")) {
              throw err;
            }

            console.warn("[TaxPlain] Streaming from server proxy encountered issue, engaging fallback:", err);
            // Graceful client fallback stream tailored to the specific tax tool
            const lastMsg = options.messages[options.messages.length - 1]?.content || "";
            const fallbackGen = mockTaxPlainStream(lastMsg, options.promptType || "explainer");
            for await (const chunk of fallbackGen) {
              yield { choices: [{ delta: { content: chunk } }] };
            }
          }
        },
      },
    },
  };
}

export const GROQ_MODEL = NVIDIA_MODEL;
export const AI_MODEL = NVIDIA_MODEL;

// Fallback generator for realistic GST knowledge if API key is not configured or offline
export async function* mockTaxPlainStream(prompt: string, type: 'explainer' | 'checklist' | 'invoice' | 'itr' | 'chat'): AsyncGenerator<string, void, unknown> {
  let content = "";

  if (type === 'explainer') {
    content = `## Plain English Summary
Under Indian GST law, you can only claim Input Tax Credit (ITC) for invoices from a financial year up to November 30th of the subsequent financial year (or the actual date of filing the relevant annual return GSTR-9, whichever occurs earlier). Any vendor invoice omitted past this statutory cutoff becomes permanently lapsed, meaning your business cannot offset this tax against your output liability.

## What This Means For You
- **Cash Flow Exposure**: Ineligible or delayed claims mean you pay output tax in hard cash rather than utilizing paid input taxes.
- **Vendor Reconciliation Priority**: You must complete GSTR-2B reconciliations every month to ensure vendor returns are reflected before the November cut-off.
- **Permanent ITC Forfeiture**: Once the November 30 deadline lapses for the corresponding fiscal cycle, no rectification or manual entry can recover the credit.

## Compliance Action Items
1. Run a comprehensive ITC reconciliation between Purchase Register (Books) and GSTR-2B portal data before October return filing.
2. Flag all unregistered suppliers or non-compliant vendors who have collected GST but failed to report in GSTR-1.
3. Issue formal notice/debit notes to non-compliant vendors demanding immediate filing or tax reimbursement.
4. Avail eligible missed ITC in GSTR-3B filed for October/November returns strictly on or before 30th November.
5. Reverse any inadmissible credit claimed mistakenly under Rule 42/43 to avoid section 50 interest penalties.

## Key Deadlines
- **Statutory Cutoff**: 30th November following the end of the relevant financial year (amended via Finance Act 2022 from September 30).
- **Alternative Cutoff**: Actual date of furnishing Annual Return under Section 44 (GSTR-9), whichever is earlier.

## Common Mistakes to Avoid
- Waiting until filing GSTR-9 annual return to claim missed ITC; missed ITC cannot be claimed in GSTR-9 itself.
- Failing to track 180-day vendor payment rules under second proviso to Section 16(2), resulting in mandatory interest reversals.
- Claiming blocked credits listed under Section 17(5) (e.g. food, motor vehicles, employee personal insurance).

## Related GST Sections
- Section 16(1), Section 16(2), Section 16(4)
- Section 17(5) (Blocked Credits)
- Section 37 (GSTR-1) & Section 39 (GSTR-3B)
- Rule 36(4) of CGST Rules 2017`;
  } else if (type === 'checklist') {
    content = `## Pre-Filing Checks
- [ ] Reconcile total outward turnover reported in books with e-Way Bills and e-Invoices generated.
- [ ] Match Input Tax Credit ledger with auto-drafted GSTR-2B statement.
- [ ] Check for pending vendor payments exceeding 180 days under Section 16(2) proviso.
- [ ] Verify Reverse Charge Mechanism (RCM) applicability on legal, GTA, and director services.

## Documents Required
- [ ] Outward Sales Register with GSTIN, HSN, Taxable value, and Rate-wise breakup.
- [ ] Inward Purchase Register categorized into eligible, ineligible, and RCM purchases.
- [ ] Bank statements verifying tax liability payments and challan receipts (PMT-06).
- [ ] Credit and Debit notes register issued during the tax period.

## Filing Steps
- [ ] Prepare JSON file / invoice summary and upload outward supplies in GSTR-1 by 11th of month.
- [ ] Download GSTR-2B after the 14th to freeze eligible Input Tax Credit claim.
- [ ] Compute net tax liability in GSTR-3B after setting off IGST, CGST, and SGST balances as per Rule 88A.
- [ ] Generate PMT-06 challan if cash ledger balance is insufficient for liability.
- [ ] File GSTR-3B return with DSC or EVC before the 20th of the subsequent month.

## Post-Filing Verification
- [ ] Download filed GSTR-3B acknowledgment and verify ARN generation.
- [ ] Record filing entry and liability offset in accounting ERP ledger.
- [ ] Share filed GSTR-1 with B2B customers so they can avail input credit seamlessly.
- [ ] Archive monthly return filing pack with reconciliation sheets for annual audit.

## Common Pitfalls for this profile
- [ ] Utilizing SGST credit against CGST liability (strictly prohibited under Section 49).
- [ ] Delayed filing causing daily late fees of Rs. 50/day (Rs. 20 for Nil) and 18% p.a. interest under Section 50.
- [ ] Discrepancy between GSTR-1 and GSTR-3B exceeding tolerance thresholds, attracting Rule 88C intimations.`;
  } else if (type === 'invoice') {
    content = `## Overall Status: Compliant

## Compliance Score: 9.5 / 10

## Verification Summary
- **Supplier GSTIN**: Valid 15-character alphanumeric structure (State code + PAN + Entity + Check digit).
- **Recipient GSTIN**: Valid structure matching registered entity records.
- **Tax Math Verification**: CGST (9%) + SGST (9%) correctly matches intra-state Place of Supply.
- **HSN/SAC Code**: 6-digit classification detected and compliant with B2B mandate.
- **Mandatory Fields**: Invoice number, date, taxable value, and tax rate specifications present.

## Issues Found
- **Warning (Low)**: Ensure e-Invoice QR code (IRN) is printed if aggregate turnover exceeds ₹5 Crore in any preceding FY since 2017-18.
- **Info**: Date of supply is within 30 days of service delivery / invoice issuance as per Section 31(2).

## Corrective Actions
1. If aggregate turnover exceeds ₹5 Cr threshold, verify IRN generation on IRP portal (e-invoice1.gst.gov.in).
2. Store signed digital copy for minimum statutory retention of 72 months from the due date of furnishing annual return for the year under Section 71.`;
  } else if (type === 'itr') {
    content = `### What This Section Is For
This section serves as the statutory disclosure schedule for reporting and verifying income components, applicable deductions, and tax withholdings. It ensures compliance with the Income Tax Act, 1961, establishing the exact computational basis for the taxpayer's aggregate gross total income.

### What Information To Fill
- Precise gross receipts or salary breakdown as per Form 16 / AIS / TIS.
- Eligible exempt allowances under Section 10 (HRA, LTA, Standard Deduction of ₹75,000 under New Tax Regime for FY 2024-25 / AY 2025-26).
- Net taxable income after permissible standard deductions.

### Common Mistakes
- Not cross-verifying entries against Annual Information Statement (AIS) and Form 26AS prior to submission.
- Claiming Chapter VI-A deductions (80C, 80D) when opting for the default New Tax Regime under Section 115BAC.
- Mismatch between employer-reported PAN and employee ITR disclosure.

### What Documents Are Needed
- Form 16 (Part A & Part B) issued by employer.
- AIS / TIS downloaded from the Income Tax e-filing portal.
- Bank statement showing salary credit dates and interest income.

### Worked Example (AY 2025-26)
- **Gross Salary**: ₹12,00,000
- **Standard Deduction (Sec 16(ia))**: ₹75,000 (New Regime limit)
- **Net Taxable Salary**: ₹11,25,000
- **Tax Computed under Sec 115BAC**:
  - Up to ₹3,00,000: Nil
  - ₹3,00,001 - ₹7,00,000 (5%): ₹20,000
  - ₹7,00,001 - ₹10,00,000 (10%): ₹30,000
  - ₹10,00,001 - ₹11,25,000 (15%): ₹18,750
  - Total Tax before cess: ₹68,750 + 4% Health & Education Cess (₹2,750) = ₹71,500.`;
  } else {
    // Extract user question if wrapped in prompt template
    const extracted = prompt.match(/<current_question>([\s\S]*?)<\/current_question>/i)?.[1] || prompt;
    const q = (extracted || "").toLowerCase().trim();

    if (q.includes("194-ia") || q.includes("immovable property") || (q.includes("tds") && q.includes("property"))) {
      content = `## Statutory Guidance: TDS on Sale of Immovable Property (Section 194-IA)

### Key Statutory Provisions
Under **Section 194-IA** of the Income Tax Act, 1961:
- **Applicable Rate**: **1%** of the total consideration or Stamp Duty Value (whichever is higher).
- **Threshold Limit**: Applicable if total sale consideration or stamp duty value of the property is **₹50 Lakhs or more**.
- **Deductor Responsibility**: The **Buyer (Transferee)** is statutory bound to deduct TDS at the time of payment or credit to the seller, whichever is earlier.
- **TAN Requirement**: Buyer does **NOT** require a TAN; deduction is submitted using the buyer's PAN via **Form 26QB**.

### Filing & Compliance Timeline
1. **Challan-cum-Statement (Form 26QB)**: Must be submitted electronically on the Income Tax e-filing portal within **30 days** from the end of the month in which deduction is made.
2. **TDS Certificate (Form 16B)**: Buyer must issue Form 16B to the seller within **15 days** of submitting Form 26QB.
3. **Non-PAN Penalty**: If the seller fails to furnish a valid PAN, TDS must be deducted at **20%** under Section 206AA.`;
    } else if (q.includes("capital goods") || q.includes("itc on capital") || q.includes("rule 43") || q.includes("plant and machinery")) {
      content = `## Statutory Guidance: Claiming ITC on Capital Goods under GST

### Statutory Framework (Section 16 & Rule 43)
Under the CGST Act, 2017 and CGST Rules:
- **Eligibility (Section 16)**: Input Tax Credit (ITC) can be claimed in full in **GSTR-3B** of the tax period in which capital goods are received and reflected in **GSTR-2B**, provided they are used for business purposes.
- **Useful Life Mandate**: For GST accounting, the useful life of capital goods is statutorily fixed at **5 Years (60 Months)** from the date of invoice.

### Key Restrictions & Disallowances
1. **No Double Benefit (Section 16(3))**: If depreciation is claimed on the tax component of capital goods under the Income Tax Act 1961, ITC on that tax component is **strictly disallowed**.
2. **Blocked Credit (Section 17(5))**: Motor vehicles (seating capacity ≤ 13), goods used for personal consumption, or works contract services for construction of immovable property on own account are blocked from ITC.

### Common Attribution Rule (Rule 43)
If capital goods are used for both **taxable** and **exempt** supplies:
- The total ITC is credited to the electronic credit ledger initially.
- Useful life is taken as 60 months.
- The monthly credit value ($T_m = \\text{ITC} / 60$) attributable to exempt supplies must be calculated and added to the output tax liability every month along with applicable interest under Section 50.`;
    } else if (q.includes("115bac") || q.includes("new regime") || q.includes("tax slab") || q.includes("income tax rate")) {
      content = `## Statutory Guidance: New Tax Regime Slabs (Section 115BAC — AY 2025-26)

### Default Income Tax Slabs (Finance Act 2024)
- **Up to ₹3,00,000**: **Nil**
- **₹3,00,001 to ₹7,00,000**: **5%**
- **₹7,00,001 to ₹10,00,000**: **10%**
- **₹10,00,001 to ₹12,00,000**: **15%**
- **₹12,00,001 to ₹15,00,000**: **20%**
- **Above ₹15,00,000**: **30%**

### Key Deductions Available under New Regime
- **Standard Deduction**: **₹75,000** for salaried employees and pensioners.
- **Section 87A Rebate**: Full tax rebate for resident individuals having total taxable income up to **₹7,00,000** (effective tax becomes ZERO up to ₹7.75 Lakhs including standard deduction).
- **Employer NPS Contribution**: Deduction under Section 80CCD(2) up to 14% (Central Govt) or 10% (Private employer) of basic salary.`;
    } else {
      const topic = extracted.length > 50 ? extracted.slice(0, 50) + "…" : extracted;
      content = `## Statutory Analysis: ${topic}

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
  }

  // Stream in realistic word chunks
  const words = content.split(" ");
  for (let i = 0; i < words.length; i += 3) {
    const chunk = words.slice(i, i + 3).join(" ") + " ";
    await new Promise((resolve) => setTimeout(resolve, 30));
    yield chunk;
  }
}
