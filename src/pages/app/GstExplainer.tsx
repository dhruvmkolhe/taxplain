import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  FileQuestion,
  RotateCcw,
  Upload,
  Check,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { StreamingOutput } from "@/src/components/shared/StreamingOutput";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { NoticeFileUpload } from "@/src/components/shared/NoticeFileUpload";
import { AnalysisSkeletonLoader } from "@/src/components/shared/AnalysisSkeletonLoader";
import { TaxGlossaryFloatingWidget } from "@/src/components/shared/TaxGlossaryCard";
import {
  AnalysisLifecycleProgress,
  AnalysisPhase,
} from "@/src/components/shared/AnalysisLifecycleProgress";
import { createGroqClient, GROQ_MODEL, mockTaxPlainStream, getGroqApiKey } from "@/src/lib/groq";
import { MODULE_A_SYSTEM_PROMPT, buildModuleAPrompt } from "@/src/lib/taxPrompts";
import { addRecentActivity } from "@/src/lib/recentActivity";
import { toast } from "sonner";

const explainerSchema = z.object({
  clause: z
    .string()
    .min(10, "Please paste at least 10 characters of the GST clause or circular.")
    .max(30000, "Maximum limit is 30,000 characters."),
  businessType: z.enum(
    [
      "Sole Proprietor",
      "Partnership Firm",
      "Private Limited",
      "LLP",
      "Public Limited",
      "Non-Profit",
    ],
    { message: "Please choose your business constitution" }
  ),
});

type ExplainerFormData = z.infer<typeof explainerSchema>;

const SAMPLE_CLAUSES = [
  {
    label: "Section 16(4) — ITC Cut-off",
    text: "Section 16(4): A registered person shall not be entitled to take input tax credit in respect of any invoice or debit note for supply of goods or services or both after the thirtieth day of November following the end of financial year to which such invoice or debit note pertains, or furnishing of the relevant annual return, whichever is earlier.",
    type: "Private Limited",
  },
  {
    label: "Section 17(5) — Blocked Credit",
    text: "Section 17(5)(a): Notwithstanding anything contained in sub-section (1) of section 16 and subsection (1) of section 18, input tax credit shall not be available in respect of motor vehicles for transportation of persons having approved seating capacity of not more than thirteen persons (including the driver), except when they are used for making taxable supplies.",
    type: "LLP",
  },
  {
    label: "Section 16(2) — 180 Days Rule",
    text: "Section 16(2) Second Proviso: Where a recipient fails to pay to the supplier of goods or services, other than the supplies on which tax is payable on reverse charge basis, the amount towards the value of supply along with tax payable thereon within a period of one hundred and eighty days from the date of issue of invoice by the supplier, an amount equal to the input tax credit availed by the recipient shall be paid by him along with interest.",
    type: "Sole Proprietor",
  },
  {
    label: "Rule 88C — DRC-01B Notice",
    text: "Rule 88C: Where the tax payable by a registered person in accordance with the statement of outward supplies furnished by him in FORM GSTR-1 exceeds the amount of tax payable in return in FORM GSTR-3B by such percentage and amount as recommended by Council, the said person shall be intimated of such difference electronically on portal and by email in Part A of FORM GST DRC-01B directing him to pay the differential tax or explain reason within 7 days.",
    type: "Private Limited",
  },
  {
    label: "Rule 86B — 1% Cash Payment",
    text: "Rule 86B: Notwithstanding anything contained in these rules, the registered person shall not use the amount available in electronic credit ledger to discharge his liability towards output tax in excess of ninety-nine per cent of such tax liability, in cases where the value of taxable supply other than exempt supply and zero-rated supply, in a month exceeds fifty lakh rupees.",
    type: "Partnership Firm",
  },
];

