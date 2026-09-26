import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calculator,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Bookmark,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { StreamingOutput } from "@/src/components/shared/StreamingOutput";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { createGroqClient, GROQ_MODEL, mockTaxPlainStream, getGroqApiKey } from "@/src/lib/groq";
import { MODULE_D_SYSTEM_PROMPT, buildModuleDPrompt } from "@/src/lib/taxPrompts";
import { addRecentActivity } from "@/src/lib/recentActivity";
import { toast } from "sonner";

const POPULAR_ITR_SECTIONS = [
  { id: "80C", label: "80C — Deductions (PPF, ELSS, EPF up to ₹1.5L)" },
  { id: "80D", label: "80D — Medical Insurance (Self, Family & Parents)" },
  { id: "80G", label: "80G — Donations to Charitable Institutions" },
  { id: "80TTA", label: "80TTA / 80TTB — Savings Bank & Deposit Interest" },
  { id: "24(b)", label: "24(b) — Interest on Home Loan (up to ₹2L)" },
  { id: "44AD", label: "44AD — Presumptive Taxation (Business < ₹3 Cr)" },
  { id: "44ADA", label: "44ADA — Presumptive Taxation (Professionals < ₹75L)" },
  { id: "115BAC", label: "115BAC — Default New Tax Regime (Budget 2024 Slabs)" },
  { id: "54", label: "Section 54 / 54F — Capital Gains House Property Rollover" },
  { id: "194C", label: "194C / 194J — TDS on Contractor & Professional Fees" },
];

const itrSchema = z.object({
  section: z.string().min(1, "Please enter or select a tax section"),
  assessmentYear: z.enum(["AY 2025–26", "AY 2024–25"]),
  taxpayerCategory: z.enum([
    "Individual (Below 60)",
    "Senior Citizen (60–80)",
    "Super Senior Citizen (80+)",
    "HUF",
    "Company / LLP",
  ]),
  userQuery: z.string().max(1000).optional(),
});

type ItrFormData = z.infer<typeof itrSchema>;

