import React, { useState } from "react";
import {
  FileText,
  Search,
  Scale,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

export type AnalysisPhase =
  | "draft" // User is entering/editing the clause
  | "parsing" // Parsing section & references (< 2s)
  | "evaluating" // CA engine risk & rule evaluation
  | "synthesizing" // Streaming output & generating checklist
  | "complete"; // Output finished and ready

interface AnalysisLifecycleProgressProps {
  phase: AnalysisPhase;
  elapsedSeconds?: number;
  hasInput: boolean;
  businessType?: string;
  onJumpToOutput?: () => void;
}

interface StepConfig {
  id: number;
  title: string;
  shortDesc: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

const LIFECYCLE_STEPS: StepConfig[] = [
  {
    id: 1,
    title: "Document & Entity Input",
    shortDesc: "Clause ingestion & entity profiling",
    detail:
      "Captures statutory clause, circular, or OCR scan and profiles legal impact based on business constitution (e.g., Pvt Ltd, Proprietorship, LLP).",
    icon: FileText,
    tags: ["Input Validation", "Entity Profiling", "Draft Auto-Save"],
  },
  {
    id: 2,
    title: "Statutory Parsing",
    shortDesc: "Section, rule & precedent matching",
    detail:
      "Parses specific provisions of CGST/SGST/IGST Acts 2017, relevant rules (e.g., Rule 88C, 86B, 42/43), and cross-referenced CBIC notifications.",
    icon: Search,
    tags: ["CGST Act 2017", "CBIC Circulars", "Statutory Scope"],
  },
  {
    id: 3,
    title: "CA Compliance Evaluation",
    shortDesc: "ITC eligibility & risk determination",
    detail:
      "Senior CA logic audits input tax credit eligibility, reverse charge (RCM), departmental notice exposure (DRC-01B/C), interest penalties, and cutoff dates.",
    icon: Scale,
    tags: ["ITC Restrictions", "Section 16/17 Audit", "Penalty Exposure"],
  },
  {
    id: 4,
    title: "Actionable Advisory",
    shortDesc: "Plain-English summary & checklist",
    detail:
      "Synthesizes zero-jargon executive summary, constitution-specific impact bullets, step-by-step action checklist, and statutory compliance deadlines.",
    icon: Sparkles,
    tags: ["Plain English", "Compliance Checklist", "PDF Export"],
  },
];

export function AnalysisLifecycleProgress({
  phase,
  elapsedSeconds = 0,
  hasInput,
  businessType = "Private Limited",
  onJumpToOutput,
}: AnalysisLifecycleProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  // Compute active step index (1-based)
  let activeStepId = 1;
  let isRunning = false;
  let isDone = false;

  switch (phase) {
    case "draft":
      activeStepId = hasInput ? 1 : 1;
      break;
    case "parsing":
      activeStepId = 2;
      isRunning = true;
      break;
    case "evaluating":
      activeStepId = 3;
      isRunning = true;
      break;
    case "synthesizing":
      activeStepId = 4;
      isRunning = true;
      break;
    case "complete":
      activeStepId = 4;
      isDone = true;
      break;
  }

  // Get status for each step
  const getStepStatus = (stepId: number): "completed" | "current" | "upcoming" => {
    if (isDone) return "completed";
    if (phase === "draft") {
      if (stepId === 1) return hasInput ? "completed" : "current";
      return "upcoming";
    }
    if (stepId < activeStepId) return "completed";
    if (stepId === activeStepId) return "current";
    return "upcoming";
  };

  return (
    <div
      id="analysis-lifecycle-progress"
      className="bg-white border border-gray-200 rounded p-4 sm:p-5 transition-all"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700">
            {isDone ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
            ) : (
              <Clock className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400">
                Analysis Lifecycle
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                {isDone
                  ? "4 of 4 Steps Verified"
                  : `Step ${activeStepId} of 4: ${LIFECYCLE_STEPS[activeStepId - 1].title}`}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              {isDone
                ? "Statutory audit complete — report ready for review and PDF export."
                : isRunning
                ? `Running phase: ${LIFECYCLE_STEPS[activeStepId - 1].shortDesc} (${elapsedSeconds}s)`
                : hasInput
                ? `Ready to analyze for ${businessType} • Click Explain to begin pipeline.`
                : "Awaiting clause input or tax document upload to initialize pipeline."}
            </p>
          </div>
        </div>

        {/* Status badges and collapse toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {isRunning && (
            <Badge
              variant="outline"
              className="bg-gray-100 border-gray-200 text-gray-800 font-mono text-[11px] py-1"
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {elapsedSeconds}s elapsed
            </Badge>
          )}

          {isDone && (
            <Badge
              variant="success"
              className="bg-emerald-50 border-emerald-200 text-emerald-700 font-mono text-[11px] py-1"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-black px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            aria-expanded={isExpanded}
            aria-label="Toggle analysis lifecycle details"
          >
            <span className="hidden sm:inline">
              {isExpanded ? "Hide Details" : "Inspect Steps"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Stepper Progress Visual Bar */}
      <div className="pt-4">
        {/* Desktop / Tablet: Horizontal Stepper with Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {LIFECYCLE_STEPS.map((step) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            const isCurrent = status === "current";
            const isCompleted = status === "completed";

            return (
              <div
                key={step.id}
                onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                className={`group relative flex flex-col p-3 rounded border transition-all cursor-pointer ${
                  isCompleted
                    ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"
                    : isCurrent
                    ? "bg-gray-50 border-gray-400"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-[#111111] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                      Step 0{step.id}
                    </span>
                  </div>

                  <div className="text-right">
                    {isCompleted ? (
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                        Done
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] font-mono text-gray-900 font-semibold flex items-center gap-1">
                        {isRunning ? "Active..." : "Ready"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-400">Pending</span>
                    )}
                  </div>
                </div>

                {/* Step Title & Icon */}
                <div className="flex items-start gap-2">
                  <Icon
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isCompleted
                        ? "text-emerald-600"
                        : isCurrent
                        ? "text-[#111111]"
                        : "text-gray-400"
                    }`}
                  />
                  <div>
                    <h4
                      className={`text-xs font-semibold leading-snug transition-colors ${
                        isCompleted
                          ? "text-gray-900"
                          : isCurrent
                          ? "text-black"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                      {step.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Micro Progress Line on bottom */}
                <div className="mt-3 w-full bg-gray-100 h-1 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCompleted
                        ? "w-full bg-emerald-600"
                        : isCurrent
                        ? isRunning
                          ? "w-3/4 bg-[#111111] animate-pulse"
                          : "w-1/3 bg-[#111111]"
                        : "w-0"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Details Drawer or Selected Step Deep-Dive */}
      {(isExpanded || selectedStep !== null) && (
        <div className="mt-4 pt-3.5 border-t border-gray-200 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-gray-700" />
              <span className="text-xs font-semibold text-gray-900">
                {selectedStep !== null
                  ? `Stage 0${selectedStep}: ${LIFECYCLE_STEPS[selectedStep - 1].title}`
                  : "GST Document Analysis Lifecycle Architecture"}
              </span>
            </div>
            {selectedStep !== null && (
              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                className="text-[11px] text-gray-500 hover:text-black underline cursor-pointer"
              >
                View all stages
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 bg-[#fafafa] p-3.5 rounded border border-gray-200">
            {(selectedStep !== null
              ? [LIFECYCLE_STEPS[selectedStep - 1]]
              : LIFECYCLE_STEPS
            ).map((s) => (
              <div key={s.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                    Stage {s.id}
                  </span>
                  <span className="font-semibold text-gray-900">{s.title}</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{s.detail}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {s.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
