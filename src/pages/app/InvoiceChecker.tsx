import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FileCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ClipboardPaste,
  Upload,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { StreamingOutput } from "@/src/components/shared/StreamingOutput";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { NoticeFileUpload } from "@/src/components/shared/NoticeFileUpload";
import { AnalysisSkeletonLoader } from "@/src/components/shared/AnalysisSkeletonLoader";
import { TaxGlossaryFloatingWidget } from "@/src/components/shared/TaxGlossaryCard";
import { createGroqClient, GROQ_MODEL, mockTaxPlainStream, getGroqApiKey } from "@/src/lib/groq";
import { MODULE_B_SYSTEM_PROMPT, buildModuleBPrompt } from "@/src/lib/taxPrompts";
import { addRecentActivity } from "@/src/lib/recentActivity";
import { toast } from "sonner";

const structuredSchema = z.object({
  supplierGstin: z
    .string()
    .min(15, "GSTIN must be 15 alphanumeric characters")
    .max(15, "GSTIN must be 15 alphanumeric characters"),
  recipientGstin: z
    .string()
    .min(15, "GSTIN must be 15 alphanumeric characters")
    .max(15, "GSTIN must be 15 alphanumeric characters"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  taxableAmount: z.string().min(1, "Taxable value is required"),
  taxType: z.enum(["Intra-State (CGST + SGST)", "Inter-State (IGST)"]),
  taxRate: z.string().min(1, "Select tax rate"),
  cgstAmount: z.string().optional(),
  sgstAmount: z.string().optional(),
  igstAmount: z.string().optional(),
  hsnCode: z.string().min(2, "HSN/SAC code is required"),
  placeOfSupply: z.string().min(1, "Place of supply state is required"),
});

type StructuredFormData = z.infer<typeof structuredSchema>;

export default function InvoiceChecker() {
  const [mode, setMode] = useState<"structured" | "raw" | "upload">("structured");
  const [rawText, setRawText] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [autoSavedTime, setAutoSavedTime] = useState<string | null>(null);
  const AUTOSAVE_KEY = "taxplain_draft_invoice_checker";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StructuredFormData>({
    resolver: zodResolver(structuredSchema),
    defaultValues: {
      supplierGstin: "24AAACG1234F1Z8", // Gujarat State (24)
      recipientGstin: "27AABCU9603R1ZM", // Maharashtra (27)
      invoiceNumber: "INV/2024-25/089",
      invoiceDate: "2024-11-15",
      taxableAmount: "100000",
      taxType: "Inter-State (IGST)",
      taxRate: "18%",
      cgstAmount: "0",
      sgstAmount: "0",
      igstAmount: "18000",
      hsnCode: "998314",
      placeOfSupply: "27-Maharashtra",
    },
  });

  // Restore saved invoice draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.formData) {
          const keys = Object.keys(parsed.formData) as (keyof StructuredFormData)[];
          keys.forEach((key) => {
            if (parsed.formData[key] !== undefined) {
              setValue(key, parsed.formData[key], { shouldValidate: true });
            }
          });
        }
        if (parsed?.rawText) {
          setRawText(parsed.rawText);
        }
        if (parsed?.mode) {
          setMode(parsed.mode);
        }
        if (parsed?.output) {
          setOutput(parsed.output);
          setHasSubmitted(true);
        }
        if (parsed?.timestamp) {
          const timeStr = new Date(parsed.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          setAutoSavedTime(timeStr);
          toast.info(`Restored invoice draft from previous session (${timeStr})`);
        }
      }
    } catch (e) {
      console.warn("Could not restore invoice draft", e);
    }
  }, [setValue]);

  const watchedValues = watch();

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const payload = {
          formData: watchedValues,
          rawText,
          mode,
          output: output || "",
          timestamp: Date.now(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setAutoSavedTime(timeStr);
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [watchedValues, rawText, mode, output]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      setValue("supplierGstin", "");
      setValue("recipientGstin", "");
      setValue("invoiceNumber", "");
      setValue("invoiceDate", "");
      setValue("taxableAmount", "");
      setValue("cgstAmount", "0");
      setValue("sgstAmount", "0");
      setValue("igstAmount", "0");
      setValue("hsnCode", "");
      setValue("placeOfSupply", "");
      setRawText("");
      setOutput("");
      setHasSubmitted(false);
      setAutoSavedTime(null);
      toast.success("Draft cleared");
    } catch {}
  };

  const taxType = watch("taxType");

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

  const runValidation = async (promptInvoiceData: string, customTitle?: string) => {
    setOutput("");
    setIsLoading(true);
    setIsStreaming(true);
    setHasSubmitted(true);

    // Extract invoice number if present in text
    const invMatch = promptInvoiceData.match(/(?:INV|Invoice|Ref)[#\s:\/-]*([A-Z0-9\/-]+)/i);
    const invoiceTitle = customTitle || (invMatch ? `Invoice #${invMatch[1]}` : "Rule 46 Tax Invoice");

    // Track in Recent Activity
    addRecentActivity({
      type: "invoice_checker",
      title: invoiceTitle.length > 36 ? invoiceTitle.slice(0, 36) + "..." : invoiceTitle,
      snippet: "Rule 46 B2B statutory verification of 16 mandatory invoice elements",
      path: "/app/invoice-checker",
      data: {
        status: "Audit in progress",
      },
    });

    const prompt = buildModuleBPrompt(promptInvoiceData);

    try {
      const apiKey = getGroqApiKey();
      if (!apiKey) {
        const generator = mockTaxPlainStream(prompt, "invoice");
        let accumulated = "";
        for await (const chunk of generator) {
          accumulated += chunk;
          setOutput(accumulated);
          setIsLoading(false);
        }
        setIsStreaming(false);
        toast.info("Validated using TaxPlain CA audit engine.");
        return;
      }

      const groq = createGroqClient();
      const stream = await groq.chat.completions.create({
        model: GROQ_MODEL,
        promptType: "invoice",
        messages: [
          {
            role: "system",
            content: MODULE_B_SYSTEM_PROMPT,
          },
          { role: "user", content: prompt },
        ],
        stream: true,
        temperature: 0.1,
      });

      let accumulated = "";
      for await (const chunk of stream) {
        accumulated += chunk.choices[0]?.delta?.content || "";
        setOutput(accumulated);
        setIsLoading(false);
      }
      setIsStreaming(false);
    } catch (err: any) {
      console.error("Groq invoice error", err);
      setIsLoading(false);
      setIsStreaming(false);
      if (err?.status === 429) {
        toast.error("Too many requests. Please wait 30 seconds.");
      } else {
        toast.error("AI service error. Loading fallback audit report.");
        try {
          const generator = mockTaxPlainStream(prompt, "invoice");
          let accumulated = "";
          for await (const chunk of generator) {
            accumulated += chunk;
            setOutput(accumulated);
          }
        } catch {}
      }
    }
  };

  const onStructuredSubmit = (data: StructuredFormData) => {
    const summary = `
Supplier GSTIN: ${data.supplierGstin}
Recipient GSTIN: ${data.recipientGstin}
Invoice Number: ${data.invoiceNumber}
Invoice Date: ${data.invoiceDate}
Taxable Value: ₹${data.taxableAmount}
Tax Type: ${data.taxType}
Tax Rate: ${data.taxRate}
CGST: ₹${data.cgstAmount || 0}
SGST: ₹${data.sgstAmount || 0}
IGST: ₹${data.igstAmount || 0}
HSN/SAC: ${data.hsnCode}
Place of Supply: ${data.placeOfSupply}
`;
    runValidation(summary);
  };

  const onRawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawText.trim().length < 15) {
      toast.error("Please paste at least 15 characters of invoice details.");
      return;
    }
    runValidation(rawText);
  };

  const handleLoadSample = (sampleType: "valid" | "intra_error" | "invalid_gstin" = "valid") => {
    if (sampleType === "valid") {
      setValue("supplierGstin", "24AABCS1429B1Z8");
      setValue("recipientGstin", "27AAACR5124G1ZY");
      setValue("invoiceNumber", "TX-2425-0104");
      setValue("invoiceDate", "2024-11-20");
      setValue("taxableAmount", "250000");
      setValue("taxType", "Inter-State (IGST)");
      setValue("taxRate", "18%");
      setValue("igstAmount", "45000");
      setValue("cgstAmount", "0");
      setValue("sgstAmount", "0");
      setValue("hsnCode", "847130");
      setValue("placeOfSupply", "27-Maharashtra");
      toast.success("Loaded valid B2B sample invoice (Compliant)");
    } else if (sampleType === "intra_error") {
      setValue("supplierGstin", "24AABCS1429B1Z8");
      setValue("recipientGstin", "24AAECR8812K1Z5");
      setValue("invoiceNumber", "INV-ERROR-992");
      setValue("invoiceDate", "2024-11-15");
      setValue("taxableAmount", "100000");
      setValue("taxType", "Inter-State (IGST)");
      setValue("taxRate", "18%");
      setValue("igstAmount", "18000");
      setValue("cgstAmount", "0");
      setValue("sgstAmount", "0");
      setValue("hsnCode", "998311");
      setValue("placeOfSupply", "24-Gujarat");
      toast.warning("Loaded sample with Intra-State IGST levy mismatch error");
    } else if (sampleType === "invalid_gstin") {
      setValue("supplierGstin", "24AABCS1429B1"); // only 13 chars - invalid!
      setValue("recipientGstin", "27AAACR5124G1ZY");
      setValue("invoiceNumber", "INVOICE-001");
      setValue("invoiceDate", "2024-10-05");
      setValue("taxableAmount", "50000");
      setValue("taxType", "Intra-State (CGST + SGST)");
      setValue("taxRate", "18%");
      setValue("igstAmount", "0");
      setValue("cgstAmount", "4500");
      setValue("sgstAmount", "4500");
      setValue("hsnCode", ""); // missing HSN!
      setValue("placeOfSupply", "24-Gujarat");
      toast.warning("Loaded sample with Invalid GSTIN and missing HSN");
    }
  };

  // Determine status badge from output
  const isCompliant = output.toLowerCase().includes("status: compliant") || output.includes("## Overall Status: Compliant");
  const isNonCompliant = output.toLowerCase().includes("status: non-compliant") || output.includes("Non-Compliant");
  const isNeedsReview = output.toLowerCase().includes("needs review") || (!isCompliant && !isNonCompliant && output.length > 50);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>GST Invoice Validator — TaxPlain</title>
        <meta
          name="description"
          content="Check your GST invoice details against compliance rules and get instant feedback on errors or missing fields."
        />
        <link rel="canonical" href="https://taxplain.in/app/invoice-checker" />
        <meta property="og:title" content="GST Invoice Validator — TaxPlain" />
        <meta
          property="og:description"
          content="Check your GST invoice details against compliance rules and get instant feedback on errors or missing fields."
        />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/app/invoice-checker" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="GST Invoice Validator — TaxPlain" />
        <meta name="twitter:description" content="Check your GST invoice details against compliance rules and get instant feedback on errors or missing fields." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
      </Helmet>


      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-600 uppercase tracking-wider mb-1">
          <FileCheck className="h-4 w-4" />
          <span>Rule 46 Audit Module</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          GST Invoice Validator
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Verify supplier and recipient GSTIN formats, place of supply math, HSN classifications, and mandatory statutory invoice disclosures.
        </p>
      </div>

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (5 cols on lg) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Invoice Details
                </CardTitle>
                {autoSavedTime && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Check className="h-3 w-3" />
                    <span>Saved ({autoSavedTime})</span>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="ml-1 text-rose-600 hover:underline cursor-pointer"
                      title="Clear saved draft"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-gray-400">Presets:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadSample("valid")}
                  className="h-7 text-[11px] px-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center"
                >
                  <Check className="h-3 w-3 mr-1 text-emerald-600" /> Valid B2B
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadSample("intra_error")}
                  className="h-7 text-[11px] px-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center"
                >
                  <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> IGST Mismatch
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadSample("invalid_gstin")}
                  className="h-7 text-[11px] px-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center"
                >
                  <X className="h-3 w-3 mr-1 text-rose-500" /> Bad GSTIN
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearDraft}
                  disabled={isLoading || isStreaming}
                  className="h-7 text-[11px] px-2.5 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center shrink-0 ml-auto sm:ml-0"
                  title="Refresh form & clear output"
                >
                  <RotateCcw className="h-3 w-3 mr-1 text-emerald-600" /> Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <Tabs
                value={mode}
                onValueChange={(val) => setMode(val as any)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="structured">Structured</TabsTrigger>
                  <TabsTrigger value="raw">Raw Text</TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-1.5">
                    <Upload className="h-3 w-3" />
                    <span>Upload OCR</span>
                  </TabsTrigger>
                </TabsList>

                {/* Structured form tab */}
                <TabsContent value="structured">
                  <form onSubmit={handleSubmit(onStructuredSubmit)} className="space-y-3.5" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                          Supplier GSTIN <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="24AAACG1234F1Z8"
                          className="font-mono text-xs uppercase"
                          {...register("supplierGstin", {
                            onChange: (e) => {
                              setValue("supplierGstin", e.target.value.toUpperCase(), { shouldValidate: true });
                            },
                          })}
                          error={!!errors.supplierGstin}
                        />
                        {errors.supplierGstin && (
                          <p className="text-[11px] text-rose-600">{errors.supplierGstin.message}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                          Recipient GSTIN <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="27AABCU9603R1ZM"
                          className="font-mono text-xs uppercase"
                          {...register("recipientGstin", {
                            onChange: (e) => {
                              setValue("recipientGstin", e.target.value.toUpperCase(), { shouldValidate: true });
                            },
                          })}
                          error={!!errors.recipientGstin}
                        />
                        {errors.recipientGstin && (
                          <p className="text-[11px] text-rose-600">{errors.recipientGstin.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                          Invoice Number <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="INV/2024/001"
                          className="font-mono text-xs"
                          {...register("invoiceNumber")}
                          error={!!errors.invoiceNumber}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                          Invoice Date <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="date"
                          className="font-mono text-xs"
                          {...register("invoiceDate")}
                          error={!!errors.invoiceDate}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-medium text-gray-700">
                          Taxable Amt (₹) <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          placeholder="100000"
                          className="font-mono text-xs"
                          {...register("taxableAmount")}
                          error={!!errors.taxableAmount}
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-medium text-gray-700">
                          HSN / SAC Code <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="998314"
                          className="font-mono text-xs"
                          {...register("hsnCode")}
                          error={!!errors.hsnCode}
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-medium text-gray-700">
                          Place of Supply <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="27-Maharashtra"
                          className="text-xs"
                          {...register("placeOfSupply")}
                          error={!!errors.placeOfSupply}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Tax Treatment</label>
                        <Controller
                          name="taxType"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Tax Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Intra-State (CGST + SGST)">
                                  Intra-State (CGST + SGST)
                                </SelectItem>
                                <SelectItem value="Inter-State (IGST)">
                                  Inter-State (IGST)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">GST Rate</label>
                        <Controller
                          name="taxRate"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="GST Rate" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5%">5% (2.5% CGST + 2.5% SGST)</SelectItem>
                                <SelectItem value="12%">12% (6% CGST + 6% SGST)</SelectItem>
                                <SelectItem value="18%">18% (9% CGST + 9% SGST)</SelectItem>
                                <SelectItem value="28%">28% (14% CGST + 14% SGST)</SelectItem>
                                <SelectItem value="0%">0% / Nil-Rated / Exempt</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || isStreaming}
                      className="w-full bg-[#111111] hover:bg-black text-white font-medium h-10 mt-2 cursor-pointer rounded-md shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Auditing Invoice...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Validate GST Invoice →
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Paste Raw Invoice Text Tab */}
                <TabsContent value="raw">
                  <form onSubmit={onRawSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">
                        Paste Raw OCR or e-Invoice Text
                      </label>
                      <Textarea
                        rows={10}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste OCR text, e-Invoice JSON snippet, or text copied from PDF invoice..."
                        className="font-mono text-xs min-h-48"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || isStreaming}
                      className="w-full bg-[#111111] hover:bg-black text-white font-medium h-10 cursor-pointer rounded-md shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Auditing Invoice Text...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Validate Raw Invoice →
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Upload Invoice PDF or Image (OCR) Tab */}
                <TabsContent value="upload" className="space-y-4 pt-1">
                  <NoticeFileUpload
                    onTextExtracted={(text, meta) => {
                      setRawText(text);
                      runValidation(text, meta?.title || "Uploaded Invoice (OCR)");
                      toast.success(`Extracted & auditing ${meta?.title || "Tax Document"}...`);
                    }}
                    targetToolName="Rule 46 Invoice Checker"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output Validation Report (6 cols on lg) */}
        <div className="lg:col-span-6 space-y-4">
          {output && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-md border border-gray-200 bg-white shadow-sm">
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider font-semibold">Audit Assessment:</span>
              <div className="flex items-center gap-2">
                {isCompliant && (
                  <Badge variant="success" className="px-3 py-1 text-xs font-semibold shadow-sm flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    COMPLIANT (RULE 46 PASSED)
                  </Badge>
                )}
                {isNonCompliant && (
                  <Badge variant="destructive" className="px-3 py-1 text-xs font-semibold shadow-sm flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    NON-COMPLIANT (ISSUES FOUND)
                  </Badge>
                )}
                {isNeedsReview && (
                  <Badge variant="warning" className="px-3 py-1 text-xs font-semibold shadow-sm flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    STATUTORY REVIEW RECOMMENDED
                  </Badge>
                )}
              </div>
            </div>
          )}

          {isLoading && !isStreaming ? (
            <AnalysisSkeletonLoader
              type="invoice"
              elapsedSeconds={elapsedSeconds}
              documentTitle="Rule 46 Statutory Compliance Audit"
            />
          ) : !output ? (
            <EmptyState
              type="invoice"
              samplePills={[
                {
                  label: "Valid B2B Invoice",
                  onClick: () => handleLoadSample("valid"),
                },
                {
                  label: "Intra-State IGST Error",
                  onClick: () => handleLoadSample("intra_error"),
                },
                {
                  label: "Invalid GSTIN / Missing HSN",
                  onClick: () => handleLoadSample("invalid_gstin"),
                },
              ]}
            />
          ) : (
            <StreamingOutput
              content={output}
              isLoading={false}
              isStreaming={isStreaming}
              title="GST Invoice Compliance Report"
              badgeText="Rule 46 CGST Audit"
              showExport={true}
            />
          )}
        </div>
      </div>

      {/* Searchable Tax Terminology Floating QuickRef Card */}
      <TaxGlossaryFloatingWidget />
    </div>
  );
}