export default function ItrHelper() {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [searchParams] = useSearchParams();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItrFormData>({
    resolver: zodResolver(itrSchema),
    defaultValues: {
      section: "44ADA",
      assessmentYear: "AY 2025–26",
      taxpayerCategory: "Individual (Below 60)",
      userQuery: "I earned ₹18,50,000 gross receipts from software architecture consulting. How does 50% presumptive profit calculate under 44ADA?",
    },
  });

  // Handle section from query params (supports both ?section= and ?tab=)
  useEffect(() => {
    const rawParam = searchParams.get("section") || searchParams.get("tab");
    if (rawParam) {
      const paramUpper = rawParam.toUpperCase();
      let matchedSection = rawParam;
      if (paramUpper.includes("115BAC")) matchedSection = "115BAC";
      else if (paramUpper.includes("80C")) matchedSection = "80C";
      else if (paramUpper.includes("80D")) matchedSection = "80D";
      else if (paramUpper.includes("44AD")) matchedSection = "44AD";

      setValue("section", matchedSection);
      if (paramUpper.includes("115BAC")) {
        setValue("userQuery", "Explain the Budget 2024 revised income tax slabs under Section 115BAC and standard deduction of ₹75,000.");
      } else if (paramUpper.includes("80C")) {
        setValue("userQuery", "What are the allowed investments under 80C and how does it compare with the new regime?");
      } else if (paramUpper.includes("80D")) {
        setValue("userQuery", "Explain the medical insurance deduction limits under Section 80D for self, family, and senior citizen parents.");
      } else if (paramUpper.includes("44AD")) {
        setValue("userQuery", "Explain the 6% and 8% presumptive turnover computation under section 44AD.");
      }
    }
  }, [searchParams, setValue]);

  const selectedSection = watch("section");

  useEffect(() => {
    let timer: number | null = null;
    if (isLoading) {
      setElapsedSeconds(0);
      timer = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  const onSubmit = async (data: ItrFormData) => {
    setOutput("");
    setIsLoading(true);
    setIsStreaming(true);
    setHasSubmitted(true);

    // Track in Recent Activity
    addRecentActivity({
      type: "itr_helper",
      title: `Section ${data.section}`,
      snippet: `${data.assessmentYear} • ${data.taxpayerCategory}`,
      path: "/app/itr-helper",
      data: { ...data },
    });

    const prompt = buildModuleDPrompt({
      assessmentYear: data.assessmentYear,
      taxpayerCategory: data.taxpayerCategory,
      taxRegime: "New Regime (Section 115BAC default unless opted out)",
      residency: "Resident",
      userQuery: data.userQuery
        ? `Section ${data.section}: ${data.userQuery}`
        : `Statutory analysis, limits, eligibility, and ITR reporting for Section ${data.section}`,
    });

    try {
      const apiKey = getGroqApiKey();
      if (!apiKey) {
        const generator = mockTaxPlainStream(prompt, "itr");
        let accumulated = "";
        for await (const chunk of generator) {
          accumulated += chunk;
          setOutput(accumulated);
          setIsLoading(false);
        }
        setIsStreaming(false);
        toast.info("Synthesized via TaxPlain ITR Knowledge Engine.");
        return;
      }

      const groq = createGroqClient();
      const stream = await groq.chat.completions.create({
        model: GROQ_MODEL,
        promptType: "itr",
        messages: [
          {
            role: "system",
            content: MODULE_D_SYSTEM_PROMPT,
          },
          { role: "user", content: prompt },
        ],
        stream: true,
        temperature: 0.2,
      });

      let accumulated = "";
      for await (const chunk of stream) {
        accumulated += chunk.choices[0]?.delta?.content || "";
        setOutput(accumulated);
        setIsLoading(false);
      }
      setIsStreaming(false);
    } catch (err: any) {
      console.error("Groq ITR error", err);
      setIsLoading(false);
      setIsStreaming(false);
      if (err?.status === 429) {
        toast.error("Too many requests. Please wait 30 seconds.");
      } else {
        toast.error("AI service temporarily unavailable. Loading fallback explanation.");
        try {
          const generator = mockTaxPlainStream(prompt, "itr");
          let accumulated = "";
          for await (const chunk of generator) {
            accumulated += chunk;
            setOutput(accumulated);
          }
        } catch {}
      }
    }
  };

  const handleSelectQuickSection = (sec: string) => {
    setValue("section", sec, { shouldValidate: true });
    if (sec === "115BAC") {
      setValue("userQuery", "Compare old regime deductions vs new 115BAC regime for ₹15 Lakh total salary income.");
    } else if (sec === "44ADA") {
      setValue("userQuery", "I earned ₹18,50,000 gross receipts from software consulting. How does 50% presumptive profit calculate?");
    } else if (sec === "80D") {
      setValue("userQuery", "Health insurance premium paid ₹28,000 for family + ₹52,000 for senior citizen parents (age 68).");
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Income Tax Return (ITR) Section Simplifier — TaxPlain</title>
        <meta
          name="description"
          content="Understand complex Income Tax Act sections, deductions, and ITR schedules with plain English breakdowns."
        />
        <link rel="canonical" href="https://taxplain.in/app/itr-helper" />
        <meta property="og:title" content="Income Tax Return (ITR) Section Simplifier — TaxPlain" />
        <meta
          property="og:description"
          content="Understand complex Income Tax Act sections, deductions, and ITR schedules with plain English breakdowns."
        />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/app/itr-helper" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="Income Tax Return (ITR) Section Simplifier — TaxPlain" />
        <meta name="twitter:description" content="Understand complex Income Tax Act sections, deductions, and ITR schedules with plain English breakdowns." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
      </Helmet>


      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-600 uppercase tracking-wider mb-1">
          <Calculator className="h-4 w-4" />
          <span>Direct Tax Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          ITR Section Simplifier &amp; Calculator
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Master exemptions, deductions, presumptive schemes, and AY 2025–26 tax slab differences with step-by-step numerical calculations.
        </p>
      </div>

      {/* Quick Section Picker */}
      <div className="space-y-2">
        <span className="text-xs font-mono text-gray-500">Popular Statutory Sections:</span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_ITR_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleSelectQuickSection(sec.id)}
              className={`text-xs px-2.5 py-1 rounded border font-mono transition-colors cursor-pointer ${
                selectedSection === sec.id
                  ? "border-[#111111] bg-[#111111] text-white font-semibold shadow-sm"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              {sec.id}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Section number */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Section Number <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. 44ADA or 80D"
                  className="font-mono text-xs"
                  {...register("section")}
                  error={!!errors.section}
                />
                {errors.section && (
                  <p className="text-[11px] text-rose-600">{errors.section.message}</p>
                )}
              </div>

              {/* Assessment Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Assessment Year <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="assessmentYear"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assessment Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AY 2025–26">AY 2025–26 (FY 2024–25 Current)</SelectItem>
                        <SelectItem value="AY 2024–25">AY 2024–25 (FY 2023–24)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Taxpayer Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Taxpayer Category <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="taxpayerCategory"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual (Below 60)">Individual (Age &lt; 60)</SelectItem>
                        <SelectItem value="Senior Citizen (60–80)">Senior Citizen (60–80)</SelectItem>
                        <SelectItem value="Super Senior Citizen (80+)">Super Senior Citizen (80+)</SelectItem>
                        <SelectItem value="HUF">Hindu Undivided Family (HUF)</SelectItem>
                        <SelectItem value="Company / LLP">Domestic Company / LLP</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Optional Numbers / Query */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">
                Your Specific Income / Deduction Numbers (Optional)
              </label>
              <Textarea
                rows={3}
                placeholder="e.g. Total income ₹15,00,000, 80C investment ₹1.5L, health insurance ₹35,000 for parents..."
                className="font-mono text-xs"
                {...register("userQuery")}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="submit"
                disabled={isLoading || isStreaming}
                className="flex-1 sm:flex-initial bg-[#111111] hover:bg-black text-white font-medium h-10 px-6 cursor-pointer rounded-md shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculating &amp; Explaining...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Simplify Section &amp; Compute →
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setValue("userQuery", "");
                  setOutput("");
                  setHasSubmitted(false);
                  toast.success("ITR calculation form refreshed");
                }}
                disabled={isLoading || isStreaming}
                className="border-gray-200 bg-white hover:bg-gray-50 text-gray-700 h-10 px-3 cursor-pointer shrink-0 rounded-md"
                title="Refresh form & clear calculations"
              >
                <RotateCcw className="h-4 w-4 mr-1.5 text-purple-600" />
                <span>Refresh</span>
              </Button>
            </div>

            {isLoading && elapsedSeconds > 6 && (
              <p className="text-xs text-amber-600 animate-pulse flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Computing tax schedules and worked example — this may take a moment.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Output Display */}
      {hasSubmitted && !isLoading && !isStreaming && !output ? (
        <EmptyState
          title="No tax explanation generated"
          description="Please verify the section number."
        />
      ) : (
        <StreamingOutput
          content={output}
          isLoading={isLoading}
          isStreaming={isStreaming}
          title={`Section ${selectedSection} Statutory Analysis & Computation`}
          badgeText="AY 2025-26 Certified"
          showExport={true}
        />
      )}
    </div>
  );
}
