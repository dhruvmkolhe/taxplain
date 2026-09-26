import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function Terms() {
  const effectiveDate = "September 3, 2026";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col">
      <Helmet>
        <title>Terms of Service — TaxPlain</title>
        <meta
          name="description"
          content="Terms of service and legal disclaimer governing the usage of TaxPlain AI tax simplification platform."
        />
        <link rel="canonical" href="https://taxplain.in/terms" />
        <meta property="og:title" content="Terms of Service — TaxPlain" />
        <meta
          property="og:description"
          content="Terms of service and legal disclaimer governing the usage of TaxPlain AI tax simplification platform."
        />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/terms" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TaxPlain" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="Terms of Service — TaxPlain" />
        <meta name="twitter:description" content="Terms of service and legal disclaimer governing the usage of TaxPlain AI tax simplification platform." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://taxplain.in/" },
            { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://taxplain.in/terms" }
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
                <Scale className="h-4 w-4" />
                <span>Legal Terms &amp; Conditions</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Terms of Service</h1>
              <p className="text-xs text-gray-500 mt-2">
                Effective Date: {effectiveDate} | Jurisdiction: Vadodara, Gujarat, India
              </p>
            </div>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">1. Nature of Service — Critical Disclaimer</h2>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs leading-relaxed">
                <strong>IMPORTANT NOTICE:</strong> TaxPlain is an automated software tool utilizing artificial intelligence for educational, drafting, and syntactic simplification purposes. TaxPlain does NOT provide formal legal opinions, audit certifications, or chartered accountancy services under the Chartered Accountants Act, 1949. All outputs must be independently vetted by a licensed Chartered Accountant or tax advocate before being relied upon for return filing, litigation, or compliance representations.
              </div>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">2. Acceptable Use &amp; Prohibited Conduct</h2>
              <p>
                You agree to use TaxPlain solely for legitimate compliance analysis, document comprehension, and professional workflow optimization. You expressly agree NOT to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Use the software for tax evasion, creating fraudulent invoices, or misrepresenting financial disclosures to tax authorities under the CGST Act 2017 or Income Tax Act 1961.</li>
                <li>Submit unlawful, defamatory, or infringing confidential third-party records without requisite authorization.</li>
                <li>Attempt to reverse-engineer, scrape, rate-limit abuse, or inject malicious payloads into our application interfaces.</li>
              </ul>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">3. Accuracy of AI Output &amp; Disclaimers</h2>
              <p>
                While our model is tuned to Indian tax jurisprudence, tax law evolves dynamically via notifications, circulars, and judicial rulings (AAR, High Courts, Supreme Court). TaxPlain provides all services on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranty of statutory completeness or judicial finality.
              </p>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">4. Intellectual Property</h2>
              <p>
                The TaxPlain software architecture, UI components, brand design, and documentation remain the exclusive intellectual property of TaxPlain. Analysis outputs generated from your input text are licensed to you for your lawful professional and commercial use.
              </p>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900">5. Limitation of Liability</h2>
              <p>
                Under no circumstances shall TaxPlain, its developers, or associated institutions be liable for any direct, indirect, incidental, punitive, or consequential damages, including but not limited to penalties levied by the GST Council, tax assessments, interest under Section 50, or lost business profits arising from the use of or inability to use this platform.
              </p>
            </section>

            <section className="space-y-3 text-sm text-gray-700 leading-relaxed border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900">6. Governing Law &amp; Jurisdiction</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the substantive laws of the Republic of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>New Delhi, India</strong>.
              </p>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-xs font-mono text-gray-700 space-y-1 mt-4">
                <p className="text-gray-900 font-semibold">TaxPlain Legal Department</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
