import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  CheckSquare,
  FileCheck,
  Calculator,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Calendar,
  Building2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  FileDown,
  Copy,
  Check,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/shared/EmptyState";
import {
  getRecentActivities,
  getRecentDocuments,
  ActivityItem,
  formatRelativeTime,
  clearRecentActivities,
} from "@/src/lib/recentActivity";
import { generateClientSummaryPDF } from "@/src/lib/pdfReport";
import { useTheme } from "@/src/context/ThemeContext";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

// Recharts Trend Data (Clauses Explained & Compliance Checks over the last 6 months)
const USAGE_TREND_DATA = [
  { month: "Apr", clauses: 8, checklists: 12, invoices: 14 },
  { month: "May", clauses: 11, checklists: 15, invoices: 20 },
  { month: "Jun", clauses: 14, checklists: 18, invoices: 25 },
  { month: "Jul", clauses: 16, checklists: 22, invoices: 30 },
  { month: "Aug", clauses: 21, checklists: 28, invoices: 34 },
  { month: "Sep", clauses: 24, checklists: 31, invoices: 38 },
];

// Compliance Risk & Audit Head Distribution
const COMPLIANCE_DISTRIBUTION_DATA = [
  { head: "CGST", compliant: 96, risk: 4 },
  { head: "SGST", compliant: 96, risk: 4 },
  { head: "IGST", compliant: 92, risk: 8 },
  { head: "Sec 17(5)", compliant: 88, risk: 12 },
  { head: "Rule 46", compliant: 98, risk: 2 },
  { head: "Rule 86B", compliant: 100, risk: 0 },
];