export default function GstExplainer() {
  const [searchParams] = useSearchParams();
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "upload">("text");
  const [autoSavedTime, setAutoSavedTime] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const AUTOSAVE_KEY = "taxplain_draft_gst_explainer";

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExplainerFormData>({
    resolver: zodResolver(explainerSchema),
    defaultValues: {
      clause: "",
      businessType: "Private Limited",
    },
  });

  // Restore saved draft on initial mount if not loading a preset sample via URL
  useEffect(() => {
    const sampleParam = searchParams.get("sample");
    if (!sampleParam) {
      try {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.clause && parsed.clause.trim().length > 0) {
            setValue("clause", parsed.clause, { shouldValidate: true });
            if (parsed.businessType) {
              setValue("businessType", parsed.businessType);
            }
            if (parsed.output) {
              setOutput(parsed.output);
              setHasSubmitted(true);
            }
            if (parsed.timestamp) {
              const timeStr = new Date(parsed.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              setAutoSavedTime(timeStr);
              toast.info(`Restored draft clause from previous session (${timeStr})`);
            }
          }
        }
      } catch (err) {
        console.warn("Could not parse saved GST explainer draft", err);
      }
    }
  }, [searchParams, setValue]);

  const watchedValues = watch();

  // Auto-save form content to localStorage (debounced)
  useEffect(() => {
    const clauseVal = watchedValues.clause;
    if (clauseVal && clauseVal.trim().length >= 5) {
      const timer = setTimeout(() => {
        try {
          const payload = {
            clause: clauseVal,
            businessType: watchedValues.businessType,
            output: output || "",
            timestamp: Date.now(),
          };
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
          const timeStr = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          setAutoSavedTime(timeStr);
        } catch (e) {
          console.error("Auto-save failed", e);
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [watchedValues.clause, watchedValues.businessType, output]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      setValue("clause", "");
      setOutput("");
      setHasSubmitted(false);
      setAutoSavedTime(null);
      toast.success("Draft cleared");
    } catch {}
  };

  // Handle preloading sample or clause from search query params
  useEffect(() => {
    const sampleParam = searchParams.get("sample");
    if (sampleParam === "16_4") {
      setValue("clause", SAMPLE_CLAUSES[0].text);
      setValue("businessType", SAMPLE_CLAUSES[0].type as any);
    } else if (sampleParam === "17_5") {
      setValue("clause", SAMPLE_CLAUSES[1].text);
      setValue("businessType", SAMPLE_CLAUSES[1].type as any);
    } else if (sampleParam === "16_2") {
      setValue("clause", SAMPLE_CLAUSES[2].text);
      setValue("businessType", SAMPLE_CLAUSES[2].type as any);
    } else if (sampleParam === "29") {
      setValue(
        "clause",
        "Section 29: The proper officer may, either on his own motion or on an application filed by the registered person or by his legal heirs, cancel the registration, in such manner and within such period as may be prescribed, where the business has been discontinued, transferred fully, or where there is any change in the constitution of the business."
      );
    } else if (sampleParam === "50") {
      setValue(
        "clause",
        "Section 50(1): Every person who is liable to pay tax in accordance with the provisions of this Act or the rules made thereunder, but fails to pay the tax or any part thereof to the Government within the period prescribed, shall for the period for which the tax or any part thereof remains unpaid, pay, on his own, interest at such rate, not exceeding eighteen per cent."
      );
    }
  }, [searchParams, setValue]);

  const clauseText = watch("clause") || "";

  // Timer for calls taking > 6 seconds
  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  const onSubmit = async (data: ExplainerFormData) => {
    setOutput("");
    setIsLoading(true);
    setIsStreaming(true);
    setHasSubmitted(true);

    // Track in Recent Activity
    addRecentActivity({
      type: "clause_explainer",
      title: data.clause.length > 36 ? data.clause.slice(0, 36) + "..." : data.clause,
      snippet: `Analysis for ${data.businessType} • Section briefing`,
      path: "/app/gst-explainer",
      data: { clause: data.clause, businessType: data.businessType },
    });

    const systemPrompt = MODULE_A_SYSTEM_PROMPT;
    const userPrompt = buildModuleAPrompt(data.businessType, data.clause);

    try {
      const apiKey = getGroqApiKey();
      if (!apiKey) {
        // Fallback realistic stream
        const generator = mockTaxPlainStream(data.clause, "explainer");
        let accumulated = "";
        for await (const chunk of generator) {
          accumulated += chunk;
          setOutput(accumulated);
          setIsLoading(false);
        }
        setIsStreaming(false);
        toast.info("Evaluated via TaxPlain secure statutory CA engine.");
        return;
      }

      const groq = createGroqClient();
      const stream = await groq.chat.completions.create({
        model: GROQ_MODEL,
        promptType: "explainer",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        temperature: 0.2,
      });

      let accumulated = "";
      for await (const chunk of stream) {
        const textChunk = chunk.choices[0]?.delta?.content || "";
        accumulated += textChunk;
        setOutput(accumulated);
        setIsLoading(false);
      }
      setIsStreaming(false);
    } catch (err: any) {
      console.error("Groq API Error", err);
      setIsLoading(false);
      setIsStreaming(false);

      if (err?.status === 429 || err?.message?.includes("rate limit")) {
        toast.error("Too many requests. Please wait 30 seconds.");
      } else {
        toast.error("AI service unavailable. Please try again in a moment.");
        // Deliver fallback stream so user is never stranded
        try {
          const generator = mockTaxPlainStream(data.clause, "explainer");
          let accumulated = "";
          for await (const chunk of generator) {
            accumulated += chunk;
            setOutput(accumulated);
          }
        } catch {}
      }
    }
  };

  const handleApplySample = (sample: (typeof SAMPLE_CLAUSES)[0]) => {
    setValue("clause", sample.text, { shouldValidate: true });
    setValue("businessType", sample.type as any, { shouldValidate: true });
  };

  const businessType = watch("businessType") || "Private Limited";

  // Compute the current analysis lifecycle phase
  const getAnalysisPhase = (): AnalysisPhase => {
    if (output && !isLoading && !isStreaming) {
      return "complete";
    }
    if (isLoading && !isStreaming) {
      if (elapsedSeconds < 2) return "parsing";
      return "evaluating";
    }
    if (isStreaming) {
      if (output.includes("## Compliance Action Items") || output.includes("## Key Deadlines")) {
        return "synthesizing";
      }
      return "evaluating";
    }
    return "draft";
  };
  const currentPhase = getAnalysisPhase();

  return (
    <div className="space-y-6">
      <Helmet>
        <title>GST Plain English Explainer — TaxPlain</title>
        <meta
          name="description"
          content="Paste any GST clause and get a plain English explanation with compliance action items. No legal jargon."
        />
        <link rel="canonical" href="https://taxplain.in/app/gst-explainer" />
        <meta property="og:title" content="GST Plain English Explainer — TaxPlain" />
        <meta
          property="og:description"
          content="Paste any GST clause and get a plain English explanation with compliance action items. No legal jargon."
        />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/app/gst-explainer" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="GST Plain English Explainer — TaxPlain" />
        <meta name="twitter:description" content="Paste any GST clause and get a plain English explanation with compliance action items. No legal jargon." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
      </Helmet>


      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">
          <FileText className="h-4 w-4 text-gray-700" />
          <span>Core Statutory Analyzer</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          GST Clause Plain English Explainer
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Translate complex CGST/SGST statutory sections, CBIC notifications, and department letters into actionable executive summaries.
        </p>
      </div>

      {/* Visual Step-by-Step Document Analysis Lifecycle Tracker */}
      <AnalysisLifecycleProgress
        phase={currentPhase}
        elapsedSeconds={elapsedSeconds}
        hasInput={clauseText.trim().length >= 10}
        businessType={businessType}
        onJumpToOutput={() => outputRef.current?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* Input Mode Selector: Paste Clause vs Upload Document OCR */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
              inputMode === "text"
                ? "bg-[#111111] text-white shadow-xs"
                : "bg-white text-gray-600 hover:text-black border border-gray-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Type / Paste Statutory Clause</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
              inputMode === "upload"
                ? "bg-[#111111] text-white shadow-xs"
                : "bg-white text-gray-600 hover:text-black border border-gray-200"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Tax Notice / SCN (PDF & OCR)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              OCR
            </span>
          </button>
        </div>

        {inputMode === "upload" && (
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className="text-xs text-gray-500 hover:text-black underline cursor-pointer hidden sm:block"
          >
            Switch to manual editor
          </button>
        )}
      </div>

      {/* Upload OCR Panel or Manual Clause Form */}
      {inputMode === "upload" ? (
        <div className="space-y-4">
          <NoticeFileUpload
            onTextExtracted={(text, meta) => {
              setValue("clause", text);
              setInputMode("text");
              toast.success(`Transferred ${meta?.title || "Tax Notice"} to Explainer Engine`);
            }}
            targetToolName="GST Plain English Explainer"
          />
        </div>
      ) : (
        <>
          {/* Quick sample buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-gray-400 font-mono mr-1">Load sample clause:</span>
            {SAMPLE_CLAUSES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySample(s)}
                className="text-xs px-2.5 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-black transition-colors cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input Form Card */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="clause" className="text-xs font-medium text-gray-700">
                      Paste GST clause, circular, or notification text <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {autoSavedTime && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="h-3 w-3" />
                          <span>Saved ({autoSavedTime})</span>
                          <button
                            type="button"
                            onClick={handleClearDraft}
                            className="ml-1 text-red-600 hover:underline cursor-pointer"
                            title="Clear saved draft"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                      <span
                        className={`text-[11px] font-mono transition-colors ${
                          clauseText.length > 4900
                            ? "text-red-600 font-semibold"
                            : clauseText.length > 4000
                            ? "text-amber-600 font-semibold"
                            : "text-gray-400"
                        }`}
                      >
                        {clauseText.length}/5000 chars
                      </span>
                    </div>
                  </div>

                  <Textarea
                    id="clause"
                    rows={6}
                    placeholder="e.g. Section 16(4) — Input tax credit in respect of a supply shall not be availed after the due date of furnishing of the return under section 39 for the month of September..."
                    className="font-mono text-xs sm:text-sm min-h-48 leading-relaxed"
                    {...register("clause")}
                    error={!!errors.clause}
                  />
                  {errors.clause && (
                    <p className="flex items-center gap-1 text-xs text-red-600 pt-0.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.clause.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Business Type selector */}
                  <div className="sm:col-span-7 space-y-1.5">
                    <label htmlFor="businessType" className="text-xs font-medium text-gray-700">
                      Your Business Constitution <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="businessType"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger id="businessType" error={!!errors.businessType}>
                            <SelectValue placeholder="Select Business Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                            <SelectItem value="Partnership Firm">Partnership Firm</SelectItem>
                            <SelectItem value="Private Limited">Private Limited Company</SelectItem>
                            <SelectItem value="LLP">Limited Liability Partnership (LLP)</SelectItem>
                            <SelectItem value="Public Limited">Public Limited Company</SelectItem>
                            <SelectItem value="Non-Profit">Section 8 / Non-Profit</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Action Buttons: Submit & Refresh */}
                  <div className="sm:col-span-5 flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading || isStreaming}
                      className="flex-1 bg-[#111111] hover:bg-black text-white font-medium h-11 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analysing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Explain →
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearDraft}
                      disabled={isLoading || isStreaming}
                      className="border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-black h-11 px-3 cursor-pointer shrink-0"
                      title="Refresh form & clear output"
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5 text-gray-700" />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </div>

                {/* Subtle note for calls taking > 6 seconds */}
                {isLoading && elapsedSeconds > 6 && (
                  <p className="text-xs text-amber-600 animate-pulse flex items-center gap-1.5 pt-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing complex clause — this may take a moment.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {/* Output Display Area with Skeleton Loaders & Spinners */}
      <div ref={outputRef} id="explainer-output-area">
        {isLoading && !isStreaming ? (
          <AnalysisSkeletonLoader
            type="explainer"
            elapsedSeconds={elapsedSeconds}
            documentTitle={clauseText.slice(0, 50)}
          />
        ) : !output ? (
          <EmptyState
            type="explainer"
            samplePills={SAMPLE_CLAUSES.slice(0, 4).map((s) => ({
              label: s.label,
              onClick: () => handleApplySample(s),
            }))}
          />
        ) : (
          <StreamingOutput
            content={output}
            isLoading={false}
            isStreaming={isStreaming}
            title="GST Plain English Breakdown & Action Items"
            badgeText="NVIDIA DeepSeek V4 • Senior CA Advisory"
            showExport={true}
          />
        )}
      </div>

      {/* Searchable Tax Terminology Floating QuickRef Card */}
      <TaxGlossaryFloatingWidget />
    </div>
  );
}
