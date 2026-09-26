import React, { useState, useEffect } from "react";
import { Loader2, Sparkles, Scale, ShieldCheck, FileCheck, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

interface AnalysisSkeletonLoaderProps {
  type: "explainer" | "invoice" | "notice";
  elapsedSeconds?: number;
  documentTitle?: string;
}

const EXPLAINER_STAGES = [
  "Parsing statutory clause & legal terminology...",
  "Cross-referencing Central Goods and Services Tax Act 2017...",
  "Evaluating CBIC Circulars & judicial precedents...",
  "Formulating plain-English summary & business impact...",
  "Finalizing compliance checklist & statutory deadlines...",
];

const INVOICE_STAGES = [
  "Validating 15-digit GSTIN checksums & state identifiers (Rule 46(b))...",
  "Checking Place of Supply vs. IGST / CGST+SGST tax rate applicability...",
  "Auditing mandatory 16-point statutory disclosures (HSN, consecutive serial number)...",
  "Verifying recipient details & reverse charge applicability (Section 31)...",
  "Generating final statutory compliance audit report & score...",
];

export function AnalysisSkeletonLoader({
  type,
  elapsedSeconds = 0,
  documentTitle,
}: AnalysisSkeletonLoaderProps) {
  const stages = type === "invoice" ? INVOICE_STAGES : EXPLAINER_STAGES;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300" id="analysis-skeleton-loader">
      {/* Dynamic Processing Status Banner with Progress Spinner */}
      <div className="rounded border border-gray-200 bg-[#fafafa] p-4 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Custom Spinner */}
            <div className="relative flex items-center justify-center h-10 w-10 shrink-0">
              <Loader2 className="h-5 w-5 animate-spin text-[#111111]" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">
                  {type === "invoice"
                    ? "Auditing Rule 46 GST Invoice Compliance"
                    : "Analyzing Statutory GST Clause"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  AI CA Engine
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono flex items-center gap-1.5 transition-all">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#111111] animate-ping" />
                {stages[stageIndex]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 shrink-0 self-end sm:self-center">
            <span>Elapsed: {elapsedSeconds}s</span>
            <span>•</span>
            <span className="text-gray-900 font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Structural High-Fidelity Skeleton Card */}
      <Card className="border-gray-200 bg-white rounded overflow-hidden">
        {/* Card Header Skeleton */}
        <CardHeader className="border-b border-gray-200 bg-[#fafafa] py-3 px-4 sm:px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48 ml-2 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-20 rounded" />
              <Skeleton className="h-7 w-24 rounded" />
            </div>
          </div>
        </CardHeader>

        {/* Card Content Skeletons */}
        <CardContent className="p-5 sm:p-6 space-y-6">
          {type === "invoice" ? (
            /* Invoice Validator Specific Skeleton */
            <>
              {/* Status Badge & Score Gauge Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded border border-gray-200 bg-white space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-32 rounded" />
                </div>
                <div className="p-3.5 rounded border border-gray-200 bg-white space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-20 rounded" />
                </div>
                <div className="p-3.5 rounded border border-gray-200 bg-white space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-36 rounded" />
                </div>
              </div>

              {/* 16-Point Checklist Skeletons */}
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-44" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 rounded border border-gray-200 bg-white"
                    >
                      <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                      <div className="space-y-1 w-full">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corrective Actions Skeleton */}
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-16 w-full rounded" />
              </div>
            </>
          ) : (
            /* Explainer Specific Skeleton */
            <>
              {/* Plain English Summary Block */}
              <div className="space-y-2.5 p-4 rounded border border-gray-200 bg-[#fafafa]">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>

              {/* What This Means for Your Business */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-52" />
                <div className="space-y-2 pl-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="h-3.5 w-3.5 rounded-full mt-0.5 shrink-0" />
                      <Skeleton className="h-3.5 w-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Action Items */}
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-44" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-3 rounded border border-gray-200 bg-white space-y-1.5"
                    >
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deadlines & Related Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded border border-gray-200 bg-white space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="p-3 rounded border border-gray-200 bg-white space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-14 rounded" />
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-5 w-14 rounded" />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
