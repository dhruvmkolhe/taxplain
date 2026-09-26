import React, { useState } from "react";
import {
  FileText,
  CheckSquare,
  FileCheck,
  Calculator,
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Compass,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

interface Step {
  id: number;
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  keyHighlights: string[];
}

const TOUR_STEPS: Step[] = [
  {
    id: 1,
    title: "Welcome to TaxPlain",
    tagline: "India's Statutory Tax & GST Simplifier",
    description:
      "TaxPlain turns complex Indian tax statutes, CBIC circulars, and tax notices into clear, actionable plain English. Designed specifically for Chartered Accountants, tax consultants, and SME owners.",
    icon: Compass,
    badge: "Getting Started",
    keyHighlights: [
      "Translates legalistic GST and ITR statutes into zero-jargon English",
      "Direct browser AI engine ensures financial queries stay confidential",
      "Tailored for Indian tax law, AY 2025–26, and Rule 46 compliance",
    ],
  },
  {
    id: 2,
    title: "GST Clause Explainer",
    tagline: "Demystify Circulars & Notices in Seconds",
    description:
      "Paste any Section, notification, or assessment notice (such as Section 16(4) ITC cutoffs or Section 17(5) blocked credits) to generate plain English summaries, risk levels, and client-ready PDFs.",
    icon: FileText,
    badge: "Core Engine",
    keyHighlights: [
      "Select entity type (Proprietor, LLP, Pvt Ltd) for contextual risk analysis",
      "Live token streaming with exportable PDF briefs",
      "Quick-load sample statutory clauses with one click",
    ],
  },
  {
    id: 3,
    title: "Compliance Checklist Generator",
    tagline: "State-Specific Return & Audit Preparation",
    description:
      "Generate comprehensive verification checklists for GSTR-1, GSTR-3B, GSTR-9, and E-Way bills tailored to your state/UT and turnover slab (e.g. Rule 36(4) matching and Rule 86B cash limits).",
    icon: CheckSquare,
    badge: "Filing Prep",
    keyHighlights: [
      "Covers all 28 states and 8 union territories",
      "Interactive checkboxes with session persistence",
      "Upcoming statutory deadline calendar alerts",
    ],
  },
  {
    id: 4,
    title: "Invoice Validator & ITR Simplifier",
    tagline: "Rule 46 Audit & AY 2025-26 Tax Slabs",
    description:
      "Audit B2B tax invoices against the 16 mandatory Rule 46 requirements to safeguard buyer ITC. Compare the New Tax Regime (Section 115BAC) with Old Regime deductions in the ITR section.",
    icon: FileCheck,
    badge: "Verification",
    keyHighlights: [
      "Rule 46 compliance score with missing field flags",
      "Presumptive taxation calculators (Section 44AD / 44ADA)",
      "Section 80C, 80D, and home loan deduction breakdowns",
    ],
  },
  {
    id: 5,
    title: "Command+K & Power Navigation",
    tagline: "Instant Search for Sections & Rules",
    description:
      "Press ⌘K or Ctrl+K anywhere in the workspace to instantly search any GST Section, statutory rule, or compliance resource. Switch between dark and high-contrast light themes anytime.",
    icon: Search,
    badge: "Pro Tips",
    keyHighlights: [
      "Global shortcut ⌘K / Ctrl+K for instant navigation",
      "Track previously generated checklists in Recent Activity",
      "High-contrast light theme available for printing and bright offices",
    ],
  },
];

interface OnboardingWalkthroughProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function OnboardingWalkthrough({
  open,
  onOpenChange,
  onComplete,
}: OnboardingWalkthroughProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const step = TOUR_STEPS[currentStepIndex];
  const Icon = step.icon;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleFinish = () => {
    localStorage.setItem("taxplain_onboarding_completed", "true");
    onOpenChange(false);
    if (onComplete) onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border border-gray-200 bg-white text-gray-900 shadow-xl rounded-md">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-900" />
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">
              TaxPlain Tour • Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
            {step.badge}
          </span>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-md bg-gray-100 border border-gray-200 text-gray-900 shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-[#111111]">
                {step.title}
              </h2>
              <p className="text-xs font-mono text-gray-600">{step.tagline}</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">
            {step.description}
          </p>

          {/* Highlights checklist */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              What you can do:
            </div>
            {step.keyHighlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <span>{highlight}</span>
              </div>
            ))}
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-6 bg-[#111111]"
                    : idx < currentStepIndex
                    ? "w-2 bg-emerald-600"
                    : "w-2 bg-gray-200"
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFinish}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            Skip Tour
          </Button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="text-xs h-9 border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-[#111111] hover:bg-black text-white font-medium text-xs h-9 px-4 cursor-pointer rounded-md shadow-sm"
            >
              {isLastStep ? (
                <>
                  <span>Get Started</span>
                  <Sparkles className="h-3.5 w-3.5 ml-1.5 text-yellow-300" />
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
