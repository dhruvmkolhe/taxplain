import React from "react";
import {
  FileText,
  FileCheck,
  Sparkles,
  ArrowRight,
  Upload,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileQuestion,
  LucideIcon,
  HelpCircle,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";

export interface EmptyStateStep {
  number: string;
  title: string;
  description: string;
}

export interface EmptyStateProps {
  type?: "explainer" | "invoice" | "recent_docs" | "checklist" | "itr" | "generic";
  title?: string;
  description?: string;
  icon?: LucideIcon;
  steps?: EmptyStateStep[];
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  samplePills?: { label: string; onClick: () => void; badge?: string }[];
  className?: string;
}

export function EmptyState({
  type = "generic",
  title,
  description,
  icon: CustomIcon,
  steps,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  samplePills,
  className = "",
}: EmptyStateProps) {
  // Preset configurations for the different views
  if (type === "recent_docs") {
    return (
      <div
        className={`rounded border border-dashed border-gray-200 bg-[#fafafa] p-6 sm:p-8 text-center transition-all duration-200 ${className}`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-[#111111] border border-gray-200 mb-4">
          <FileText className="h-6 w-6 text-gray-700" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-[#111111] mb-1.5">
          {title || "No Recent Documents Analyzed Yet"}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
          {description ||
            "Every GST statutory clause you explain and tax invoice you audit is automatically logged here for swift access and client reporting."}
        </p>

        {/* 2 Quick-Start Guided Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left mb-6">
          <div
            onClick={onAction}
            className="group p-4 rounded bg-white border border-gray-200 hover:border-gray-300 transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded bg-gray-100 text-gray-700 border border-gray-200">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                Start <ArrowRight className="h-3 w-3" />
              </span>
            </div>
            <h4 className="text-sm font-semibold text-[#111111] group-hover:text-black">
              Analyze Tax Clause
            </h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              Translate complex CGST/SGST clauses or notifications into clear advisory notes.
            </p>
          </div>

          <div
            onClick={onSecondaryAction}
            className="group p-4 rounded bg-white border border-gray-200 hover:border-gray-300 transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded bg-gray-100 text-gray-700 border border-gray-200">
                <FileCheck className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                Start <ArrowRight className="h-3 w-3" />
              </span>
            </div>
            <h4 className="text-sm font-semibold text-[#111111] group-hover:text-black">
              Audit B2B Invoice
            </h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              Validate 16 mandatory Rule 46 fields, GSTIN format, and tax math accuracy.
            </p>
          </div>
        </div>

        {samplePills && samplePills.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500 font-mono">Quick load demo:</span>
            {samplePills.map((pill, i) => (
              <button
                key={i}
                type="button"
                onClick={pill.onClick}
                className="text-xs px-2.5 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <PlayCircle className="h-3 w-3 text-gray-500" />
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === "explainer") {
    return (
      <div
        className={`rounded border border-dashed border-gray-200 bg-[#fafafa] p-6 sm:p-8 transition-all duration-200 ${className}`}
      >
        <div className="max-w-xl mx-auto text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 mb-3.5">
            <Sparkles className="h-6 w-6 text-gray-700" />
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-[#111111] mb-1.5">
            {title || "Ready to Explain Statutory GST Clauses"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            {description ||
              "Enter any statutory provision, department circular, or upload a Show Cause Notice above to receive a plain-English practitioner brief."}
          </p>
        </div>

        {/* 3 Step Guided Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
          <div className="p-3.5 rounded bg-white border border-gray-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-700 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                STEP 01
              </span>
              <h4 className="text-xs font-semibold text-[#111111] mt-2.5">Input Text or OCR</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Paste any clause text or upload a PDF/Image notice for instant scanning.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400">
              <Upload className="h-3 w-3 text-gray-500" />
              <span>PDF, SCN or clause</span>
            </div>
          </div>

          <div className="p-3.5 rounded bg-white border border-gray-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-700 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                STEP 02
              </span>
              <h4 className="text-xs font-semibold text-[#111111] mt-2.5">Select Constitution</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Choose Sole Proprietor, LLP, or Pvt Ltd for tailored compliance context.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400">
              <BookOpen className="h-3 w-3 text-gray-500" />
              <span>Entity-specific rules</span>
            </div>
          </div>

          <div className="p-3.5 rounded bg-white border border-gray-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-700 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                STEP 03
              </span>
              <h4 className="text-xs font-semibold text-[#111111] mt-2.5">Actionable Advice</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Get layman explanations, risk tags, statutory deadlines, and next steps.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400">
              <CheckCircle2 className="h-3 w-3 text-gray-500" />
              <span>CA-ready report</span>
            </div>
          </div>
        </div>

        {/* Quick Sample Presets */}
        {samplePills && samplePills.length > 0 && (
          <div className="pt-4 border-t border-gray-200 text-center">
            <span className="text-xs font-mono text-gray-400 block mb-2">
              Or click a sample below to populate the form instantly:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {samplePills.map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={pill.onClick}
                  className="text-xs px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-black transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-gray-500" />
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === "invoice") {
    return (
      <div
        className={`rounded border border-dashed border-gray-200 bg-[#fafafa] p-6 sm:p-8 transition-all duration-200 ${className}`}
      >
        <div className="max-w-xl mx-auto text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 mb-3.5">
            <FileCheck className="h-6 w-6 text-gray-700" />
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-[#111111] mb-1.5">
            {title || "Rule 46 Invoice Audit Report Will Appear Here"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            {description ||
              "Audit B2B tax invoices against Section 31 & Rule 46 requirements to safeguard your clients' input tax credits."}
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
          <div className="p-3.5 rounded bg-white border border-gray-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-700 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                CHECK 01
              </span>
              <h4 className="text-xs font-semibold text-[#111111] mt-2.5">GSTIN & Formats</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Verifies 15-character alphanumeric checksums for supplier & recipient.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400">
              <CheckCircle2 className="h-3 w-3 text-gray-500" />
              <span>Rule 46(b) & (c)</span>
            </div>
          </div>

          <div className="p-3.5 rounded bg-white border border-gray-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-700 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                CHECK 02
              </span>
              <h4 className="text-xs font-semibold text-[#111111] mt-2.5">Tax Math & POS</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Cross-references Place of Supply to confirm CGST+SGST vs. IGST levy.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400">
              <ShieldAlert className="h-3 w-3 text-gray-500" />
              <span>Section 10 IGST Act</span>
            </div>
          </div>

          <div className="p-3.5 rounded bg-white border border-gray-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-700 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                CHECK 03
              </span>
              <h4 className="text-xs font-semibold text-[#111111] mt-2.5">HSN & Disclosure</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Ensures 6-digit HSN requirement and mandatory 16 fields are present.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400">
              <FileCheck className="h-3 w-3 text-gray-500" />
              <span>ITC Protection</span>
            </div>
          </div>
        </div>

        {/* Quick Sample Presets */}
        {samplePills && samplePills.length > 0 && (
          <div className="pt-4 border-t border-gray-200 text-center">
            <span className="text-xs font-mono text-gray-400 block mb-2">
              Try an audit scenario now:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {samplePills.map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={pill.onClick}
                  className="text-xs px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-black transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                >
                  <PlayCircle className="h-3 w-3 text-gray-500" />
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generic / Default fallback empty state
  const DisplayIcon = CustomIcon || FileQuestion;

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded border border-dashed border-gray-200 bg-[#fafafa] transition-all duration-200 ${className}`}
    >
      <div className="rounded-full bg-gray-100 p-4 text-gray-500 mb-4 border border-gray-200">
        <DisplayIcon className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-[#111111] mb-1.5">
        {title || "No output generated"}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
        {description || "Try adjusting your query or selecting a sample scenario above."}
      </p>

      {steps && steps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mx-auto mb-6 text-left">
          {steps.map((step, idx) => (
            <div key={idx} className="p-3 rounded bg-white border border-gray-200">
              <span className="text-[10px] font-mono font-bold text-gray-700">
                {step.number}
              </span>
              <h4 className="text-xs font-semibold text-[#111111] mt-1">{step.title}</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">{step.description}</p>
            </div>
          ))}
        </div>
      )}

      {(actionLabel || onAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              size="sm"
              className="bg-[#111111] hover:bg-black text-white cursor-pointer h-9 px-4 text-xs font-medium"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              size="sm"
              className="border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-black cursor-pointer h-9 px-4 text-xs font-medium"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
