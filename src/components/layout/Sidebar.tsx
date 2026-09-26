import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  FileCheck,
  Calculator,
  MessageSquare,
  ArrowLeft,
  Key,
  ShieldCheck,
  ShieldAlert,
  Search,
  Clock,
  RotateCcw,
  X,
  History,
  Tag,
  Layers,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useState, useEffect } from "react";
import { SecurityShieldModal } from "@/src/components/shared/SecurityShieldModal";
import { fetchSecurityStatus, SecurityStatus } from "@/src/lib/groq";
import {
  getRecentActivities,
  getActivitiesFiltered,
  deleteRecentActivity,
  ActivityItem,
  ActivityType,
  ACTIVITY_CATEGORIES,
  formatRelativeTime,
  clearRecentActivities,
} from "@/src/lib/recentActivity";
import { toast } from "sonner";

export const appNavItems = [
  {
    path: "/app/dashboard",
    label: "Compliance Dashboard",
    shortLabel: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/app/gst-explainer",
    label: "GST Clause Explainer",
    shortLabel: "Explainer",
    icon: FileText,
    badge: "Primary",
  },
  {
    path: "/app/compliance-checklist",
    label: "Compliance Checklist",
    shortLabel: "Checklist",
    icon: CheckSquare,
  },
  {
    path: "/app/invoice-checker",
    label: "Invoice Validator",
    shortLabel: "Invoices",
    icon: FileCheck,
  },
  {
    path: "/app/itr-helper",
    label: "ITR Section Simplifier",
    shortLabel: "ITR Helper",
    icon: Calculator,
  },
  {
    path: "/app/chat",
    label: "Tax Q&A Assistant",
    shortLabel: "Tax Chat",
    icon: MessageSquare,
  },
];

