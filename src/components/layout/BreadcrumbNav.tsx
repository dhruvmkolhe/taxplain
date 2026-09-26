import React from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import {
  ChevronRight,
  Home,
  LayoutDashboard,
  FileText,
  CheckSquare,
  FileCheck,
  Calculator,
  MessageSquare,
  Tag,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface RouteConfig {
  category: string;
  categoryPath?: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const ROUTE_CONFIG_MAP: Record<string, RouteConfig> = {
  "/app": {
    category: "Compliance Workspace",
    categoryPath: "/app/dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "Statutory health, metrics & deadlines",
  },
  "/app/dashboard": {
    category: "Compliance Workspace",
    categoryPath: "/app/dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "Statutory health, metrics & deadlines",
  },
  "/app/gst-explainer": {
    category: "GST Law",
    categoryPath: "/app/dashboard",
    title: "Clause Explainer",
    icon: FileText,
    description: "Statutory clause plain-English breakdown",
  },
  "/app/compliance-checklist": {
    category: "GST Compliance",
    categoryPath: "/app/dashboard",
    title: "Checklist Generator",
    icon: CheckSquare,
    description: "Return filing audit & verification checks",
  },
  "/app/invoice-checker": {
    category: "Audit & Verification",
    categoryPath: "/app/dashboard",
    title: "Rule 46 Invoice Checker",
    icon: FileCheck,
    description: "16-point statutory invoice compliance audit",
  },
  "/app/itr-helper": {
    category: "Direct Tax",
    categoryPath: "/app/dashboard",
    title: "ITR & Deduction Helper",
    icon: Calculator,
    description: "Section breakdown, limits & tax regime advisor",
  },
  "/app/chat": {
    category: "AI Advisory",
    categoryPath: "/app/dashboard",
    title: "Tax Q&A Assistant",
    icon: MessageSquare,
    description: "Conversational Indian tax & GST intelligence",
  },
};

export function BreadcrumbNav() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = React.useState(false);

  const pathname = location.pathname.replace(/\/$/, ""); // strip trailing slash
  const config = ROUTE_CONFIG_MAP[pathname] || {
    category: "Workspace",
    categoryPath: "/app/dashboard",
    title: pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Page",
    icon: FileText,
  };

  // Optional contextual query tag
  const sampleParam = searchParams.get("sample");
  const sectionParam = searchParams.get("section");
  const returnParam = searchParams.get("returnType");

  let contextualBadge: string | null = null;
  if (sampleParam) {
    if (sampleParam === "16_4") contextualBadge = "Sec 16(4) Cutoff";
    else if (sampleParam === "17_5") contextualBadge = "Sec 17(5) Blocked";
    else if (sampleParam === "16_2") contextualBadge = "Sec 16(2) 180-Day";
    else contextualBadge = `Clause: ${sampleParam}`;
  } else if (sectionParam) {
    contextualBadge = `Sec ${sectionParam}`;
  } else if (returnParam) {
    contextualBadge = returnParam;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Workspace route URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const CurrentIcon = config.icon;

  return (
    <nav
      aria-label="Breadcrumb"
      id="workspace-breadcrumb-nav"
      className="border-b border-gray-200 bg-white px-4 sm:px-6 py-2 flex items-center justify-between min-h-[38px] sticky top-14 z-10 transition-colors"
    >
      {/* Breadcrumb Path List */}
      <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs min-w-0">
        {/* Step 1: Root Workspace Home */}
        <li className="flex items-center">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors"
            title="Go to Compliance Dashboard"
          >
            <Home className="h-3.5 w-3.5 text-gray-700" />
            <span className="font-medium hidden xs:inline">Workspace</span>
          </Link>
        </li>

        {/* Separator 1 */}
        <li aria-hidden="true" className="text-gray-300 flex items-center">
          <ChevronRight className="h-3 w-3" />
        </li>

        {/* Step 2: Category Group */}
        <li className="flex items-center">
          {config.categoryPath ? (
            <Link
              to={config.categoryPath}
              className="text-gray-500 hover:text-gray-900 px-1.5 py-0.5 rounded transition-colors font-medium text-[11px] sm:text-xs"
            >
              {config.category}
            </Link>
          ) : (
            <span className="text-gray-500 px-1.5 py-0.5 font-medium text-[11px] sm:text-xs">
              {config.category}
            </span>
          )}
        </li>

        {/* Separator 2 */}
        <li aria-hidden="true" className="text-gray-300 flex items-center">
          <ChevronRight className="h-3 w-3" />
        </li>

        {/* Step 3: Current Active Page */}
        <li
          aria-current="page"
          className="flex items-center gap-1.5 font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-[11px] sm:text-xs"
        >
          <CurrentIcon className="h-3.5 w-3.5 text-[#111111] shrink-0" />
          <span className="truncate max-w-[140px] sm:max-w-[220px]">{config.title}</span>
        </li>

        {/* Optional Contextual Query Badge (e.g., specific Section loaded) */}
        {contextualBadge && (
          <li className="hidden sm:flex items-center">
            <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              <Tag className="h-2.5 w-2.5 text-gray-500" />
              <span>{contextualBadge}</span>
            </span>
          </li>
        )}
      </ol>

      {/* Right Utility: Copy link or quick status */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <button
          onClick={handleCopyLink}
          title="Copy current workspace link"
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-600 hidden md:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-gray-400" />
              <span className="hidden md:inline">Copy Link</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
