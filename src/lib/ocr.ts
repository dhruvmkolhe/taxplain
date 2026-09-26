import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdfjs worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export interface OcrResult {
  text: string;
  confidence: number;
  detectedNoticeType?: string;
  detectedSections?: string[];
  detectedDemandAmount?: string;
  detectedDueDate?: string;
  pageCount?: number;
}

export type OcrProgressCallback = (progress: number, statusMessage: string) => void;

/**
 * Pre-bundled realistic sample tax notice documents for instant 1-click testing
 */
export const SAMPLE_TAX_NOTICES = [
  {
    id: "sample-drc01",
    name: "Form GST DRC-01 (Section 73 SCN)",
    type: "GST Demand Notice",
    badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    description: "Show Cause Notice for discrepancy in GSTR-1 outward tax liability vs GSTR-3B paid.",
    filename: "FORM_GST_DRC_01_NOTICE.pdf",
    text: `GOVERNMENT OF INDIA / STATE GOODS AND SERVICES TAX DEPARTMENT
OFFICE OF THE ASSISTANT COMMISSIONER, DIVISION-II, VADODARA-1, GUJARAT
DIN: 20241024567891234
REFERENCE NO: ZD241024009876E
DATE: 18/10/2024

FORM GST DRC-01
[See Rule 142(1)]
SUMMARY OF SHOW CAUSE NOTICE UNDER SECTION 73 OF CGST ACT, 2017

To,
M/S APEX LOGISTICS & SUPPLIERS PVT LTD
GSTIN: 24AAACG1234F1Z8
INDUSTRIAL AREA, PHASE 2, VADODARA, GUJARAT - 390010

Tax Period: Financial Year 2022-23 (July 2022 to March 2023)

1. BRIEF FACTS OF THE CASE:
Upon scrutiny of outward returns filed in Form GSTR-1 and summary returns filed in Form GSTR-3B for the tax period FY 2022-23, it is observed that there exists an unreconciled liability difference.
Taxable turnover reported in Form GSTR-1: ₹1,85,40,000/- (IGST liability ₹33,37,200/-).
Tax liability declared and discharged through Form GSTR-3B: ₹1,54,20,000/- (IGST paid ₹27,75,600/-).
Unpaid differential tax liability under Section 73(1): ₹5,61,600/-.

2. GROUNDS OF NOTICE:
The taxpayer has failed to provide explanation for short payment of tax within the statutory timeline under Rule 88C. The shortfall constitutes short payment of tax under Section 73(1) of the Central Goods and Services Tax Act, 2017.

3. DEMAND SUMMARY:
- Differential Tax Demand (IGST): ₹5,61,600/-
- Applicable Interest under Section 50: ₹1,01,088/- (Calculated @ 18% p.a.)
- Penalty under Section 73(9): ₹56,160/- (10% of tax amount)
TOTAL DEMAND PAYABLE: ₹7,18,848/-

4. DIRECTIONS:
You are hereby required to file your reply in FORM GST DRC-06 within 30 days of the receipt of this notice, failing which an ex-parte order under Section 73(9) shall be passed without further reference.
Personal Hearing Date: 20/11/2024 at 11:30 AM before the Adjudicating Authority.`,
  },
  {
    id: "sample-asmt10",
    name: "Form GST ASMT-10 (Section 61 Scrutiny)",
    type: "GST Scrutiny Notice",
    badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    description: "Scrutiny notice pointing out excess Input Tax Credit claimed in GSTR-3B over GSTR-2B.",
    filename: "FORM_GST_ASMT_10_SCRUTINY.pdf",
    text: `FORM GST ASMT-10
[See Rule 99(1)]
NOTICE FOR INTIMATING DISCREPANCIES IN THE RETURN AFTER SCRUTINY

Reference No: ASMT10/24/09812/2024-25
Office of the State Tax Officer, Circle-4, Ahmedabad, Gujarat
Date: 12/09/2024

To:
M/S APEX INFOTECH SOLUTIONS LLP
GSTIN: 24AABCA9081K1Z2

Assessment Year: 2024-25 | Period: April 2023 to March 2024

Subject: Discrepancy identified during automated return scrutiny under Section 61 of the GGST/CGST Act 2017.

1. DISCREPANCY DETAILS:
Parameter: Excess Input Tax Credit availed in Table 4(A)(5) of Form GSTR-3B as compared to eligible ITC auto-populated in Form GSTR-2B.
- Total ITC availed in GSTR-3B (All Other ITC): ₹44,20,500/-
- Eligible ITC reflected in GSTR-2B statement: ₹38,10,000/-
- Excess / Ineligible ITC claimed in violation of Section 16(2)(aa) & Rule 36(4): ₹6,10,500/-.

2. INSTRUCTIONS:
You are hereby advised to furnish reasons for the aforesaid discrepancies in FORM GST ASMT-11 within thirty (30) days of receipt of this notice, or deposit the excess credit along with applicable interest under Section 50 via DRC-03.
In case no reply is furnished, action under Section 65, 66, 73 or 74 shall be initiated without further intimation.`,
  },
  {
    id: "sample-sec148",
    name: "Income Tax Section 148A(b) Notice",
    type: "IT Reopening Notice",
    badgeColor: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    description: "Notice to show cause why assessment should not be reopened for unexplained transactions.",
    filename: "INCOME_TAX_SEC_148A_NOTICE.pdf",
    text: `GOVERNMENT OF INDIA
MINISTRY OF FINANCE, DEPARTMENT OF REVENUE
OFFICE OF THE INCOME TAX OFFICER, WARD 1(2), VADODARA
DIN & NOTICE NO: ITBA/AST/S/148A/2024-25/1068945231(1)
DATE: 14/03/2024

NOTICE UNDER SECTION 148A(b) OF THE INCOME-TAX ACT, 1961

PAN: ABCDE1234F
Name: SHRI RAMESHCHANDRA PATEL
Assessment Year: 2020-21 (Financial Year: 2019-20)

1. WHEREAS, the Income Tax Department is in possession of information in accordance with Risk Management Strategy which suggests that income chargeable to tax has escaped assessment within the meaning of Section 147 of the Income-tax Act, 1961.

2. INFORMATION DETAILS AS PER INSIGHT PORTAL:
As per Statement of Financial Transactions (SFT-005 & SFT-012) reported by HDFC Bank and Sub-Registrar:
(a) Cash deposits aggregating to ₹28,50,000/- in Savings Bank Account No. 5010023456789.
(b) Purchase of immovable commercial property valued at ₹65,00,000/- at Alkapuri, Vadodara, whereas returned income for AY 2020-21 is reported as ₹4,80,000/- only.

3. OPPORTUNITY TO SHOW CAUSE:
You are hereby provided an opportunity to show cause as to why a notice under Section 148 of the Act should not be issued in your case.
You are required to submit your explanation along with supporting documentary evidence through your e-filing account on or before 28/03/2024.`,
  },
];

