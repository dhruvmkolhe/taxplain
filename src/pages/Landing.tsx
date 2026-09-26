import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  FileText,
  CheckSquare,
  FileCheck,
  Calculator,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { MobileCTABar } from "@/src/components/layout/MobileCTABar";
import { CookieBanner } from "@/src/components/shared/CookieBanner";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { toast } from "sonner";

// Contact form schema
const contactSchema = z.object({
  name: z.string().min(2, "Full name is required (at least 2 characters)"),
  email: z.string().email("Please enter a valid business email address"),
  firmName: z.string().min(2, "Firm or Company name is required"),
  queryType: z.enum(["General", "Partnership", "Demo Request", "Bug Report"], {
    message: "Please select a query category",
  }),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Landing() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      firmName: "",
      queryType: "General",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);
      // Simulate asynchronous sending and store to localStorage
      await new Promise((resolve) => setTimeout(resolve, 900));

      const existingSubmissions = JSON.parse(
        localStorage.getItem("taxplain_contact_submissions") || "[]"
      );
      existingSubmissions.push({
        ...data,
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem("taxplain_contact_submissions", JSON.stringify(existingSubmissions));

      // Track contact form conversion
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "form_submit", {
          event_category: "conversion",
          event_label: `contact_form_${data.queryType.toLowerCase().replace(/ /g, "_")}`,
        });
      }

      toast.success("Inquiry received. Redirecting to confirmation...");
      navigate("/thank-you");
    } catch {
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col">
      <Helmet>
        <title>TaxPlain — GST Clause Explainer for CAs &amp; SMEs in India</title>
        <meta
          name="description"
          content="Instantly translate complex GST clauses and tax notices into plain English. Built for Chartered Accountants and small business owners in India."
        />
        <link rel="canonical" href="https://taxplain.in/" />
        {/* Open Graph */}
        <meta property="og:title" content="TaxPlain — GST Clause Explainer for CAs & SMEs in India" />
        <meta
          property="og:description"
          content="Instantly translate complex GST clauses and tax notices into plain English. Built for Chartered Accountants and small business owners in India."
        />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally. AI-powered tax simplification for CAs & SMEs in India." />
        <meta property="og:url" content="https://taxplain.in/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TaxPlain" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="TaxPlain — GST Clause Explainer for CAs & SMEs in India" />
        <meta name="twitter:description" content="Instantly translate complex GST clauses and tax notices into plain English. Built for Chartered Accountants and small business owners in India." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
        {/* JSON-LD: SoftwareApplication */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "TaxPlain",
          "url": "https://taxplain.in/",
          "description": "AI-powered Indian GST and income tax simplification platform. Translates complex GST clauses, CBIC circulars, and Income Tax Act sections into plain English for Chartered Accountants and SME owners.",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
          },
          "audience": {
            "@type": "BusinessAudience",
            "audienceType": "Chartered Accountants, SME Business Owners, Tax Practitioners"
          },
          "creator": {
            "@type": "Organization",
            "name": "TaxPlain Technologies",
            "url": "https://taxplain.in/",
            "email": "contact@taxplain.in",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Cyber City, Tower B",
              "addressLocality": "Gurugram",
              "addressRegion": "Haryana",
              "postalCode": "122002",
              "addressCountry": "IN"
            }
          }
        })}</script>
        {/* JSON-LD: WebSite with SearchAction */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "TaxPlain",
          "url": "https://taxplain.in/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://taxplain.in/app/gst-explainer?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })}</script>
      </Helmet>

      {/* Sticky Top Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION — MINIMALIST LIGHT REDESIGN */}
        <section
          id="hero"
          className="relative min-h-[calc(100vh-4rem)] border-b border-gray-200 bg-white flex flex-col justify-center"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
            {/* Left Column: Headline & Action */}
            <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-center z-10">
              <div className="space-y-6 max-w-xl">
                {/* Live Engine Pill */}
                <div className="inline-flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>DeepSeek V4 Pro • NVIDIA NIM Inference</span>
                </div>

                <h1 className="text-[40px] sm:text-[48px] lg:text-[54px] font-bold leading-[1.1] tracking-tight text-[#111111]">
                  GST Plain English.<br />
                  <span className="text-[#111111]">Finally.</span>
                </h1>

                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  Paste any GST clause or tax notice. Get a plain English explanation, compliance checklist, and action items — in seconds.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined" && (window as any).gtag) {
                        (window as any).gtag("event", "cta_click", {
                          event_category: "engagement",
                          event_label: "hero_explain_gst_clause",
                        });
                      }
                      navigate("/app/gst-explainer");
                    }}
                    className="bg-[#111111] hover:bg-black text-white px-7 py-3.5 rounded font-semibold text-sm sm:text-base flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    Explain a GST Clause <span className="text-xl">→</span>
                  </button>

                  <a href="#how-it-works">
                    <button className="text-gray-600 px-5 py-3.5 rounded font-medium text-sm sm:text-base hover:text-black border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
                      See how it works
                    </button>
                  </a>
                </div>

                {/* Trust Metrics Strip */}
                <div className="pt-8 border-t border-gray-200 mt-8">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4 font-mono">
                    Trusted by CAs across India
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-200 px-3 sm:px-4 py-3 rounded">
                      <div className="text-[#111111] font-bold text-lg sm:text-xl">500+</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Clauses Explained</div>
                    </div>
                    <div className="bg-white border border-gray-200 px-3 sm:px-4 py-3 rounded">
                      <div className="text-[#111111] font-bold text-lg sm:text-xl">40+</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">GST Sections</div>
                    </div>
                    <div className="bg-white border border-gray-200 px-3 sm:px-4 py-3 rounded">
                      <div className="text-[#111111] font-bold text-lg sm:text-xl">Live</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">AY 2025 Updates</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Engine Preview Card */}
            <div className="lg:col-span-7 bg-[#fafafa] p-6 sm:p-8 lg:p-12 flex items-center justify-center relative border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="w-full max-w-2xl bg-white border border-gray-200 rounded shadow-sm relative z-10 flex flex-col my-4">
                {/* Window Bar */}
                <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-[#fafafa] rounded-t">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">Section 16(4) — TaxPlain Intelligence</span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-400 tracking-widest">ANALYSIS_ENGINE_V1.0</div>
                </div>

                {/* Window Content */}
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] uppercase tracking-widest text-gray-400 font-bold font-mono">
                      Input: Section 16(4) Clause
                    </label>
                    <div className="bg-gray-50 border border-gray-200 p-3.5 sm:p-4 rounded font-mono text-xs sm:text-sm text-gray-900 leading-relaxed">
                      "Input tax credit in respect of any invoice or debit note shall not be availed after the 30th day of November following the end of financial year to which such invoice relates..."
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] flex-1 bg-gray-200" />
                      <div className="bg-gray-100 border border-gray-200 text-gray-800 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
                        AI Simplified Report
                      </div>
                      <div className="h-[1px] flex-1 bg-gray-200" />
                    </div>

                    <div>
                      <h4 className="text-gray-900 font-bold text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                        <span>Plain English Summary</span>
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        You cannot claim GST credit for a purchase after the annual deadline, which is typically the GSTR-3B filing date for November of the following financial year. Missing this means you lose the money forever.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-50 p-3.5 rounded border border-gray-200">
                        <div className="text-[10px] text-gray-900 font-bold uppercase mb-2 font-mono">Compliance Actions</div>
                        <ul className="text-[11px] text-gray-600 space-y-1.5">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Reconcile GSTR-2B before cutoff</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Flag pending supplier invoices</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 p-3.5 rounded border border-gray-200">
                        <div className="text-[10px] text-gray-900 font-bold uppercase mb-2 font-mono">Key Deadline</div>
                        <div className="text-gray-900 font-mono text-xs sm:text-sm font-bold">30th November</div>
                        <p className="text-[10px] text-gray-500 mt-1">For previous financial year invoices</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Window Bottom Actions */}
                <div className="px-4 py-3 bg-[#fafafa] border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 rounded-b">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/app/gst-explainer")}
                      className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-[11px] font-medium border border-gray-200 transition-colors cursor-pointer"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("Input tax credit in respect of any invoice or debit note shall not be availed after the 30th day of November following the end of financial year to which such invoice relates...");
                        toast.success("Sample Section 16(4) clause copied to clipboard!");
                      }}
                      className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-[11px] font-medium border border-gray-200 transition-colors cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                  <button
                    onClick={() => navigate("/app/gst-explainer")}
                    className="text-gray-900 hover:text-black text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Try Live Engine →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION (4 FEATURE CARDS) */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
              Capabilities
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
              Engineered for Chartered Accountants &amp; SMEs
            </h3>
            <p className="mt-3 text-sm sm:text-base text-gray-500">
              Replace legalese deciphering with instant statutory clarity, interactive compliance checklists, and invoice verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <Card className="border-gray-200 bg-white hover:border-gray-300 transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3 border-none">
                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-800 mb-3 border border-gray-200">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-[#111111]">
                  GST Clause Explainer
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed pt-1">
                  Translate complex circulars, notifications, and CGST/SGST statutory sections into clean, actionable plain English.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  to="/app/gst-explainer"
                  className="inline-flex items-center text-xs font-medium text-[#111111] hover:underline group"
                >
                  Launch Explainer
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-gray-200 bg-white hover:border-gray-300 transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3 border-none">
                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-800 mb-3 border border-gray-200">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-[#111111]">
                  Compliance Checklist
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed pt-1">
                  Generate profile-specific filing checklists tailored to your turnover slab, state jurisdiction, and tax period.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  to="/app/compliance-checklist"
                  className="inline-flex items-center text-xs font-medium text-[#111111] hover:underline group"
                >
                  Generate Checklist
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-gray-200 bg-white hover:border-gray-300 transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3 border-none">
                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-800 mb-3 border border-gray-200">
                  <FileCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-[#111111]">
                  Invoice Validator
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed pt-1">
                  Audit 15-digit GSTIN formats, HSN codes, and CGST/SGST vs IGST tax split integrity prior to return filing.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  to="/app/invoice-checker"
                  className="inline-flex items-center text-xs font-medium text-[#111111] hover:underline group"
                >
                  Validate Invoices
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-gray-200 bg-white hover:border-gray-300 transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3 border-none">
                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-800 mb-3 border border-gray-200">
                  <Calculator className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-[#111111]">
                  ITR Section Simplifier
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed pt-1">
                  Break down ITR schedules from ITR-1 to ITR-7 with numerical worked examples tailored for AY 2025-26.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  to="/app/itr-helper"
                  className="inline-flex items-center text-xs font-medium text-[#111111] hover:underline group"
                >
                  Simplify ITR
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <section id="how-it-works" className="py-20 border-t border-gray-200 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
                Workflow
              </h2>
              <h3 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                Three Steps to Statutory Certainty
              </h3>
              <p className="mt-3 text-sm sm:text-base text-gray-500">
                Eliminate hours of manual circular cross-referencing and GST portal searching.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="rounded border border-gray-200 bg-white p-6 relative">
                <div className="font-mono text-xs text-gray-500 font-semibold mb-2">STEP 01</div>
                <h4 className="text-lg font-semibold text-[#111111] mb-2">Paste Statutory Text</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Paste raw text from a GST section, CBIC circular, department show cause notice, or client query directly into our editor.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded border border-gray-200 bg-white p-6 relative">
                <div className="font-mono text-xs text-gray-500 font-semibold mb-2">STEP 02</div>
                <h4 className="text-lg font-semibold text-[#111111] mb-2">NVIDIA DeepSeek V4 Synthesis</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Our Indian tax-calibrated prompt dissects practical implications, compliance cutoff dates, and statutory cross-references.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded border border-gray-200 bg-white p-6 relative">
                <div className="font-mono text-xs text-gray-500 font-semibold mb-2">STEP 03</div>
                <h4 className="text-lg font-semibold text-[#111111] mb-2">Export Actionable Brief</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Export audit-ready executive PDF briefs or copy plain text summaries to share directly with clients and business partners.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR (TWO COLUMNS: CAS vs SME OWNERS) */}
        <section id="for-cas" className="py-20 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
                Tailored Solutions
              </h2>
              <h3 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                Who Benefits from TaxPlain
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Column 1: For CAs & Tax Practitioners */}
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-[#111111]">
                        Chartered Accountants &amp; Practitioners
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        Scale advisory capacity and accelerate team training
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Explain complex GST notifications to articles and junior associates with structured breakdown.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Generate custom client briefing memos in plain language without repetitive manual drafting.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Quickly check statutory deadlines like Section 16(4) cutoff and Rule 88C intimations.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Instant worked numerical calculations for AY 2025-26 under new regime Section 115BAC.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Column 2: For SME Business Owners */}
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-[#111111]">
                        SME Founders &amp; Business Owners
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        Master your compliance obligations without fear
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Understand show cause notices and department letters before consulting your retainer CA.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Prevent blocked input tax credit (ITC) on motor vehicles, catering, or delayed vendor filings.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Validate outbound sales invoices against mandatory GST rules to prevent recipient rejection.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Maintain zero-penalty filing hygiene with profile-based monthly and quarterly checklists.</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CONTACT FORM SECTION */}
        <section id="contact" className="py-20 border-t border-gray-200 bg-[#fafafa]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
                Connect With Us
              </h2>
              <h3 className="text-3xl font-bold tracking-tight text-[#111111]">
                Contact the TaxPlain Team
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Inquire about custom CA firm deployments, API integrations, or feature requests.
              </p>
            </div>

            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        placeholder="e.g. CA Rajesh Shah"
                        {...register("name")}
                        error={!!errors.name}
                      />
                      {errors.name && (
                        <p className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-medium text-gray-700">
                        Business Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="rajesh@taxfirm.in"
                        {...register("email")}
                        error={!!errors.email}
                      />
                      {errors.email && (
                        <p className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Firm Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="firmName" className="text-xs font-medium text-gray-700">
                        Firm / Company Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="firmName"
                        placeholder="R. Shah & Associates"
                        {...register("firmName")}
                        error={!!errors.firmName}
                      />
                      {errors.firmName && (
                        <p className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.firmName.message}
                        </p>
                      )}
                    </div>

                    {/* Query Type */}
                    <div className="space-y-1.5">
                      <label htmlFor="queryType" className="text-xs font-medium text-gray-700">
                        Query Type <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="queryType"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger id="queryType" error={!!errors.queryType}>
                              <SelectValue placeholder="Select query category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="General">General Inquiry</SelectItem>
                              <SelectItem value="Partnership">CA Firm Partnership</SelectItem>
                              <SelectItem value="Demo Request">Enterprise Demo Request</SelectItem>
                              <SelectItem value="Bug Report">Feedback / Bug Report</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.queryType && (
                        <p className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.queryType.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-medium text-gray-700">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about your practice or specific compliance workflow questions..."
                      {...register("message")}
                      error={!!errors.message}
                    />
                    {errors.message && (
                      <p className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#111111] hover:bg-black text-white font-medium h-11 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Sticky Mobile CTA on Landing page */}
      <MobileCTABar />

      {/* Footer with statutory corporate address */}
      <Footer />

      {/* Cookie Consent */}
      <CookieBanner />
    </div>
  );
}
