import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BottomTabs } from "./BottomTabs";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { OfflineBanner } from "../shared/OfflineBanner";
import { CookieBanner } from "../shared/CookieBanner";
import { GlobalSearchDialog } from "../shared/GlobalSearchDialog";
import { OnboardingWalkthrough } from "../shared/OnboardingWalkthrough";
import { Search, HelpCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface AppShellProps {
  children: ReactNode;
  chatMode?: boolean;
}

export function AppShell({ children, chatMode = false }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // Check if first time user on mount
  useEffect(() => {
    const tourCompleted = localStorage.getItem("taxplain_onboarding_completed");
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setTourOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className={cn(
      "bg-white text-[#111111] flex flex-col md:flex-row transition-colors duration-150",
      chatMode ? "h-screen h-[100dvh] overflow-hidden" : "min-h-screen"
    )}>
      <OfflineBanner />
      
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        chatMode ? "h-full overflow-hidden pb-0 md:pb-0" : "pb-20 md:pb-6"
      )}>
        {/* App Shell Top Header */}
        <header className="h-14 border-b border-gray-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 transition-colors">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-gray-500" />
              <span className="hidden sm:inline">Search statutory sections & rules...</span>
              <span className="sm:hidden">Search...</span>
              <kbd className="hidden sm:inline-block font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-400">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Take Tour Button in header */}
            <button
              onClick={() => setTourOpen(true)}
              title="Take Onboarding Tour"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5 text-gray-500" />
              <span className="hidden sm:inline text-[11px] font-medium">App Tour</span>
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Breadcrumbs Navigation */}
        <div className="shrink-0">
          <BreadcrumbNav />
        </div>

        {/* Workspace Body */}
        <main className={
          chatMode
            ? "flex-1 flex flex-col min-h-0 overflow-hidden h-full"
            : "flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6"
        }>
          {children}

          {/* Statutory AI & CA Advisory Disclaimer — hidden in chat mode (chat has inline disclaimer) */}
          {!chatMode && (
            <footer className="mt-10 pt-6 border-t border-gray-200">
              <div className="rounded border border-gray-200 bg-[#fafafa] p-3.5 text-xs text-gray-600 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-gray-900 block">
                    Statutory Notice • Educational Purpose Only
                  </span>
                  <p className="text-[11px] leading-relaxed text-gray-500">
                    TaxPlain is an AI-powered tax simplification platform developed strictly for knowledge and educational purposes. Analysis, interpretations, and checklists do not constitute formal tax, legal, or audit opinions. Indian tax laws and circulars are dynamic; please consult a qualified Chartered Accountant (CA) or certified tax practitioner for official advisory and return filing.
                  </p>
                </div>
              </div>
            </footer>
          )}
        </main>
      </div>


      {/* Global Command+K Search Dialog */}
      <GlobalSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />

      {/* Onboarding Walkthrough Guide Modal */}
      <OnboardingWalkthrough
        open={tourOpen}
        onOpenChange={setTourOpen}
      />

      {/* Mobile Fixed Bottom Navigation */}
      <BottomTabs />

      {/* Consent Cookie Banner */}
      <CookieBanner />
    </div>
  );
}

