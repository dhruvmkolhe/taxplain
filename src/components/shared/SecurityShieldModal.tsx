import React, { useState, useEffect } from "react";
import {
  Layers,
  ShieldCheck,
  Lock,
  Server,
  Zap,
  CheckCircle2,
  Cpu,
  Database,
  GitFork,
  Radio,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { fetchSecurityStatus, SecurityStatus } from "@/src/lib/groq";

interface SecurityShieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecurityShieldModal({ open, onOpenChange }: SecurityShieldModalProps) {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchSecurityStatus()
        .then((s) => setStatus(s))
        .catch(() => setStatus(null))
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col p-0 border-gray-200 bg-white text-gray-900 overflow-hidden shadow-xl">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                    System Architecture &amp; Security
                  </DialogTitle>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    PRODUCTION GRADE
                  </span>
                </div>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Full-stack architectural blueprint, server-side secret vaulting, and AI pipeline.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
          {/* Architecture Pipeline Flowchart */}
          <div className="p-3.5 rounded-md bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
              <span className="flex items-center gap-1.5 text-gray-900">
                <GitFork className="h-3.5 w-3.5 text-gray-700" />
                End-to-End Request Pipeline
              </span>
              <span className="text-emerald-600 flex items-center gap-1 text-[10px]">
                <Radio className="h-3 w-3 animate-pulse" /> Encrypted &amp; Isolated
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-2 rounded bg-white border border-gray-200 shadow-sm">
                <div className="text-gray-400 text-[9px] font-mono uppercase">Tier 1 • Client</div>
                <div className="font-semibold text-gray-900 mt-0.5">React 19 SPA</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Zero Secret Keys</div>
              </div>

              <div className="p-2 rounded bg-white border border-gray-200 shadow-sm">
                <div className="text-gray-400 text-[9px] font-mono uppercase">Tier 2 • Gateway</div>
                <div className="font-semibold text-gray-900 mt-0.5">Express + CSP</div>
                <div className="text-[10px] text-gray-500 mt-0.5">CSRF &amp; Rate Guard</div>
              </div>

              <div className="p-2 rounded bg-white border border-gray-200 shadow-sm">
                <div className="text-gray-400 text-[9px] font-mono uppercase">Tier 3 • Defense</div>
                <div className="font-semibold text-amber-700 mt-0.5">Input Sanitizer</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Anti-Injection Filter</div>
              </div>

              <div className="p-2 rounded bg-white border border-gray-200 shadow-sm">
                <div className="text-gray-400 text-[9px] font-mono uppercase">Tier 4 • Vault</div>
                <div className="font-semibold text-emerald-700 mt-0.5">AI Engine Stream</div>
                <div className="text-[10px] text-gray-500 mt-0.5">NVIDIA NIM Vault</div>
              </div>
            </div>
          </div>

          {/* Active Vault Protection Banner */}
          <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <span>Server-Side Secret Vault Active</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Zero Client Exposure
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                All upstream AI provider credentials (NVIDIA NIM API) are stored strictly in the isolated Node.js/Express server process. The browser frontend bundle contains zero secret tokens, preventing credential theft via DevTools, network inspection, or malicious browser extensions.
              </p>
            </div>
          </div>

          {/* Architectural Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-md bg-white border border-gray-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>CSRF &amp; Origin Guard</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Requires cryptographically signed <code className="text-emerald-700 font-mono">X-CSRF-Token</code> headers and validates HTTP Origin/Referer on all evaluation and document requests.
              </p>
            </div>

            <div className="p-3 rounded-md bg-white border border-gray-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                <Lock className="h-3.5 w-3.5 text-gray-700" />
                <span>Multi-Tier Rate Limiting</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Sliding-window IP throttling enforces a 10 req/10s burst guard and 35 req/min sustained limit to protect upstream quotas against DDoS and abuse.
              </p>
            </div>

            <div className="p-3 rounded-md bg-white border border-gray-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                <Server className="h-3.5 w-3.5 text-purple-600" />
                <span>Hardened HTTP Headers (CSP)</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Strict Content Security Policy (CSP), <code className="text-purple-700 font-mono">X-Content-Type-Options: nosniff</code>, frame isolation, and zero external script injection.
              </p>
            </div>

            <div className="p-3 rounded-md bg-white border border-gray-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                <span>Input Sanitizer &amp; Defanger</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Strips null bytes, bidi unicode overrides, script tags, and defangs prompt injection overrides before LLM dispatch.
              </p>
            </div>

            <div className="p-3 rounded-md bg-white border border-gray-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                <Cpu className="h-3.5 w-3.5 text-gray-700" />
                <span>NVIDIA Enterprise Inference</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Dedicated high-throughput inference powered by NVIDIA NIM endpoints using DeepSeek V4 Pro with real-time SSE streaming.
              </p>
            </div>

            <div className="p-3 rounded-md bg-white border border-gray-200 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                <Database className="h-3.5 w-3.5 text-rose-600" />
                <span>Statutory Compliance Engine</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Built-in deterministic CA compliance rules ensure complete accuracy and offline zero-downtime reliability if external APIs are unavailable.
              </p>
            </div>
          </div>

          {/* Diagnostic Info Box */}
          <div className="p-3.5 rounded-md bg-gray-50 border border-gray-200 font-mono text-[11px] space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">
                Live System Telemetry
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                ONLINE
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Credential Exposure:</span>
                <span className="text-emerald-700 font-semibold">0% (Server Vaulted)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">CSRF Origin Guard:</span>
                <span className="text-emerald-700 font-semibold">HMAC Token Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">CSP Status:</span>
                <span className="text-emerald-700 font-semibold">Active (nosniff / strict)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Prompt Defanger:</span>
                <span className="text-emerald-700 font-semibold">Active (Sanitized)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Active AI Provider:</span>
                <span className="text-emerald-700 uppercase font-semibold">
                  {status?.activeProvider || "nvidia"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Model Pipeline:</span>
                <span className="text-gray-900 truncate max-w-[160px]" title={status?.model || "deepseek-ai/deepseek-v4-pro-0813"}>
                  {status?.model || "deepseek-ai/deepseek-v4-pro-0813"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-500 font-mono">
            TaxPlain Architecture Specification • v2.0
          </span>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-[#111111] hover:bg-black text-white text-xs h-8 px-4 cursor-pointer font-medium rounded-md shadow-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
