import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  CheckSquare,
  FileCheck,
  Calculator,
  MessageSquare,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  BookOpen,
  Scale,
  Calendar,
  X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/src/components/ui/dialog";

export interface SearchItem {
  id: string;
  category: "Tools" | "GST Sections" | "Compliance Returns" | "ITR Sections";
  title: string;
  subtitle: string;
  keywords: string[];
  path: string;
  icon: React.ElementType;
  badge?: string;
  actionPayload?: any;
}

const SEARCH_DATABASE: SearchItem[] = [
  // Tools
  {
    id: "tool-dashboard",
    category: "Tools",
    title: "Compliance Dashboard",
    subtitle: "Overview of clauses analyzed, compliance score trends, and tax filings",
    keywords: ["dashboard", "home", "stats", "score", "trends", "analytics"],
    path: "/app/dashboard",
    icon: LayoutDashboard,
    badge: "New",
  },
  {
    id: "tool-explainer",
    category: "Tools",
    title: "GST Clause Explainer",
    subtitle: "Convert CGST/SGST statutory clauses and notices into plain English briefs",
    keywords: ["explainer", "clause", "cgst", "sgst", "notice", "circular", "plain english"],
    path: "/app/gst-explainer",
    icon: FileText,
    badge: "Core",
  },
  {
    id: "tool-checklist",
    category: "Tools",
    title: "Compliance Checklist Generator",
    subtitle: "State-specific deadlines, return prep & audit verification workflows",
    keywords: ["checklist", "gstr-1", "gstr-3b", "gstr-9", "deadline", "audit", "state"],
    path: "/app/compliance-checklist",
    icon: CheckSquare,
  },
  {
    id: "tool-invoice",
    category: "Tools",
    title: "Invoice Validator (Rule 46)",
    subtitle: "Audit invoices for Rule 46 requirements, HSN disclosures, and GSTIN validity",
    keywords: ["invoice", "rule 46", "validator", "checker", "hsn", "gstin", "audit"],
    path: "/app/invoice-checker",
    icon: FileCheck,
  },
  {
    id: "tool-itr",
    category: "Tools",
    title: "ITR Section Simplifier",
    subtitle: "AY 2025-26 New Regime (115BAC), 80C, 80D & Presumptive Tax calculators",
    keywords: ["itr", "income tax", "115bac", "80c", "80d", "44ad", "44ada", "regime"],
    path: "/app/itr-helper",
    icon: Calculator,
  },
  {
    id: "tool-chat",
    category: "Tools",
    title: "Tax Q&A Assistant",
    subtitle: "Interactive tax query solver powered by NVIDIA DeepSeek V4",
    keywords: ["chat", "ai", "nvidia", "deepseek", "assistant", "query", "question", "advice"],
    path: "/app/chat",
    icon: MessageSquare,
  },

  // GST Sections
  {
    id: "gst-16-4",
    category: "GST Sections",
    title: "Section 16(4) • ITC Availment Deadline",
    subtitle: "Annual cut-off for claiming Input Tax Credit on invoices and debit notes (30th Nov)",
    keywords: ["16(4)", "16 4", "itc deadline", "input tax credit cutoff", "november", "claim"],
    path: "/app/gst-explainer?sample=16_4",
    icon: Scale,
    badge: "High Risk",
  },
  {
    id: "gst-17-5",
    category: "GST Sections",
    title: "Section 17(5) • Blocked Input Tax Credit",
    subtitle: "Ineligible ITC categories including motor vehicles, food & beverages, personal use",
    keywords: ["17(5)", "17 5", "blocked credit", "ineligible itc", "motor vehicles", "catering"],
    path: "/app/gst-explainer?sample=17_5",
    icon: Scale,
    badge: "Audit Critical",
  },
  {
    id: "gst-29",
    category: "GST Sections",
    title: "Section 29 • Cancellation & Suspension",
    subtitle: "Circumstances for cancellation of GST registration and revocation application rules",
    keywords: ["section 29", "cancellation", "suspension", "revocation", "registration"],
    path: "/app/gst-explainer?sample=29",
    icon: Scale,
  },
  {
    id: "gst-50",
    category: "GST Sections",
    title: "Section 50 • Interest on Delayed Tax Payment",
    subtitle: "18% p.a. interest calculation on net cash tax liability vs gross tax liability",
    keywords: ["section 50", "interest", "delayed payment", "cash ledger", "18 percent"],
    path: "/app/gst-explainer?sample=50",
    icon: Scale,
  },
  {
    id: "gst-rule-46",
    category: "GST Sections",
    title: "Rule 46 • Mandatory Tax Invoice Particulars",
    subtitle: "16 mandatory elements required on tax invoices to safeguard buyer's ITC",
    keywords: ["rule 46", "tax invoice", "mandatory contents", "invoice particulars", "serial number"],
    path: "/app/invoice-checker",
    icon: FileCheck,
  },
  {
    id: "gst-rule-36-4",
    category: "GST Sections",
    title: "Rule 36(4) • GSTR-2B Matching & Ineligible ITC",
    subtitle: "Availment of ITC strictly restricted to supplies appearing in auto-populated GSTR-2B",
    keywords: ["rule 36(4)", "rule 36 4", "gstr-2b matching", "2b reconciliation", "itc mismatch"],
    path: "/app/compliance-checklist?returnType=GSTR-3B",
    icon: Scale,
  },
  {
    id: "gst-rule-86b",
    category: "GST Sections",
    title: "Rule 86B • 1% Mandatory Cash Ledger Payment",
    subtitle: "Restriction on the use of electronic credit ledger for taxable supplies over ₹50 Lakhs/month",
    keywords: ["rule 86b", "86b", "1 percent cash", "taxable supplies 50 lakh", "credit restriction"],
    path: "/app/compliance-checklist?returnType=GSTR-3B",
    icon: Scale,
  },
  {
    id: "gst-73-74",
    category: "GST Sections",
    title: "Section 73 & 74 • Show Cause Notices (DRC-01)",
    subtitle: "Demand of unpaid tax with or without fraud, suppression of facts, or misstatement",
    keywords: ["section 73", "section 74", "drc-01", "scn", "show cause notice", "fraud"],
    path: "/app/gst-explainer",
    icon: Scale,
  },

  // Compliance Returns
  {
    id: "ret-gstr-1",
    category: "Compliance Returns",
    title: "GSTR-1 • Outward Supplies Return",
    subtitle: "Monthly due date: 11th; Quarterly QRMP due date: 13th of the subsequent month",
    keywords: ["gstr-1", "gstr1", "outward supplies", "b2b sales", "b2c sales", "11th"],
    path: "/app/compliance-checklist?returnType=GSTR-1",
    icon: Calendar,
  },
  {
    id: "ret-gstr-3b",
    category: "Compliance Returns",
    title: "GSTR-3B • Monthly Summary & Tax Settlement",
    subtitle: "Monthly due date: 20th; Category 1/2 staggered due dates: 22nd / 24th",
    keywords: ["gstr-3b", "gstr3b", "monthly return", "tax settlement", "20th", "itc claim"],
    path: "/app/compliance-checklist?returnType=GSTR-3B",
    icon: Calendar,
    badge: "Monthly",
  },
  {
    id: "ret-gstr-9",
    category: "Compliance Returns",
    title: "GSTR-9 / 9C • Annual Return & Reconciliation",
    subtitle: "Annual filing due 31st December for regular taxpayers with turnover > ₹2 Crore",
    keywords: ["gstr-9", "gstr-9c", "annual return", "reconciliation statement", "december"],
    path: "/app/compliance-checklist?returnType=GSTR-9",
    icon: Calendar,
  },
  {
    id: "ret-eway-bill",
    category: "Compliance Returns",
    title: "E-Way Bill Compliance (Rule 138)",
    subtitle: "Mandatory consignment value exceeding ₹50,000 across state borders",
    keywords: ["eway bill", "e-way bill", "rule 138", "50000", "transit", "part a", "part b"],
    path: "/app/compliance-checklist",
    icon: Calendar,
  },

  // ITR Sections
  {
    id: "itr-115bac",
    category: "ITR Sections",
    title: "Section 115BAC • AY 2025-26 New Tax Regime",
    subtitle: "Default tax slabs up to ₹3L nil, ₹75k standard deduction, rebate up to ₹7L",
    keywords: ["115bac", "new tax regime", "ay 2025-26", "slabs", "standard deduction 75000"],
    path: "/app/itr-helper?section=115BAC",
    icon: Calculator,
    badge: "AY 2025-26",
  },
  {
    id: "itr-80c",
    category: "ITR Sections",
    title: "Section 80C • Tax Deductions (Max ₹1.5L)",
    subtitle: "Deductions for EPF, PPF, ELSS, Life Insurance, Home loan principal, Tuition fees",
    keywords: ["80c", "deductions", "ppf", "elss", "lic", "1.5 lakh", "old regime"],
    path: "/app/itr-helper?section=80C",
    icon: Calculator,
  },
  {
    id: "itr-80d",
    category: "ITR Sections",
    title: "Section 80D • Health Insurance Deduction",
    subtitle: "Up to ₹25,000 for self/family and additional ₹50,000 for senior citizen parents",
    keywords: ["80d", "health insurance", "medical", "mediclaim", "parents", "senior citizen"],
    path: "/app/itr-helper?section=80D",
    icon: Calculator,
  },
  {
    id: "itr-44ad",
    category: "ITR Sections",
    title: "Section 44AD / 44ADA • Presumptive Taxation",
    subtitle: "6% / 8% deemed profit for businesses and 50% deemed profit for professionals",
    keywords: ["44ad", "44ada", "presumptive taxation", "freelancers", "professionals", "small business"],
    path: "/app/itr-helper?section=44AD",
    icon: Calculator,
  },
];

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown listener for Command+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [open]);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return SEARCH_DATABASE;
    }
    const q = query.toLowerCase().trim();
    return SEARCH_DATABASE.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q))
      );
    });
  }, [query]);

  // Group by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    filteredResults.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredResults]);

  // Flat list for arrow navigation
  const flatItems = useMemo(() => {
    return filteredResults;
  }, [filteredResults]);

  // Handle keyboard navigation inside the list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Enter" && flatItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatItems[selectedIndex]);
    }
  };

  const handleSelect = (item: SearchItem) => {
    onOpenChange(false);
    navigate(item.path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border border-gray-200 bg-white text-gray-900 shadow-xl">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-200 bg-gray-50">
          <Search className="h-5 w-5 text-gray-700 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search GST sections, compliance rules, ITR slabs, tools... (e.g. 16(4), GSTR-3B, 115BAC)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none border-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-gray-400 hover:text-gray-700 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 ml-2 text-[10px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-gray-100">
          {flatItems.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-gray-700">No statutory sections found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for "16(4)", "17(5)", "GSTR-3B", "Rule 46", or "115BAC"
              </p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([category, items]) => (
              <div key={category} className="py-2">
                <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                  {category}
                </div>
                <div className="space-y-0.5 mt-1">
                  {items.map((item) => {
                    const isSelected = flatItems[selectedIndex]?.id === item.id;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => {
                          const idx = flatItems.findIndex((x) => x.id === item.id);
                          if (idx !== -1) setSelectedIndex(idx);
                        }}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-gray-100 text-gray-900"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={`p-2 rounded-md shrink-0 ${
                              isSelected
                                ? "bg-[#111111] text-white"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate text-[#111111]">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-gray-100 text-gray-800 border border-gray-200 shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 truncate">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                        <ArrowRight
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isSelected
                              ? "text-gray-900 translate-x-0.5"
                              : "text-gray-400 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700">↑</kbd>{" "}
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700">↓</kbd> navigate
            </span>
            <span>
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700">↵</kbd> select
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-900 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>TaxPlain Statutory Directory</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
