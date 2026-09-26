import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  X,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Tag,
  Info,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export interface TermDefinition {
  acronym: string;
  fullName: string;
  category: "ITC" | "Invoicing" | "Notices" | "Filing" | "Procedure";
  definition: string;
  caTip: string;
  referenceSection?: string;
}

export const GST_TAX_TERMS: TermDefinition[] = [
  {
    acronym: "ITC",
    fullName: "Input Tax Credit",
    category: "ITC",
    definition:
      "Taxes paid on purchase of goods or services used in the course or furtherance of business, credited to Electronic Credit Ledger to offset output tax liability.",
    caTip: "Subject to Section 16(2) four conditions and Section 17(5) blocked credit restrictions.",
    referenceSection: "Section 16, CGST Act",
  },
  {
    acronym: "DRC-01B",
    fullName: "Intimation of Difference in Liability (GSTR-1 vs GSTR-3B)",
    category: "Notices",
    definition:
      "Statutory electronic intimation generated under Rule 88C when output tax reported in GSTR-1 exceeds tax paid in GSTR-3B beyond prescribed threshold percentage.",
    caTip: "Requires response or payment within 7 days; failure blocks subsequent period GSTR-1 filing.",
    referenceSection: "Rule 88C, CGST Rules",
  },
  {
    acronym: "DRC-01C",
    fullName: "Intimation of Difference in ITC (GSTR-2B vs GSTR-3B)",
    category: "Notices",
    definition:
      "Automated system intimation under Rule 88D issued when ITC availed in GSTR-3B exceeds ITC reflected in auto-generated GSTR-2B by Council-defined margin.",
    caTip: "Must justify difference with reconciliation or pay back differential ITC with interest under Sec 50.",
    referenceSection: "Rule 88D, CGST Rules",
  },
  {
    acronym: "RCM",
    fullName: "Reverse Charge Mechanism",
    category: "Procedure",
    definition:
      "Mechanism where the liability to pay GST is on the recipient of goods/services instead of the supplier (e.g., GTA, advocate services, director fees).",
    caTip: "RCM liability must strictly be paid through cash ledger; ITC cannot be utilized for RCM discharge.",
    referenceSection: "Section 9(3) & 9(4), CGST Act",
  },
  {
    acronym: "POS",
    fullName: "Place of Supply",
    category: "Invoicing",
    definition:
      "Legal benchmark determining whether a transaction is Intra-State (attracting CGST + SGST) or Inter-State (attracting IGST).",
    caTip: "Charging IGST instead of CGST+SGST in error requires re-payment under Sec 77 and claiming refund of wrong tax.",
    referenceSection: "Section 10 & 12, IGST Act",
  },
  {
    acronym: "HSN / SAC",
    fullName: "Harmonized System of Nomenclature / Service Accounting Code",
    category: "Invoicing",
    definition:
      "Standardized 6-to-8 digit uniform code mandated on invoices to categorize commodities and services under specific tax rate schedules.",
    caTip: "B2B invoices for turnover > ₹5 Cr require 6-digit HSN under Notification 78/2020.",
    referenceSection: "Rule 46(g), CGST Rules",
  },
  {
    acronym: "Rule 86B",
    fullName: "1% Mandatory Cash Ledger Payment Rule",
    category: "Filing",
    definition:
      "Restriction capping utilization of electronic credit ledger at 99% of output tax liability when taxable turnover in a month exceeds ₹50 Lakhs.",
    caTip: "Exceptions apply if managing director has paid > ₹1L income tax or firm received > ₹1L GST refund.",
    referenceSection: "Rule 86B, CGST Rules",
  },
  {
    acronym: "Section 16(4)",
    fullName: "Cut-off Date for ITC Availment",
    category: "ITC",
    definition:
      "Statutory limitation deadline barring ITC claims on invoices/debit notes past 30th November following the fiscal year-end or annual return filing.",
    caTip: "Finance Act 2024 inserted Sec 16(5) offering conditional retrospective relief for FY 17-18 to 20-21.",
    referenceSection: "Section 16(4), CGST Act",
  },
  {
    acronym: "Section 17(5)",
    fullName: "Blocked / Ineligible Input Tax Credit",
    category: "ITC",
    definition:
      "Statutory negative list where ITC cannot be claimed regardless of business usage (motor vehicles, food/beverage, club memberships, goods lost/written off).",
    caTip: "Always reverse corresponding ITC in Table 4(B)(1) of GSTR-3B to prevent Section 73/74 scrutiny.",
    referenceSection: "Section 17(5), CGST Act",
  },
  {
    acronym: "SCN",
    fullName: "Show Cause Notice",
    category: "Notices",
    definition:
      "Formal statutory notice issued under Section 73 (non-fraud) or Section 74 (fraud/suppression) demanding tax, interest, and penalties.",
    caTip: "Always verify if pre-notice intimation in Part A of Form DRC-01A was served prior to SCN issuance.",
    referenceSection: "Section 73 & 74, CGST Act",
  },
  {
    acronym: "GSTR-3B",
    fullName: "Monthly Summary Self-Assessed Return",
    category: "Filing",
    definition:
      "Mandatory monthly return declaring outward supplies, input tax credit availed, reversed, and discharging tax liability via cash or credit ledger.",
    caTip: "Late filing attracts statutory interest @18% p.a. under Sec 50 on net cash liability.",
    referenceSection: "Section 39, CGST Act",
  },
  {
    acronym: "GSTR-2B",
    fullName: "Auto-Drafted Static ITC Statement",
    category: "ITC",
    definition:
      "Static monthly ITC statement generated on the 14th of subsequent month based on suppliers' GSTR-1 filings, serving as the benchmark for Rule 36(4).",
    caTip: "ITC cannot be availed unless reflected in GSTR-2B as mandated by Section 16(2)(aa).",
    referenceSection: "Rule 60(7), CGST Rules",
  },
  {
    acronym: "LUT",
    fullName: "Letter of Undertaking",
    category: "Procedure",
    definition:
      "Annual statutory facility filed in Form GST RFD-11 permitting zero-rated export of goods or services without prior payment of integrated tax (IGST).",
    caTip: "Must be filed online on the GST portal before commencing export supplies for each financial year.",
    referenceSection: "Rule 96A, CGST Rules",
  },
  {
    acronym: "E-Way Bill",
    fullName: "Electronic Way Bill for Goods Movement",
    category: "Procedure",
    definition:
      "Electronic documentation generated on portal for consignment value exceeding ₹50,000 before commencement of transportation.",
    caTip: "Mismatch between invoice number or vehicle number leads to heavy Section 129 detention penalties.",
    referenceSection: "Rule 138, CGST Rules",
  },
];

