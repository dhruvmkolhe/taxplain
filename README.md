# TaxPlain — AI Tax Simplification & Compliance Suite

TaxPlain is an intelligent, high-speed Indian Statutory GST and Direct Tax simplification suite built specifically for **Chartered Accountants (CAs), tax practitioners, and SME business owners**.

It translates complex statutory tax clauses, CBIC circulars, notice intimations, and ITR schedules into actionable, plain-English guidance and audit-ready briefings.

---

## Key Features

- 📄 **GST Clause Explainer**
  Instantly translates statutory sections (e.g., Section 16(4) ITC cutoffs, Section 17(5) blocked credits, 180-day supplier payment provisos) and CBIC circulars into plain-English summaries, cash flow impact assessments, and actionable compliance steps.

- 📋 **Compliance Checklist Generator**
  Generates custom GST return pre-filing audit checklists (GSTR-1, GSTR-3B, GSTR-9) tailored to specific turnover thresholds, business legal structures (Pvt Ltd, LLP, Sole Proprietor), and state jurisdictions.

- 🔍 **Rule 46 Invoice Validator**
  Audits B2B tax invoices against 16 mandatory statutory disclosure particulars under Rule 46 of CGST Rules 2017, validating GSTIN checksums, HSN/SAC classifications, tax rates, and e-invoice QR compliance.

- 🧮 **ITR Section Simplifier**
  Simplifies direct tax provisions under the Income Tax Act 1961, including presumptive taxation (Section 44AD / 44ADA), home loan interest (Section 24(b)), medical deductions (Section 80D), and Old vs. New Tax Regime (Section 115BAC) comparisons.

- 💬 **Pinned Tax Q&A Assistant**
  A dedicated conversational AI assistant pinned to full-height view for interactive tax consultations, DRC-01 notice reply strategies, and tribunal precedent breakdowns.

- 🔒 **Defense-in-Depth Security Vault**
  Server-side API key isolation (NVIDIA NIM DeepSeek V4 Pro), cryptographically signed CSRF tokens, strict rate limiting, input sanitization against prompt injection, and full DPDP Act 2023 compliance.

---

## Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, React Router v7 |
| **Build Tool & Bundler** | Vite 6, Esbuild |
| **Styling & UI System** | Tailwind CSS v4, Radix UI Primitives, Lucide Icons |
| **Data Visualization** | Recharts |
| **Backend & API Proxy** | Express.js, Vercel Serverless Functions (`api/index.ts`) |
| **Primary AI Engine** | NVIDIA NIM API (`deepseek-ai/deepseek-v4-pro-0813`) |
| **Fallback Engine** | Built-in Statutory Intelligence Generator (Offline-ready) |
| **Type System** | TypeScript 5.8 |

---

## Local Development

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm** or **pnpm** / **bun**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dhruvmkolhe/taxplain.git
   cd taxplain
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your NVIDIA NIM API key:
   ```env
   NVIDIA_API_KEY=nvapi-your-key-here
   NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
   NVIDIA_MODEL=deepseek-ai/deepseek-v4-pro-0813
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Building & Verification

To verify production builds:
```bash
# Type check without emitting
npm run lint

# Production build (Vite SPA + Esbuild server bundle)
npm run build
```

---

## Deployment

### Deploying on Vercel

TaxPlain is fully optimized for **Vercel** out of the box:

1. Import the repository on [Vercel](https://vercel.com/new).
2. Vercel will automatically read `vercel.json`:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set your `NVIDIA_API_KEY` under **Project Settings → Environment Variables**.
4. Click **Deploy**.

The `vercel.json` rewrite configuration handles both static Vite SPA routing and Vercel Serverless functions (`/api/*`).

### Deploying on VPS / Docker / Cloud Run

To run TaxPlain as a standalone Express server:
```bash
npm run build
npm start
```
The server will run on `http://0.0.0.0:3000`.

---

## Statutory & Educational Disclaimer

> **Educational & Analytical Purpose Only**: TaxPlain is an AI-assisted tax interpretation platform developed strictly for informational and educational purposes. It does not constitute formal legal, tax, financial, or audit advice. Indian tax laws, notifications, and tribunal rulings are dynamic; please consult a qualified Chartered Accountant (CA) or certified tax practitioner for official filings and advisory.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
