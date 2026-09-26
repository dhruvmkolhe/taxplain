import { useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function MobileCTABar() {
  const navigate = useNavigate();

  return (
    <aside
      aria-label="Quick Action"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Button
        onClick={() => navigate("/app/gst-explainer")}
        className="w-full bg-[#111111] hover:bg-black text-white font-medium h-11 text-sm rounded shadow-none flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="h-4 w-4" />
        Explain a GST Clause →
      </Button>
    </aside>
  );
}
