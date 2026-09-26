export type ActivityType =
  | "clause_explainer"
  | "compliance_checklist"
  | "invoice_checker"
  | "itr_helper"
  | "tax_chat";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  snippet: string;
  timestamp: number;
  path: string;
  data?: Record<string, any>;
}

export interface ActivityCategoryMeta {
  label: string;
  shortLabel: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const ACTIVITY_CATEGORIES: Record<ActivityType, ActivityCategoryMeta> = {
  clause_explainer: {
    label: "GST Clauses & Notices",
    shortLabel: "Clauses",
    color: "#3b82f6",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-400",
    borderColor: "border-blue-500/30",
  },
  invoice_checker: {
    label: "Rule 46 Invoices",
    shortLabel: "Invoices",
    color: "#10b981",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  compliance_checklist: {
    label: "GST Return Checklists",
    shortLabel: "Checklists",
    color: "#f59e0b",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    borderColor: "border-amber-500/30",
  },
  itr_helper: {
    label: "ITR Deductions & Limits",
    shortLabel: "ITR",
    color: "#a855f7",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-400",
    borderColor: "border-purple-500/30",
  },
  tax_chat: {
    label: "CA Consultations",
    shortLabel: "Chat",
    color: "#06b6d4",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-400",
    borderColor: "border-cyan-500/30",
  },
};

const STORAGE_KEY = "taxplain_recent_activities";
const MAX_ACTIVITIES = 25;

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-init-1",
    type: "clause_explainer",
    title: "Section 16(4) ITC Cutoff Window",
    snippet: "Annual deadline for availing input tax credit on invoices & debit notes under CGST Act.",
    timestamp: Date.now() - 1000 * 60 * 35, // 35 mins ago
    path: "/app/gst-explainer?sample=16_4",
    data: {
      clause: "Section 16(4): A registered person shall not be entitled to take input tax credit in respect of any invoice or debit note for supply of goods or services or both after the thirtieth day of November following the end of financial year to which such invoice or debit note pertains...",
      section: "Sec 16(4)",
      status: "Cutoff Nov 30",
      businessType: "Private Limited",
    },
  },
  {
    id: "act-init-2",
    type: "invoice_checker",
    title: "Rule 46 B2B Tax Invoice #INV-2024-884",
    snippet: "B2B supply invoice checked for 16 statutory elements, GSTIN format & HSN disclosure.",
    timestamp: Date.now() - 1000 * 60 * 75, // 1 hour 15m ago
    path: "/app/invoice-checker",
    data: {
      section: "Rule 46",
      status: "Compliant (16/16)",
      score: "10/10",
      supplierGstin: "24AAACG1234F1Z8",
      recipientGstin: "27AABCU9603R1ZM",
    },
  },
  {
    id: "act-init-3",
    type: "clause_explainer",
    title: "Section 17(5) Blocked Credits Analysis",
    snippet: "Statutory restriction on input tax credit for motor vehicles, catering & personal consumption.",
    timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
    path: "/app/gst-explainer?sample=17_5",
    data: {
      clause: "Section 17(5)(a): Notwithstanding anything contained in sub-section (1) of section 16 and subsection (1) of section 18, input tax credit shall not be available in respect of motor vehicles for transportation of persons...",
      section: "Sec 17(5)",
      status: "Ineligible ITC Flagged",
      businessType: "LLP",
    },
  },
  {
    id: "act-init-4",
    type: "invoice_checker",
    title: "Export Invoice Audit #EXP/2024/092",
    snippet: "Zero-rated export of services verified for LUT reference, foreign currency & POS.",
    timestamp: Date.now() - 1000 * 60 * 360, // 6 hours ago
    path: "/app/invoice-checker",
    data: {
      section: "Rule 46 / 96A",
      status: "LUT Verified",
      score: "9.5/10",
      taxType: "Zero-Rated (LUT)",
    },
  },
  {
    id: "act-init-5",
    type: "clause_explainer",
    title: "Section 16(2) Supplier 180-Day Payment",
    snippet: "Recipient obligation to pay supplier within 180 days from invoice date to prevent ITC reversal.",
    timestamp: Date.now() - 1000 * 60 * 600, // 10 hours ago
    path: "/app/gst-explainer?sample=16_2",
    data: {
      clause: "Section 16(2) Second Proviso: Where a recipient fails to pay to the supplier of goods or services, the amount towards the value of supply along with tax payable thereon within a period of one hundred and eighty days...",
      section: "Sec 16(2)(c)",
      status: "Reversal Risk",
      businessType: "Sole Proprietor",
    },
  },
  {
    id: "act-init-6",
    type: "compliance_checklist",
    title: "GSTR-3B Monthly Return • Gujarat",
    snippet: "Pvt Ltd firm, turnover ₹5Cr–₹20Cr. Pre-filing verification & Rule 36(4) ITC cap.",
    timestamp: Date.now() - 1000 * 60 * 1200, // 20 hours ago
    path: "/app/compliance-checklist",
    data: {
      state: "Gujarat",
      turnover: "5cr_to_20cr",
      returnType: "GSTR-3B",
    },
  },
  {
    id: "act-init-7",
    type: "itr_helper",
    title: "Section 80CCD(1B) NPS ₹50,000 Additional Cap",
    snippet: "Exclusive deduction over and above ₹1.5L Section 80C threshold under Old Tax Regime.",
    timestamp: Date.now() - 1000 * 60 * 1800, // 30 hours ago
    path: "/app/itr-helper",
    data: {
      section: "Sec 80CCD(1B)",
      regime: "Old Regime Only",
      limit: "₹50,000",
    },
  },
  {
    id: "act-init-8",
    type: "tax_chat",
    title: "DRC-01 Notice Response Strategy for 88C",
    snippet: "CA consultation on replying to automated liability mismatch notices without paying penalties.",
    timestamp: Date.now() - 1000 * 60 * 2400, // 40 hours ago
    path: "/app/chat",
    data: {
      topic: "Rule 88C DRC-01B Response",
    },
  },
];

