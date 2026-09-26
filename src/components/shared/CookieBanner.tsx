import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { ShieldCheck, X } from "lucide-react";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("taxplain_cookie_consent");
      if (!consent) {
        setShow(true);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("taxplain_cookie_consent", "accepted");
      if (typeof window !== "undefined") {
        const gaId = (window as any).__GA_MEASUREMENT_ID__;
        if (gaId && gaId !== "G-XXXXXXXXXX") {
          const gaScript = document.createElement("script");
          gaScript.async = true;
          gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
          document.head.appendChild(gaScript);
          if ((window as any).gtag) {
            (window as any).gtag("js", new Date());
            (window as any).gtag("config", gaId, { anonymize_ip: true });
          }
        }
      }
    } catch (e) {}
    setShow(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("taxplain_cookie_consent", "declined");
    } catch (e) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 rounded border border-gray-200 bg-white p-4 text-[#111111] shadow-lg transition-all animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded bg-gray-100 p-2 text-gray-700 shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-[#111111] mb-1">Privacy &amp; Analytics Consent</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            We use cookies for analytics to improve TaxPlain. Note: your tax queries are processed by NVIDIA's AI API.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAccept}
              className="bg-[#111111] hover:bg-black text-white text-xs px-3 py-1.5 h-8 font-medium"
            >
              Accept Analytics
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDecline}
              className="text-xs text-gray-500 hover:text-black px-3 py-1.5 h-8"
            >
              Decline
            </Button>
          </div>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Close cookie consent banner"
          className="text-gray-400 hover:text-black p-1 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