interface TaxGlossaryCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaxGlossaryCard({ isOpen, onClose }: TaxGlossaryCardProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "ITC", "Invoicing", "Notices", "Filing", "Procedure"];

  const filteredTerms = useMemo(() => {
    return GST_TAX_TERMS.filter((term) => {
      const matchesCat =
        selectedCategory === "All" || term.category === selectedCategory;
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        term.acronym.toLowerCase().includes(query) ||
        term.fullName.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query) ||
        (term.referenceSection && term.referenceSection.toLowerCase().includes(query));
      return matchesCat && matchesSearch;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      id="tax-glossary-floating-card"
      className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] max-w-md sm:w-[450px] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[85vh] animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-gray-100 text-gray-900 border border-gray-200">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              GST Tax Terminology
              <span className="text-[10px] font-mono font-normal bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded border border-gray-200">
                Live QuickRef
              </span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Instant definitions &amp; CA practitioner tips
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center cursor-pointer"
          title="Close terminology guide"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="p-3 bg-white border-b border-gray-200 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search acronyms (e.g., ITC, DRC-01B, RCM)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-1 focus-visible:ring-gray-900"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-900 text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded border font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-gray-900 border-gray-900 text-white font-medium shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List of Definitions */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y-0">
        {filteredTerms.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500">
            No terminology matches &ldquo;{search}&rdquo;. Try searching for &ldquo;ITC&rdquo; or &ldquo;Notice&rdquo;.
          </div>
        ) : (
          filteredTerms.map((item) => (
            <div
              key={item.acronym}
              className="group p-3 rounded-md bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-150"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                      {item.acronym}
                    </span>
                    <span className="text-xs font-medium text-[#111111]">
                      {item.fullName}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                  {item.category}
                </span>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed mt-1.5">
                {item.definition}
              </p>

              <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-start gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200/60">
                <Sparkles className="h-3 w-3 shrink-0 mt-0.5 text-emerald-600" />
                <span className="leading-snug">{item.caTip}</span>
              </div>

              {item.referenceSection && (
                <div className="mt-1.5 text-[10px] font-mono text-gray-400 flex items-center gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  <span>Statutory Reference: {item.referenceSection}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
        <span>Showing {filteredTerms.length} GST concepts</span>
        <button
          onClick={() => {
            setSearch("");
            setSelectedCategory("All");
          }}
          className="text-gray-900 font-medium hover:underline cursor-pointer"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

/**
 * Self-contained floating widget with persistent toggle button and searchable tax card
 */
export function TaxGlossaryFloatingWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        id="tax-glossary-floating-toggle-btn"
        className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all duration-200 cursor-pointer font-medium text-xs active:scale-95 ${
          isOpen
            ? "bg-[#111111] text-white ring-4 ring-gray-900/10 scale-105"
            : "bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:scale-105 shadow-sm"
        }`}
        title="Toggle GST Tax Terminology & Legal Jargon Guide"
      >
        <BookOpen className={`h-4 w-4 ${isOpen ? "text-white" : "text-gray-900"}`} />
        <span className="font-semibold hidden sm:inline">Tax Terms</span>
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-200">
          {GST_TAX_TERMS.length}
        </span>
      </button>

      <TaxGlossaryCard isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