export function getRecentActivities(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
      return INITIAL_ACTIVITIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ACTIVITIES;
  } catch {
    return INITIAL_ACTIVITIES;
  }
}

export function getActivityById(id: string): ActivityItem | undefined {
  const activities = getRecentActivities();
  return activities.find((a) => a.id === id);
}

export function getActivitiesFiltered(
  category?: ActivityType | "all",
  searchQuery?: string
): ActivityItem[] {
  let list = getRecentActivities();

  if (category && category !== "all") {
    list = list.filter((item) => item.type === category);
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        (item.data && JSON.stringify(item.data).toLowerCase().includes(q))
    );
  }

  return list;
}

export function addRecentActivity(item: Omit<ActivityItem, "id" | "timestamp">): ActivityItem {
  const activities = getRecentActivities();
  const newItem: ActivityItem = {
    ...item,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };

  // Avoid duplicate title at the top
  const filtered = activities.filter((a) => a.title !== newItem.title);
  const updated = [newItem, ...filtered].slice(0, MAX_ACTIVITIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("taxplain_activity_updated", { detail: newItem }));
  } catch (err) {
    console.error("Failed to save activity", err);
  }

  return newItem;
}

export function clearRecentActivities(type?: ActivityType): void {
  try {
    if (type) {
      const remaining = getRecentActivities().filter((a) => a.type !== type);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent("taxplain_activity_updated"));
  } catch (err) {
    console.error("Failed to clear activities", err);
  }
}

export function deleteRecentActivity(id: string): void {
  const activities = getRecentActivities().filter((a) => a.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    window.dispatchEvent(new CustomEvent("taxplain_activity_updated"));
  } catch (err) {
    console.error("Failed to delete activity", err);
  }
}

export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Returns the last analyzed tax clauses and invoices (filtered from activity or initialized)
 */
export function getRecentDocuments(limit = 5): ActivityItem[] {
  const all = getRecentActivities();
  const docs = all.filter(
    (item) => item.type === "clause_explainer" || item.type === "invoice_checker"
  );

  // If user hasn't analyzed 5 yet, fill from initial activities
  if (docs.length < limit) {
    const fallback = INITIAL_ACTIVITIES.filter(
      (item) => item.type === "clause_explainer" || item.type === "invoice_checker"
    );
    const existingIds = new Set(docs.map((d) => d.title));
    for (const fb of fallback) {
      if (!existingIds.has(fb.title)) {
        docs.push(fb);
        existingIds.add(fb.title);
      }
      if (docs.length >= limit) break;
    }
  }

  return docs.slice(0, limit);
}
