import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  // Track 404 page hits in GA4 so they're distinguishable from normal pageviews (#38)
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "404_page_view", {
        event_category: "error",
        event_label: location.pathname,
        non_interaction: true,
      });
    }
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#111111] flex flex-col items-center justify-center p-6 select-none">
      <Helmet>
        <title>404 — Page Not Found | TaxPlain</title>
        <meta name="description" content="The page you're looking for doesn't exist or has been moved." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="404 — Page Not Found | TaxPlain" />
        <meta property="og:description" content="The page you're looking for doesn't exist or has been moved." />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="404 — Page Not Found | TaxPlain" />
        <meta name="twitter:description" content="The page you're looking for doesn't exist or has been moved." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
      </Helmet>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Large 404 in mono */}
        <div className="font-mono text-gray-900 text-[128px] font-bold leading-none tracking-tight">
          404
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Page not found.
        </h1>

        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto bg-[#111111] hover:bg-black text-white font-medium h-10 px-6 rounded-md shadow-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <Link to="/app/gst-explainer" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gray-200 bg-white text-gray-700 hover:bg-gray-50 h-10 px-6 rounded-md"
            >
              Open the App
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