/**
 * Parses and extracts statutory fields from recognized notice text
 */
export function analyzeNoticeMetadata(text: string): {
  detectedNoticeType?: string;
  detectedSections: string[];
  detectedDemandAmount?: string;
  detectedDueDate?: string;
} {
  const detectedSections: string[] = [];
  let detectedNoticeType: string | undefined;
  let detectedDemandAmount: string | undefined;
  let detectedDueDate: string | undefined;

  // Detect Notice Forms / Types
  if (/DRC[\s-]?01/i.test(text)) {
    detectedNoticeType = "Form GST DRC-01 (Show Cause Notice)";
  } else if (/ASMT[\s-]?10/i.test(text)) {
    detectedNoticeType = "Form GST ASMT-10 (Scrutiny Notice)";
  } else if (/DRC[\s-]?07/i.test(text)) {
    detectedNoticeType = "Form GST DRC-07 (Demand Order)";
  } else if (/REG[\s-]?17/i.test(text)) {
    detectedNoticeType = "Form GST REG-17 (Cancellation SCN)";
  } else if (/148A/i.test(text) || /148/i.test(text)) {
    detectedNoticeType = "Income Tax Section 148 / 148A Notice";
  } else if (/RULE[\s-]46/i.test(text)) {
    detectedNoticeType = "Rule 46 Tax Invoice";
  }

  // Detect Sections
  const sectionMatches = text.match(/(?:Section|Sec\.?|Rule)\s*([0-9]+(?:\([0-9a-zA-Z]+\))*)/gi);
  if (sectionMatches) {
    const unique = Array.from(new Set(sectionMatches.map((s) => s.trim())));
    detectedSections.push(...unique.slice(0, 5));
  }

  // Detect Currency Amount
  const amountMatch = text.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) {
    detectedDemandAmount = `₹${amountMatch[1]}`;
  }

  // Detect Date / Deadline
  const dateMatch = text.match(/(?:within\s+([0-9]+)\s+days|by\s+([0-9]{2}[/-][0-9]{2}[/-][0-9]{4})|before\s+([0-9]{2}[/-][0-9]{2}[/-][0-9]{4}))/i);
  if (dateMatch) {
    detectedDueDate = dateMatch[0];
  }

  return {
    detectedNoticeType,
    detectedSections,
    detectedDemandAmount,
    detectedDueDate,
  };
}

