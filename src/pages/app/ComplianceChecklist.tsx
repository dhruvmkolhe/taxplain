import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckSquare,
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
  Copy,
  Check,
  RotateCcw,
  Mail,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Progress } from "@/src/components/ui/progress";
import { Skeleton } from "@/src/components/ui/skeleton";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { createGroqClient, GROQ_MODEL, mockTaxPlainStream, getGroqApiKey } from "@/src/lib/groq";
import { MODULE_C_SYSTEM_PROMPT, buildModuleCPrompt } from "@/src/lib/taxPrompts";
import { addRecentActivity } from "@/src/lib/recentActivity";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const checklistSchema = z.object({
  businessType: z.string().min(1, "Please select business constitution"),
  filingPeriod: z.string().min(1, "Please select filing period"),
  turnover: z.string().min(1, "Please select turnover slab"),
  state: z.string().min(1, "Please select state or UT"),
  concerns: z.string().max(500, "Maximum 500 characters").optional(),
});

type ChecklistFormData = z.infer<typeof checklistSchema>;

interface ChecklistItem {
  id: string;
  section: string;
  text: string;
}

export default function ComplianceChecklist() {
  const [rawOutput, setRawOutput] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSectionName, setCopiedSectionName] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      businessType: "Private Limited",
      filingPeriod: "GSTR-3B",
      turnover: "1.5–5 Cr",
      state: "Gujarat",
      concerns: "",
    },
  });

  const handleCopyChecklist = async (format: "standard" | "email" = "standard") => {
    if (items.length === 0) return;
    try {
      const formVals = watch();
      let text = "";
      if (format === "email") {
        const dateStr = new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        text = `Subject: GST Compliance Action Sheet — ${formVals.filingPeriod} (${formVals.businessType})\nDate: ${dateStr}\nEntity: ${formVals.businessType} | Jurisdiction: ${formVals.state} | Turnover: ${formVals.turnover}\n\n`;
      } else {
        text = `GST Compliance Action Checklist\nEntity: ${formVals.businessType} | State: ${formVals.state} | Filing: ${formVals.filingPeriod}\n\n`;
      }

      Object.entries(sections).forEach(([secName, secItems]) => {
        text += `== ${secName.toUpperCase()} ==\n`;
        secItems.forEach((it) => {
          const isDone = checkedIds[it.id];
          text += `[${isDone ? "✓" : " "}] ${it.text}\n`;
        });
        text += "\n";
      });

      text += `Status: ${completedCount} of ${totalCount} items verified (${progressPercent}% complete)\nGenerated via TaxPlain CA Compliance Engine`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Checklist copied to clipboard! Ready to paste into emails or documents.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy checklist");
    }
  };

  const handleCopySection = async (secName: string, secItems: ChecklistItem[]) => {
    try {
      let text = `== ${secName.toUpperCase()} ==\n`;
      secItems.forEach((it) => {
        const isDone = checkedIds[it.id];
        text += `[${isDone ? "✓" : " "}] ${it.text}\n`;
      });
      await navigator.clipboard.writeText(text);
      setCopiedSectionName(secName);
      toast.success(`Copied "${secName}" to clipboard!`);
      setTimeout(() => setCopiedSectionName(null), 2000);
    } catch {
      toast.error("Failed to copy section");
    }
  };

  // Handle returnType query param
  useEffect(() => {
    const returnParam = searchParams.get("returnType");
    if (returnParam) {
      if (returnParam.includes("1")) setValue("filingPeriod", "GSTR-1");
      else if (returnParam.includes("9")) setValue("filingPeriod", "GSTR-9 / 9C");
      else if (returnParam.includes("3B")) setValue("filingPeriod", "GSTR-3B");
    }
  }, [searchParams, setValue]);

  // Track call duration > 6s
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

  const watchedFilingPeriod = watch("filingPeriod");
  const watchedBusinessType = watch("businessType");

  const getStorageKey = (period?: string, entity?: string) => {
    const p = (period || watchedFilingPeriod || "GSTR-3B").replace(/[^a-zA-Z0-9]/g, "_");
    const e = (entity || watchedBusinessType || "PvtLtd").replace(/[^a-zA-Z0-9]/g, "_");
    return `taxplain_checklist_${p}_${e}`;
  };

  // Load checked items from localStorage scoped to active filing profile
  useEffect(() => {
    try {
      const key = getStorageKey(watchedFilingPeriod, watchedBusinessType);
      const saved = localStorage.getItem(key);
      if (saved) {
        setCheckedIds(JSON.parse(saved));
      } else {
        setCheckedIds({});
      }
    } catch {}
  }, [watchedFilingPeriod, watchedBusinessType]);

  // Parse markdown items like `## Section\n- [ ] Task`
  const parseChecklist = (text: string): ChecklistItem[] => {
    const lines = text.split("\n");
    const parsed: ChecklistItem[] = [];
    let currentSection = "General Checks";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
        currentSection = trimmed.replace(/^#+\s*/, "").replace(/[#*]/g, "").trim();
      } else if (
        trimmed.startsWith("- [ ]") ||
        trimmed.startsWith("- [x]") ||
        trimmed.startsWith("* [ ]") ||
        trimmed.startsWith("- ") ||
        trimmed.startsWith("* ") ||
        /^\d+\.\s/.test(trimmed)
      ) {
        const cleanText = trimmed
          .replace(/^[-*]\s*\[[ xX]\]\s*/, "")
          .replace(/^[-*]\s*/, "")
          .replace(/^\d+\.\s*/, "")
          .trim();

        if (cleanText.length > 5) {
          // Content-hashed deterministic identifier to maintain checkbox stability across stream chunks
          const slug = `${currentSection}_${cleanText.slice(0, 36)}`
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_");

          parsed.push({
            id: `chk_${slug}`,
            section: currentSection,
            text: cleanText,
          });
        }
      }
    }

    return parsed;
  };

  const handleToggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetChecklist = () => {
    setCheckedIds({});
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);
    } catch {}
    toast.info("Checklist progress reset for this filing profile");
  };

  const onSubmit = async (data: ChecklistFormData) => {
    setRawOutput("");
    setItems([]);
    setIsLoading(true);
    setIsStreaming(true);
    setHasSubmitted(true);

    // Track in Recent Activity
    addRecentActivity({
      type: "compliance_checklist",
      title: `${data.filingPeriod} • ${data.state}`,
      snippet: `${data.businessType}, ${data.turnover} • GST Return Checklist`,
      path: "/app/compliance-checklist",
      data: { ...data },
    });

    const prompt = buildModuleCPrompt({
      businessType: data.businessType,
      state: data.state,
      turnover: data.turnover,
      filingScheme: data.filingPeriod,
      period: data.filingPeriod,
      concerns: data.concerns,
    });

    try {
      const apiKey = getGroqApiKey();
      if (!apiKey) {
        const generator = mockTaxPlainStream(prompt, "checklist");
        let accumulated = "";
        for await (const chunk of generator) {
          accumulated += chunk;
          setRawOutput(accumulated);
          setItems(parseChecklist(accumulated));
          setIsLoading(false);
        }
        setIsStreaming(false);
        toast.info("Generated via TaxPlain CA compliance template.");
        return;
      }

      const groq = createGroqClient();
      const stream = await groq.chat.completions.create({
        model: GROQ_MODEL,
        promptType: "checklist",
        messages: [
          {
            role: "system",
            content: MODULE_C_SYSTEM_PROMPT,
          },
          { role: "user", content: prompt },
        ],
        stream: true,
        temperature: 0.2,
      });

      let accumulated = "";
      for await (const chunk of stream) {
        accumulated += chunk.choices[0]?.delta?.content || "";
        setRawOutput(accumulated);
        setItems(parseChecklist(accumulated));
        setIsLoading(false);
      }
      setIsStreaming(false);
    } catch (err: any) {
      console.error("Groq checklist error", err);
      setIsLoading(false);
      setIsStreaming(false);

      if (err?.status === 429 || err?.message?.includes("rate limit")) {
        toast.error("Too many requests. Please wait 30 seconds.");
      } else {
        toast.error("AI service unavailable. Using built-in checklist template.");
        try {
          const generator = mockTaxPlainStream(prompt, "checklist");
          let accumulated = "";
          for await (const chunk of generator) {
            accumulated += chunk;
            setRawOutput(accumulated);
            setItems(parseChecklist(accumulated));
          }
        } catch {}
      }
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current || items.length === 0) return;
    try {
      setIsExporting(true);
      toast.info("Preparing PDF checklist...");

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#131929",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`GST_Compliance_Checklist_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Checklist PDF downloaded");
    } catch {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Group items by section
  const sections = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const totalCount = items.length;
  const completedCount = items.filter((it) => checkedIds[it.id]).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>GST Compliance Checklist Generator — TaxPlain</title>
        <meta
          name="description"
          content="Generate a customised GST compliance checklist for your business type and filing period in seconds."
        />
        <link rel="canonical" href="https://taxplain.in/app/compliance-checklist" />
        <meta property="og:title" content="GST Compliance Checklist Generator — TaxPlain" />
        <meta
          property="og:description"
          content="Generate a customised GST compliance checklist for your business type and filing period in seconds."
        />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/app/compliance-checklist" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="GST Compliance Checklist Generator — TaxPlain" />
        <meta name="twitter:description" content="Generate a customised GST compliance checklist for your business type and filing period in seconds." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
      </Helmet>


      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-600 uppercase tracking-wider mb-1">
          <CheckSquare className="h-4 w-4" />
          <span>Filing Workflow Tool</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          GST Compliance Checklist Generator
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate custom pre-filing, verification, and audit checklists tailored to your entity type, state, and turnover slab.
        </p>
      </div>

      {/* Generator Form Card */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Business Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="businessType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger error={!!errors.businessType}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                        <SelectItem value="Partnership Firm">Partnership Firm</SelectItem>
                        <SelectItem value="Private Limited">Private Limited</SelectItem>
                        <SelectItem value="LLP">LLP</SelectItem>
                        <SelectItem value="Public Limited">Public Limited</SelectItem>
                        <SelectItem value="Non-Profit">Section 8 / Trust</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* GST Filing Period */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Filing Period / Return <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="filingPeriod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger error={!!errors.filingPeriod}>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly GSTR-1">Monthly GSTR-1</SelectItem>
                        <SelectItem value="Quarterly GSTR-1 (QRMP)">Quarterly GSTR-1 (QRMP)</SelectItem>
                        <SelectItem value="GSTR-3B">Monthly GSTR-3B</SelectItem>
                        <SelectItem value="Annual GSTR-9">Annual Return GSTR-9</SelectItem>
                        <SelectItem value="GSTR-9C">Reconciliation Statement GSTR-9C</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Turnover Slab */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Turnover Slab <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="turnover"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger error={!!errors.turnover}>
                        <SelectValue placeholder="Select turnover" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Under 1.5 Cr">Under ₹1.5 Crore</SelectItem>
                        <SelectItem value="1.5–5 Cr">₹1.5 – ₹5 Crore</SelectItem>
                        <SelectItem value="5–20 Cr">₹5 – ₹20 Crore (e-Invoice Mandatory)</SelectItem>
                        <SelectItem value="Above 20 Cr">Above ₹20 Crore</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Indian State / UT */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  State / Jurisdiction <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger error={!!errors.state}>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES_AND_UTS.map((st) => (
                          <SelectItem key={st} value={st}>
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Optional Concerns */}
            <div className="space-y-1.5">
              <label htmlFor="concerns" className="text-xs font-medium text-gray-700">
                Specific Concerns or Transactions (Optional)
              </label>
              <Textarea
                id="concerns"
                rows={2}
                placeholder="e.g. Export of services with LUT, RCM on freight, blocked credit on car hire, pending vendor payments..."
                className="text-xs font-mono min-h-[60px]"
                {...register("concerns")}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-500">
                Updated for CGST Act &amp; CBIC Circular guidelines 2024–25.
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={isLoading || isStreaming}
                  className="flex-1 sm:flex-initial bg-[#111111] hover:bg-black text-white font-medium h-10 px-5 cursor-pointer rounded-md shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Checklist →
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setValue("concerns", "");
                    setItems([]);
                    setRawOutput("");
                    setCheckedIds({});
                    setHasSubmitted(false);
                    toast.success("Checklist form refreshed");
                  }}
                  disabled={isLoading || isStreaming}
                  className="border-gray-200 bg-white hover:bg-gray-50 text-gray-700 h-10 px-3 cursor-pointer shrink-0 rounded-md"
                  title="Refresh form & clear items"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5 text-emerald-600" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {isLoading && elapsedSeconds > 6 && (
              <p className="text-xs text-amber-600 animate-pulse flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Compiling multi-section checklist — this may take a moment.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Checklist Skeleton Loading */}
      {isLoading && items.length === 0 && (
        <Card className="border-gray-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      )}

      {/* Interactive Checklist Output */}
      {items.length > 0 && (
        <Card className="border-gray-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-200 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-[#111111] flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-gray-800" />
                  Customized GST Compliance Action Sheet
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1">
                  Interactive compliance verification tracker stored in this browser session.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetChecklist}
                  className="h-8 text-xs border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyChecklist("standard")}
                  className="h-8 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-200 cursor-pointer flex items-center gap-1.5"
                  title="Copy compliance checklist to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                      <span className="hidden sm:inline">Copy to Clipboard</span>
                      <span className="sm:hidden">Copy</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="h-8 text-xs border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-gray-900" />
                  ) : (
                    <Download className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  )}
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Progress tracker bar */}
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-500">
                  Compliance Verification Status:{" "}
                  <strong className="text-gray-900">{completedCount} of {totalCount} completed</strong>
                </span>
                <span className="text-[#111111] font-semibold">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-gray-100" />
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6" ref={printRef}>
            {Object.entries(sections).map(([sectionName, sectionItems]) => (
              <div key={sectionName} className="space-y-2.5">
                <div className="border-b border-gray-200 pb-1.5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <span>{sectionName}</span>
                    <span className="text-xs font-normal text-gray-500">
                      ({sectionItems.filter((it) => checkedIds[it.id]).length}/{sectionItems.length})
                    </span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => handleCopySection(sectionName, sectionItems)}
                    className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer border border-transparent"
                    title={`Copy checklist items in ${sectionName}`}
                  >
                    {copiedSectionName === sectionName ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Section</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {sectionItems.map((item) => {
                    const isChecked = !!checkedIds[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggle(item.id)}
                        className={`flex items-start gap-3 p-3 rounded-md border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "border-emerald-200 bg-emerald-50/40 text-gray-500"
                            : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 text-gray-900"
                        }`}
                      >
                        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            id={item.id}
                            checked={isChecked}
                            onCheckedChange={() => handleToggle(item.id)}
                          />
                        </div>
                        <label
                          htmlFor={item.id}
                          className={`text-xs sm:text-sm leading-relaxed cursor-pointer ${
                            isChecked ? "line-through text-gray-400" : "text-gray-900"
                          }`}
                        >
                          {item.text}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quick Copy Footer Action Bar for Emails & Spreadsheets */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-md border border-gray-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                  <Sparkles className="h-3.5 w-3.5 text-gray-700" />
                  <span>Ready to paste into emails, memos, or audit logs</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Exports checkboxes ([✓] / [ ]) and verified counts for seamless communication.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyChecklist("email")}
                  className="h-8 text-xs bg-white hover:bg-gray-100 text-gray-700 border-gray-200 cursor-pointer flex-1 sm:flex-initial"
                  title="Copy formatted with email subject line and entity metadata"
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-600" />
                  Copy for Email
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleCopyChecklist("standard")}
                  className="h-8 text-xs bg-[#111111] hover:bg-black text-white font-medium shadow-sm cursor-pointer flex-1 sm:flex-initial"
                  title="Copy complete checklist to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5 text-white" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5 text-white" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSubmitted && !isLoading && items.length === 0 && (
        <EmptyState
          title="No checklist items generated"
          description="Try selecting different filing parameters or checking your network connection."
        />
      )}
    </div>
  );
}
