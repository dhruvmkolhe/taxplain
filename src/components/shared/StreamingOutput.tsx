import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, Download, Loader2, Sparkles, BookOpen, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { TaxGlossaryCard } from "@/src/components/shared/TaxGlossaryCard";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface StreamingOutputProps {
  content: string;
  isStreaming: boolean;
  isLoading: boolean;
  title?: string;
  badgeText?: string;
  type?: "explainer" | "checklist" | "invoice" | "itr" | "generic";
  showExport?: boolean;
}

export function StreamingOutput({
  content,
  isStreaming,
  isLoading,
  title = "AI Tax Analysis",
  badgeText = "LLaMA 3.3 70B",
  showExport = true,
}: StreamingOutputProps) {
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (format: "standard" | "email" = "standard") => {
    if (!content) return;
    try {
      let textToCopy = content;
      if (format === "email") {
        const dateStr = new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        textToCopy = `Subject: ${title} — Statutory Compliance & Advisory Briefing\nDate: ${dateStr}\nPrepared via: TaxPlain CA Advisory Engine\n\n${content}\n\n---\nDisclaimer: Generated for statutory guidance and procedural compliance. Please review with your consulting Chartered Accountant.`;
        setCopiedEmail(true);
        toast.success("Email-ready summary copied to clipboard! Ready to paste into email.");
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopied(true);
        toast.success("Tax summary copied to clipboard! Ready to paste.");
        setTimeout(() => setCopied(false), 2000);
      }
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || !content) return;
    try {
      setIsExporting(true);
      toast.info("Generating PDF report...");
      
      const element = contentRef.current;
      const isLight = document.documentElement.classList.contains("light");
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: isLight ? "#ffffff" : "#131929",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`TaxPlain_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF report downloaded successfully");
    } catch (err) {
      console.error("PDF export error", err);
      toast.error("Failed to generate PDF. You can still copy the text.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !content) {
    return (
      <Card className="border-gray-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="pt-4 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="pt-4 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!content) return null;

  return (
    <Card className="border-gray-200 bg-white rounded overflow-hidden">
      <CardHeader className="border-b border-gray-200 bg-[#fafafa] py-3 px-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-sm sm:text-base font-semibold text-[#111111]">{title}</CardTitle>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono border border-gray-200">
              {badgeText}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGlossary((prev) => !prev)}
              className="h-8 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-200 cursor-pointer flex items-center gap-1.5"
              title="Search GST Tax Terminology & Legal Jargon"
            >
              <BookOpen className="h-3.5 w-3.5 text-gray-500" />
              <span className="hidden sm:inline">Tax Terms</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy("standard")}
              className="h-8 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-200 cursor-pointer flex items-center gap-1.5"
              title="Copy generated tax summary to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                  <span className="hidden sm:inline">Copy to Clipboard</span>
                  <span className="sm:hidden">Copy</span>
                </>
              )}
            </Button>

            {showExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting || isStreaming}
                className="h-8 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-200 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-gray-700" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    Export PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        <div ref={contentRef} className="tax-prose p-2 rounded bg-white">
          <ReactMarkdown>{content}</ReactMarkdown>
          {isStreaming && (
            <span
              className="inline-block w-[2px] h-[1.1em] bg-[#111111] ml-1 align-middle animate-pulse"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Quick Copy Footer Action Bar for Client Emails & Documents */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fafafa] p-3.5 rounded border border-gray-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
              <Sparkles className="h-3.5 w-3.5 text-gray-700" />
              <span>Ready for Client & Audit Documentation</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Copy clean text or formatted briefing to paste directly into email, Slack, or word processor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy("email")}
              className="h-8 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-200 cursor-pointer flex-1 sm:flex-initial"
              title="Copy with email subject line, date, and statutory disclaimer"
            >
              {copiedEmail ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  Email Ready Copied!
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-700" />
                  Copy for Email
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={() => handleCopy("standard")}
              className="h-8 text-xs bg-[#111111] hover:bg-black text-white font-medium shadow-none cursor-pointer flex-1 sm:flex-initial"
              title="Copy entire tax summary to clipboard"
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

        {/* Statutory AI & CA Advisory Footnote */}
        <div className="mt-3.5 flex items-start gap-2 text-[11px] text-gray-500 bg-[#fafafa] px-3.5 py-2.5 rounded border border-gray-200">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong className="text-gray-900 font-medium">Educational AI Notice:</strong> This analysis is AI-generated for informational and learning purposes. Indian tax provisions are subject to statutory amendments and judicial interpretations. Always consult a certified Chartered Accountant (CA) or tax professional before making compliance or filing decisions.
          </span>
        </div>
      </CardContent>

      {/* Searchable Tax Terminology Floating QuickRef Card */}
      <TaxGlossaryCard isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
    </Card>
  );
}