/**
 * Extracts text from a PDF file using pdfjs-dist.
 * Attempts native text layer extraction first; if empty (scanned PDF), renders page 1 to canvas and runs Tesseract OCR.
 */
async function extractTextFromPdf(
  file: File,
  onProgress?: OcrProgressCallback
): Promise<string> {
  onProgress?.(10, "Reading PDF document structure...");
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, 4); // Limit to first 4 pages for rapid browser processing
  let fullText = "";

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      20 + Math.round((i / numPages) * 40),
      `Extracting digital text from page ${i} of ${pdf.numPages}...`
    );
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || "")
      .join(" ");

    if (pageText.trim().length > 30) {
      fullText += (fullText ? "\n\n" : "") + `--- PAGE ${i} ---\n` + pageText;
    }
  }

  // If digital text was found and is substantial, return it directly
  if (fullText.trim().length > 100) {
    onProgress?.(100, "PDF text extracted successfully.");
    return fullText;
  }

  // Otherwise, it's a scanned PDF! Render page 1 to canvas and run OCR
  onProgress?.(65, "Scanned document detected. Rendering page to high-res canvas for OCR...");
  const page1 = await pdf.getPage(1);
  const viewport = page1.getViewport({ scale: 2.0 }); // 2x scale for crisp OCR text
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not create canvas context for PDF OCR");

  await page1.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  onProgress?.(75, "Running neural OCR on rendered page...");
  const dataUrl = canvas.toDataURL("image/png");
  return extractTextFromImage(dataUrl, onProgress);
}

let cachedWorkerPromise: Promise<any> | null = null;
let workerIdleTimeout: any = null;

async function getOrCreateOcrWorker(onProgress?: OcrProgressCallback) {
  if (workerIdleTimeout) {
    clearTimeout(workerIdleTimeout);
    workerIdleTimeout = null;
  }

  if (!cachedWorkerPromise) {
    onProgress?.(25, "Initializing Tesseract OCR engine in browser...");
    cachedWorkerPromise = createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const pct = Math.round(30 + (m.progress || 0) * 65);
          onProgress?.(pct, `Recognizing statutory text (${Math.round((m.progress || 0) * 100)}%)...`);
        } else if (m.status) {
          onProgress?.(30, `OCR status: ${m.status}`);
        }
      },
    });
  }

  return cachedWorkerPromise;
}

function scheduleWorkerIdleTermination(delayMs = 3 * 60 * 1000) {
  if (workerIdleTimeout) clearTimeout(workerIdleTimeout);
  workerIdleTimeout = setTimeout(async () => {
    if (cachedWorkerPromise) {
      try {
        const worker = await cachedWorkerPromise;
        await worker.terminate();
      } catch {}
      cachedWorkerPromise = null;
    }
  }, delayMs);
}

/**
 * Extracts text from an Image (File, Blob, or Data URL) using Tesseract.js
 */
async function extractTextFromImage(
  imageInput: string | File | Blob,
  onProgress?: OcrProgressCallback
): Promise<string> {
  const worker = await getOrCreateOcrWorker(onProgress);

  onProgress?.(40, "Scanning image for notice headers and tax clauses...");
  const ret = await worker.recognize(imageInput);

  // Keep worker alive for 3 minutes for subsequent scans or pages
  scheduleWorkerIdleTermination();

  onProgress?.(100, "Text recognition complete.");
  return ret.data.text;
}

/**
 * Universal text extractor for tax documents (supports PDF and all common images)
 */
export async function extractTextFromNoticeFile(
  file: File,
  onProgress?: OcrProgressCallback
): Promise<OcrResult> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  let rawText = "";

  if (isPdf) {
    rawText = await extractTextFromPdf(file, onProgress);
  } else {
    rawText = await extractTextFromImage(file, onProgress);
  }

  // Clean and normalize text
  const cleanedText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const metadata = analyzeNoticeMetadata(cleanedText);

  return {
    text: cleanedText,
    confidence: cleanedText.length > 50 ? 0.92 : 0.65,
    detectedNoticeType: metadata.detectedNoticeType,
    detectedSections: metadata.detectedSections,
    detectedDemandAmount: metadata.detectedDemandAmount,
    detectedDueDate: metadata.detectedDueDate,
  };
}