const UPCOMING_DEADLINES = [
  {
    date: "11th Sep",
    title: "GSTR-1 Outward Supplies",
    description: "Monthly return for taxpayers with turnover > ₹5 Crore",
    type: "GST Return",
    urgency: "urgent",
  },
  {
    date: "20th Sep",
    title: "GSTR-3B Monthly Return",
    description: "Summary return and tax settlement for August 2025",
    type: "Tax Settlement",
    urgency: "urgent",
  },
  {
    date: "31st Oct",
    title: "Tax Audit Report (Sec 44AB)",
    description: "Filing of audit report for businesses liable to audit under Income Tax",
    type: "Income Tax",
    urgency: "upcoming",
  },
  {
    date: "30th Nov",
    title: "Section 16(4) ITC Cutoff",
    description: "Final deadline to claim pending FY 2024-25 ITC in GSTR-3B",
    type: "Statutory Cutoff",
    urgency: "critical",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [recentDocs, setRecentDocs] = useState<ActivityItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isDark = theme === "dark";
  const chartGridStroke = isDark ? "#2a2a2a" : "#e5e7eb";
  const chartAxisStroke = isDark ? "#9ca3af" : "#6b7280";
  const chartPrimaryColor = isDark ? "#f2f2f2" : "#111111";
  const chartTooltipStyle = {
    backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
    borderColor: isDark ? "#2a2a2a" : "#e5e7eb",
    borderRadius: "4px",
    color: isDark ? "#f2f2f2" : "#111111",
    fontSize: "12px",
    boxShadow: "none",
  };

  useEffect(() => {
    const refreshData = () => {
      setActivities(getRecentActivities());
      setRecentDocs(getRecentDocuments(5));
    };
    refreshData();
    window.addEventListener("taxplain_activity_updated", refreshData);
    return () => window.removeEventListener("taxplain_activity_updated", refreshData);
  }, []);

  const totalClauses = USAGE_TREND_DATA.reduce((acc, curr) => acc + curr.clauses, 0);
  const totalChecklists = USAGE_TREND_DATA.reduce((acc, curr) => acc + curr.checklists, 0);
  const totalInvoices = USAGE_TREND_DATA.reduce((acc, curr) => acc + curr.invoices, 0);

  const handleExportPDF = async () => {
    setIsExporting(true);
    toast.loading("Generating Client Compliance Summary PDF...", { id: "export-client-pdf" });
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const filename = generateClientSummaryPDF({
        firmName: "Apex Tax Advisory & Compliance",
        clientName: "Client Statutory Summary",
        jurisdiction: "Vadodara, Gujarat (State Code: 24)",
        assessmentYear: "AY 2025–26 (FY 2024–25)",
        recentDocs: recentDocs,
        kpis: {
          complianceScore: 94.8,
          clausesAnalyzed: totalClauses,
          invoicesAudited: totalInvoices,
          returnsFiled: totalChecklists,
        },
      });
      toast.success(`Client report exported: ${filename}`, { id: "export-client-pdf" });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF report. Please try again.", { id: "export-client-pdf" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Dashboard • TaxPlain Compliance Suite</title>
        <meta
          name="description"
          content="Track your GST clauses explained, compliance scores, and return audit trends with TaxPlain."
        />
        <link rel="canonical" href="https://taxplain.in/app/dashboard" />
        <meta property="og:title" content="Dashboard • TaxPlain Compliance Suite" />
        <meta property="og:description" content="Track your GST clauses explained, compliance scores, and return audit trends with TaxPlain." />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/app/dashboard" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="Dashboard • TaxPlain Compliance Suite" />
        <meta name="twitter:description" content="Track your GST clauses explained, compliance scores, and return audit trends with TaxPlain." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
      </Helmet>


      {/* Profile & Assessment Year Header */}
      <div className="bg-white border border-gray-200 rounded p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded bg-[#111111] text-white flex items-center justify-center font-bold text-lg shrink-0">
              TP
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
                  Apex Tax Advisory & Compliance
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  CA Active
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  AY 2025–26
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-gray-500" />
                  <span>Vadodara, Gujarat (State Code: 24)</span>
                </div>
                <div className="font-mono text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="text-gray-300 hidden lg:inline select-none">•</span>
                  <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>Secured Server Statutory Vault</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export Summary Reports as PDF for Client Sharing */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              id="export-pdf-header-btn"
              className="text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-black cursor-pointer h-9 px-3 flex items-center gap-1.5"
              title="Export summary report as a PDF document for client sharing"
            >
              <FileDown className="h-3.5 w-3.5 text-gray-700" />
              <span>{isExporting ? "Generating PDF..." : "Export Client PDF"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => navigate("/app/gst-explainer")}
              className="bg-[#111111] hover:bg-black text-white text-xs px-3.5 h-9 font-medium cursor-pointer"
            >
              Explain Clause →
            </Button>
          </div>
        </div>
      </div>

      {/* Core Statistic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Clauses Explained */}
        <Card className="bg-white border-gray-200 rounded transition-all duration-150">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                Clauses Explained
              </span>
              <div className="p-1.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#111111] pt-1">
              {totalClauses} <span className="text-xs font-normal text-emerald-600 font-mono ml-1">↑ +24%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Sec 16(4), 17(5) & CBIC circulars simplified this month
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Compliance Health Score */}
        <Card className="bg-white border-gray-200 rounded transition-all duration-150">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                Compliance Health
              </span>
              <div className="p-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#111111] pt-1">
              94.8% <span className="text-xs font-semibold text-emerald-600 font-mono ml-1">Low Risk</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Rule 36(4) matching & invoice disclosures passed
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Invoices Audited */}
        <Card className="bg-white border-gray-200 rounded transition-all duration-150">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                Invoices Audited
              </span>
              <div className="p-1.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                <FileCheck className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#111111] pt-1">
              {totalInvoices} <span className="text-xs font-normal text-gray-500 font-mono ml-1">Rule 46</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              16 mandatory B2B particulars verified for buyers
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Checklists Active */}
        <Card className="bg-white border-gray-200 rounded transition-all duration-150">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                Audit Checklists
              </span>
              <div className="p-1.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                <CheckSquare className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#111111] pt-1">
              {totalChecklists} <span className="text-xs font-normal text-gray-500 font-mono ml-1">Generated</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              GSTR-1, 3B & 9 audit pre-filing guides active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart (7 Cols) */}
        <Card className="lg:col-span-7 bg-white border-gray-200 rounded">
          <CardHeader className="border-b border-gray-200 bg-[#fafafa] py-3.5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold text-[#111111] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-700" />
                  Usage & Simplification Trends
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Monthly volume of clauses explained vs compliance checklists generated
                </CardDescription>
              </div>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded text-gray-500 border border-gray-200">
                Apr - Sep 2025
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={USAGE_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clausesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#111111" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="checklistGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                  <XAxis dataKey="month" stroke={chartAxisStroke} fontSize={12} tickLine={false} />
                  <YAxis stroke={chartAxisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="clauses"
                    name="Clauses Explained"
                    stroke={chartPrimaryColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#clausesGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="checklists"
                    name="Compliance Checklists"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#checklistGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Risk Distribution Bar Chart (5 Cols) */}
        <Card className="lg:col-span-5 bg-white border-gray-200 rounded">
          <CardHeader className="border-b border-gray-200 bg-[#fafafa] py-3.5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold text-[#111111] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Statutory Health Score
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Compliance rate vs audit risk by tax head (%)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={COMPLIANCE_DISTRIBUTION_DATA}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                  <XAxis dataKey="head" stroke={chartAxisStroke} fontSize={11} tickLine={false} />
                  <YAxis stroke={chartAxisStroke} fontSize={11} domain={[70, 100]} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="compliant"
                    name="Compliant (%)"
                    fill={chartPrimaryColor}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="risk"
                    name="Audit Risk / Review (%)"
                    fill="#d97706"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Launch & Upcoming Deadlines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Launch Tools (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono">
              Tax Tools & Engines
            </h2>
            <button
              onClick={() =>
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
                )
              }
              className="text-xs text-[#111111] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              Search all sections <span>(⌘K)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/app/gst-explainer"
              className="p-4 rounded bg-white border border-gray-200 hover:border-gray-300 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  <FileText className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-[#111111] mt-3 group-hover:text-black transition-colors">
                GST Clause Explainer
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Translate Section 16(4), 17(5) and CBIC circulars into plain English briefs.
              </p>
            </Link>

            <Link
              to="/app/compliance-checklist"
              className="p-4 rounded bg-white border border-gray-200 hover:border-gray-300 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-[#111111] mt-3 group-hover:text-black transition-colors">
                Compliance Checklist
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Generate state-specific GSTR-1, 3B, and 9 verification workflows with deadlines.
              </p>
            </Link>

            <Link
              to="/app/invoice-checker"
              className="p-4 rounded bg-white border border-gray-200 hover:border-gray-300 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  <FileCheck className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-[#111111] mt-3 group-hover:text-black transition-colors">
                Invoice Validator (Rule 46)
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Audit B2B tax invoices against the 16 mandatory statutory disclosure fields.
              </p>
            </Link>

            <Link
              to="/app/itr-helper"
              className="p-4 rounded bg-white border border-gray-200 hover:border-gray-300 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  <Calculator className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-[#111111] mt-3 group-hover:text-black transition-colors">
                ITR Section Simplifier
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                AY 2025–26 Section 115BAC slabs, 80C, 80D, and presumptive 44AD schemes.
              </p>
            </Link>
          </div>
        </div>

        {/* Upcoming Statutory Deadlines (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-700" />
              Statutory Deadlines
            </h2>
            <span className="text-[10px] font-mono text-gray-400">CBIC & CBDT</span>
          </div>

          <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100 overflow-hidden">
            {UPCOMING_DEADLINES.map((item, idx) => (
              <div key={idx} className="p-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="px-2 py-1 rounded bg-gray-100 border border-gray-200 text-center shrink-0">
                      <span className="text-[11px] font-bold font-mono text-[#111111]">
                        {item.date}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#111111]">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      item.urgency === "urgent"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : item.urgency === "critical"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Documents Section (Last 5 tax clauses or invoices analyzed) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-700" />
              Recent Documents
              <span className="text-[10px] font-mono font-medium lowercase tracking-normal text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                last 5 analyzed
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Latest statutory tax clauses and invoices audited for client advisory
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/app/gst-explainer")}
              className="text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700 h-8 px-2.5 cursor-pointer"
            >
              + Analyze Clause
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/app/invoice-checker")}
              className="text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700 h-8 px-2.5 cursor-pointer"
            >
              + Audit Invoice
            </Button>
          </div>
        </div>

        {recentDocs.length === 0 ? (
          <EmptyState
            type="recent_docs"
            onAction={() => navigate("/app/gst-explainer")}
            onSecondaryAction={() => navigate("/app/invoice-checker")}
            samplePills={[
              {
                label: "Section 16(4) ITC Cutoff",
                onClick: () => navigate("/app/gst-explainer?sample=16_4"),
              },
              {
                label: "Section 17(5) Blocked Credit",
                onClick: () => navigate("/app/gst-explainer?sample=17_5"),
              },
              {
                label: "Audit B2B Rule 46 Invoice",
                onClick: () => navigate("/app/invoice-checker?preset=valid"),
              },
            ]}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100 overflow-hidden">
            {recentDocs.slice(0, 5).map((doc, idx) => {
              const isInvoice = doc.type === "invoice_checker";
              const sectionBadge =
                doc.data?.section || (isInvoice ? "Rule 46" : "Sec 16(4)");
              const statusText =
                doc.data?.status || (isInvoice ? "Compliant" : "Verified");
              const isWarning =
                statusText.toLowerCase().includes("risk") ||
                statusText.toLowerCase().includes("ineligible") ||
                statusText.toLowerCase().includes("cutoff");

              return (
                <div
                  key={doc.id || idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded shrink-0 mt-0.5 border bg-gray-100 text-gray-700 border-gray-200">
                      {isInvoice ? (
                        <FileCheck className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase bg-gray-100 text-gray-700 border border-gray-200">
                          {isInvoice ? "GST Invoice" : "Tax Clause"}
                        </span>
                        <span className="text-[10px] font-mono text-gray-600 bg-gray-50 px-1.5 py-0.2 rounded border border-gray-200">
                          {sectionBadge}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatRelativeTime(doc.timestamp)}
                        </span>
                      </div>

                      <h4
                        onClick={() => navigate(doc.path)}
                        className="text-sm font-semibold text-[#111111] mt-1 group-hover:text-black transition-colors cursor-pointer truncate"
                      >
                        {doc.title}
                      </h4>

                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {doc.snippet}
                      </p>
                    </div>
                  </div>

                  {/* Status & Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-11 sm:pl-0">
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                        isWarning
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {statusText}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(`${doc.title} - ${doc.snippet}`);
                        setCopiedId(doc.id);
                        toast.success("Document summary copied to clipboard");
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      title="Copy document summary"
                      className="p-1.5 rounded text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                    >
                      {copiedId === doc.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <Button
                      size="sm"
                      onClick={() => navigate(doc.path)}
                      className="text-xs bg-white hover:bg-gray-50 text-gray-700 hover:text-black h-8 px-2.5 border border-gray-200 transition-all cursor-pointer"
                    >
                      Open <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-700" />
            Your Recent Activity
          </h2>
          {activities.length > 0 && (
            <button
              onClick={() => clearRecentActivities()}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              Clear history
            </button>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center bg-white border border-gray-200 rounded">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-700 font-medium">No recent activity yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Any GST clause or compliance checklist you generate will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100 overflow-hidden">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                onClick={() => navigate(act.path)}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0 pr-4">
                  <div className="p-2 rounded bg-gray-100 text-gray-700 border border-gray-200 shrink-0 mt-0.5">
                    {act.type === "clause_explainer" ? (
                      <FileText className="h-4 w-4" />
                    ) : act.type === "compliance_checklist" ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : act.type === "invoice_checker" ? (
                      <FileCheck className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#111111] truncate group-hover:text-black transition-colors">
                        {act.title}
                      </h4>
                      <span className="text-[10px] text-gray-400">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{act.snippet}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-700 group-hover:bg-gray-100 h-8 px-2.5"
                  >
                    Open <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