export function Sidebar() {
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [historyCategory, setHistoryCategory] = useState<ActivityType | "all">("all");
  const [historySearch, setHistorySearch] = useState("");
  const navigate = useNavigate();

  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);

  useEffect(() => {
    fetchSecurityStatus().then(setSecurityStatus);
    setRecentActivities(getRecentActivities());
    const handleUpdate = () => {
      setRecentActivities(getRecentActivities());
    };
    window.addEventListener("taxplain_activity_updated", handleUpdate);
    return () => window.removeEventListener("taxplain_activity_updated", handleUpdate);
  }, []);

  return (
    <>
      <aside
        className="hidden md:flex md:w-64 lg:w-72 flex-col shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 z-30 select-none overflow-hidden"
        aria-label="App Sidebar"
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5 bg-white shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#111111] font-bold text-white text-sm">
              TP
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight leading-none text-[#111111]">
                TaxPlain
              </span>
              <span className="text-[10px] text-gray-500 leading-tight mt-0.5">
                AI Compliance Suite
              </span>
            </div>
          </Link>
        </div>

        {/* Engine Status & Security Vault Badge */}
        <div className="mx-3 mt-3 mb-2 p-2.5 rounded bg-[#fafafa] border border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Layers className="h-3 w-3 shrink-0 text-gray-400" /> ARCHITECTURE
            </span>
            <span
              className="text-xs font-medium text-gray-900 truncate"
              title={securityStatus?.model || "NVIDIA DeepSeek V4 Pro"}
            >
              NVIDIA DeepSeek V4
            </span>
          </div>
          <button
            onClick={() => setSecurityModalOpen(true)}
            aria-label="View System Architecture"
            title="System Architecture & Security"
            className="p-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black transition-colors cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable Navigation & Recent Activity list */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {/* Main Navigation Items */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Tax Workspaces
            </div>
            {appNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between gap-3 px-3 py-2 rounded text-xs font-medium transition-all group",
                      isActive
                        ? "bg-gray-100 text-[#111111] border border-gray-200 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-[#111111]" : "text-gray-400 group-hover:text-gray-600"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* ENHANCED RECENT DOCUMENTS & SEARCH HISTORY PANEL */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            {/* Header with Title and Clear Action */}
            <div className="flex items-center justify-between px-1 pb-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <History className="h-3 w-3 text-gray-500" />
                <span>Search & Query History</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200">
                  {recentActivities.length}
                </span>
              </div>
              {recentActivities.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearRecentActivities(historyCategory === "all" ? undefined : historyCategory);
                    toast.success(
                      historyCategory === "all"
                        ? "Cleared all recent search history"
                        : `Cleared ${historyCategory.replace(/_/g, " ")} history`
                    );
                  }}
                  title="Clear history"
                  className="text-[10px] text-gray-400 hover:text-red-600 transition-colors p-0.5 rounded cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Document Type Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={() => setHistoryCategory("all")}
                className={cn(
                  "px-2 py-0.5 rounded font-medium whitespace-nowrap transition-colors cursor-pointer",
                  historyCategory === "all"
                    ? "bg-[#111111] text-white"
                    : "bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200"
                )}
              >
                All ({recentActivities.length})
              </button>
              {(Object.keys(ACTIVITY_CATEGORIES) as ActivityType[]).map((catKey) => {
                const count = recentActivities.filter((a) => a.type === catKey).length;
                if (count === 0 && historyCategory !== catKey) return null;
                const meta = ACTIVITY_CATEGORIES[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setHistoryCategory(catKey)}
                    className={cn(
                      "px-2 py-0.5 rounded font-medium whitespace-nowrap transition-colors cursor-pointer",
                      historyCategory === catKey
                        ? "bg-[#111111] text-white"
                        : "bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200"
                    )}
                  >
                    {meta.shortLabel} ({count})
                  </button>
                );
              })}
            </div>

            {/* History Search Filter Input */}
            <div className="relative">
              <Search className="h-3 w-3 text-gray-400 absolute left-2 top-2.5" />
              <input
                type="text"
                placeholder="Filter past queries..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-7 pr-6 py-1.5 rounded bg-white border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch("")}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* History List */}
            {(() => {
              const filteredList = getActivitiesFiltered(historyCategory, historySearch);
              if (filteredList.length === 0) {
                return (
                  <div className="px-3 py-4 text-center rounded bg-gray-50 border border-gray-200 text-[11px] text-gray-500">
                    {historySearch
                      ? `No past queries matching "${historySearch}"`
                      : "No queries saved in this category"}
                  </div>
                );
              }

              return (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {filteredList.map((act) => {
                    const catMeta = ACTIVITY_CATEGORIES[act.type] || ACTIVITY_CATEGORIES.clause_explainer;
                    return (
                      <div
                        key={act.id}
                        onClick={() => {
                          navigate(act.path);
                          toast.info(`Revisiting: ${act.title}`);
                        }}
                        className="group relative flex flex-col p-2 rounded bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#242424] border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#404040] cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border bg-gray-100 dark:bg-[#242424] text-gray-600 dark:text-[#d1d5db] border-gray-200 dark:border-[#2a2a2a] shrink-0">
                              {catMeta.shortLabel}
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-[#f2f2f2] group-hover:text-black dark:group-hover:text-white truncate">
                              {act.title}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-400 dark:text-[#9ca3af] shrink-0">
                            {formatRelativeTime(act.timestamp)}
                          </span>
                        </div>

                        <span className="text-[10px] text-gray-500 dark:text-[#9ca3af] line-clamp-1 mt-1">
                          {act.snippet}
                        </span>

                        {/* Status tag & Quick delete on hover */}
                        <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-gray-100 dark:border-[#2a2a2a] text-[9px] text-gray-400 dark:text-[#9ca3af]">
                          <span>{act.data?.status || "Saved Query"}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRecentActivity(act.id);
                              toast.success("Removed item from history");
                            }}
                            title="Remove from history"
                            className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity p-0.5 cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="p-3 border-t border-gray-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors py-1 px-1 rounded hover:bg-gray-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Site</span>
            </Link>
            <span className="text-[10px] text-gray-400">v1.2.0</span>
          </div>
        </div>
      </aside>

      {/* Production Security & API Key Vault Modal */}
      <SecurityShieldModal
        open={securityModalOpen}
        onOpenChange={setSecurityModalOpen}
      />
    </>
  );
}

