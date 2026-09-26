import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col items-center justify-center p-6">
      <Helmet>
        <title>Message Received — TaxPlain</title>
        <meta
          name="description"
          content="Your query has been received by the TaxPlain team. We respond within one business day."
        />
        <link rel="canonical" href="https://taxplain.in/thank-you" />
        <meta property="og:title" content="Message Received — TaxPlain" />
        <meta
          property="og:description"
          content="Your query has been received by the TaxPlain team. We respond within one business day."
        />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/thank-you" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TaxPlain" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="Message Received — TaxPlain" />
        <meta name="twitter:description" content="Your query has been received by the TaxPlain team. We respond within one business day." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
      </Helmet>

      <div className="max-w-md w-full text-center rounded-md border border-gray-200 bg-white p-8 sm:p-10 shadow-sm">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-emerald-600" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Query Received.
        </h1>

        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          We'll respond within one business day at the email you provided.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Link to="/app/gst-explainer" className="w-full sm:w-auto">
            <Button className="w-full bg-[#111111] hover:bg-black text-white font-medium h-10 px-6 rounded-md shadow-sm">
              Open TaxPlain →
            </Button>
          </Link>

          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50 h-10 px-5 rounded-md"
            >
              <Home className="mr-2 h-4 w-4 text-gray-500" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
          TaxPlain Technologies
        </div>
      </div>
    </div>
  );
}
