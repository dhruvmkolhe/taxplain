import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/app/Dashboard";
import GstExplainer from "./pages/app/GstExplainer";
import ComplianceChecklist from "./pages/app/ComplianceChecklist";
import InvoiceChecker from "./pages/app/InvoiceChecker";
import ItrHelper from "./pages/app/ItrHelper";
import TaxChat from "./pages/app/TaxChat";
import { AppShell } from "./components/layout/AppShell";
import { ThemeProvider } from "./context/ThemeContext";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ScrollToTop />
      <Routes>
        {/* Public Marketing & Legal Pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/thank-you" element={<ThankYou />} />

        {/* Application Workspace Routes (Wrapped with AppShell) */}
        <Route
          path="/app"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />
        <Route
          path="/app/dashboard"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />
        <Route
          path="/app/gst-explainer"
          element={
            <AppShell>
              <GstExplainer />
            </AppShell>
          }
        />
        <Route
          path="/app/compliance-checklist"
          element={
            <AppShell>
              <ComplianceChecklist />
            </AppShell>
          }
        />
        <Route
          path="/app/invoice-checker"
          element={
            <AppShell>
              <InvoiceChecker />
            </AppShell>
          }
        />
        <Route
          path="/app/itr-helper"
          element={
            <AppShell>
              <ItrHelper />
            </AppShell>
          }
        />
        <Route
          path="/app/chat"
          element={
            <AppShell chatMode>
              <TaxChat />
            </AppShell>
          }
        />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}
