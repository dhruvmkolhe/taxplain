import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function Privacy() {
  const effectiveDate = "September 3, 2026";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col">
      <Helmet>
        <title>Privacy Policy — TaxPlain</title>
        <meta
          name="description"
          content="Privacy policy of TaxPlain compliant with the Digital Personal Data Protection (DPDP) Act 2023 and Information Technology Act 2000."
        />
        <link rel="canonical" href="https://taxplain.in/privacy" />
        <meta property="og:title" content="Privacy Policy — TaxPlain" />
        <meta
          property="og:description"
          content="Privacy policy of TaxPlain compliant with the Digital Personal Data Protection (DPDP) Act 2023 and Information Technology Act 2000."
        />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/privacy" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TaxPlain" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="Privacy Policy — TaxPlain" />
        <meta name="twitter:description" content="Privacy policy of TaxPlain compliant with the Digital Personal Data Protection (DPDP) Act 2023 and Information Technology Act 2000." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://taxplain.in/" },
            { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://taxplain.in/privacy" }
          ]
        })}</script>
      </Helmet>

      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900 pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-6 sm:p-10 shadow-sm space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center gap-2 text-gray-600 text-xs font-mono mb-2 uppercase tracking-wider">
                <Shield className="h-4 w-4" />
                <span>Legal Compliance</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-gray-500 mt-2">
                Effective Date: {effectiveDate} | Compliant with DPDP Act 2023 &amp; IT Act 2000
              </p>
            </div>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">1. Introduction</h2>
              <p>
                TaxPlain ("we", "our", or "us") operates the TaxPlain online document simplifier and compliance analysis suite. This Privacy Policy informs users regarding the collection, processing, and disclosure of personal data when using our client-side software.
              </p>
              <p>
                We are committed to full compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong> (along with applicable Intermediary Guidelines and Information Security Rules).
              </p>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>
                  <strong>Contact Information:</strong> Full name, professional email address, and CA firm / company name provided willingly through our contact and enterprise inquiry forms.
                </li>
                <li>
                  <strong>Query &amp; Statutory Input Text:</strong> Text passages, GST clauses, notice excerpts, and tax figures pasted into our analysis tools.
                </li>
                <li>
                  <strong>Usage Analytics:</strong> Anonymized telemetry (pageviews, session durations, device types) collected exclusively upon affirmative consent via Google Analytics 4.
                </li>
              </ul>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">3. How Information Is Processed</h2>
              <p>
                We process your information strictly for:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Providing automated statutory breakdown, plain English synthesis, and interactive checklist generation.</li>
                <li>Responding to inquiries or customer partnership requests.</li>
                <li>Monitoring application stability, interface responsiveness, and bug remediation.</li>
              </ul>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">4. Third-Party Service Providers</h2>
              <p>
                To provide high-speed inference without maintaining a vulnerable centralized database of confidential tax documents, our architecture relies on direct browser integration:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>
                  <strong>NVIDIA Corporation (AI Processing):</strong> When you trigger analysis, your query text is processed via NVIDIA NIM enterprise inference endpoints using the <span className="font-mono text-xs text-gray-900 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">deepseek-ai/deepseek-v4-pro-0813</span> model. We do not store your confidential financial queries in any persistent database.
                </li>
                <li>
                  <strong>Google Analytics 4:</strong> Deployed only if you affirmatively accept our analytics cookie banner. Anonymized IP addresses are enforced.
                </li>
              </ul>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">5. Data Retention &amp; Storage Architecture</h2>
              <p>
                <strong>No Central Database:</strong> TaxPlain does not operate a persistent backend user database for clause inputs. Contact submissions are held securely in your browser's local storage unless explicitly submitted for follow-up. Anonymized Google Analytics retention is configured to 26 months.
              </p>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">6. Your Rights Under DPDP Act 2023</h2>
              <p>
                As a Data Principal under Indian law, you have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Request summary details of personal data processed.</li>
                <li>Request correction or erasure of stored contact details.</li>
                <li>Revoke cookie consent at any time by clearing your browser cache.</li>
                <li>File a grievance with our Data Protection Officer.</li>
              </ul>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900">7. Contact &amp; Grievance Redressal</h2>
              <p>
                For privacy inquiries or statutory data requests, contact our designated grievance team:
              </p>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-xs font-mono text-gray-700 space-y-1">
                <p className="text-gray-900 font-semibold">TaxPlain — AI Tax Simplifier</p>
                <p>Grievance Officer: Legal &amp; Compliance Cell</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
