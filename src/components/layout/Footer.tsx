import { Link } from "react-router-dom";
import { ShieldCheck, ExternalLink, AlertTriangle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-[#fafafa] text-gray-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-gray-200">
          {/* Brand & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#111111] font-bold text-white text-xs">
                TP
              </div>
              <span className="text-lg font-bold tracking-tight text-[#111111]">
                TaxPlain
              </span>
            </Link>
            <p className="text-sm text-gray-600 max-w-md leading-relaxed">
              Intelligent GST and direct tax document simplification engine designed specifically for Chartered Accountants, tax practitioners, and Indian SME business owners.
            </p>
          </div>

          {/* Quick Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Tax Tools
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/app/gst-explainer" className="hover:text-black transition-colors">
                  GST Clause Explainer
                </Link>
              </li>
              <li>
                <Link to="/app/compliance-checklist" className="hover:text-black transition-colors">
                  Compliance Checklist
                </Link>
              </li>
              <li>
                <Link to="/app/invoice-checker" className="hover:text-black transition-colors">
                  GST Invoice Validator
                </Link>
              </li>
              <li>
                <Link to="/app/itr-helper" className="hover:text-black transition-colors">
                  ITR Section Simplifier
                </Link>
              </li>
              <li>
                <Link to="/app/chat" className="hover:text-black transition-colors">
                  Tax Q&amp;A Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Legal &amp; Policies
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-black transition-colors">
                  Privacy Policy (DPDP Act)
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-black transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://www.gst.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-black transition-colors"
                >
                  GST Portal Official
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://eportal.incometax.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-black transition-colors"
                >
                  Income Tax Portal
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Statutory AI Disclaimer Banner */}
        <div className="pt-6 border-t border-gray-200">
          <div className="rounded-[4px] border border-gray-200 bg-white p-4 text-xs flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-[#111111]">
                Statutory Notice &amp; Educational AI Disclaimer
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                TaxPlain is an artificial intelligence-assisted tax interpretation engine developed strictly for informational and educational purposes. It does not provide formal legal, tax, financial, or auditing advice. Indian tax legislation, notifications, and tribunal rulings are subject to periodic change; always consult a licensed Chartered Accountant (CA) or certified tax professional before making compliance, filing, or commercial decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} TaxPlain. All rights reserved. Crafted for Indian Tax Professionals.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gray-500" />
            <span>Zero Data Storage • Isolated Server Vault</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
