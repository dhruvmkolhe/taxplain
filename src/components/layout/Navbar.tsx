import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Menu, X, ArrowRight, ShieldCheck, Layers } from "lucide-react";
import { SecurityShieldModal } from "@/src/components/shared/SecurityShieldModal";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "For CAs & SMEs", href: "#for-cas" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#111111] font-bold text-white text-xs">
              TP
            </div>
            <span className="text-lg font-bold tracking-tight text-[#111111]">
              TaxPlain
            </span>
            <span className="hidden sm:inline-block ml-1 rounded-[3px] border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600 font-medium">
              India GST
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600" aria-label="Main Navigation">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-900 rounded px-1 py-0.5"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSecurityModalOpen(true)}
              aria-label="View System Architecture & Security"
              className="hidden lg:flex text-xs text-gray-700 hover:text-black border border-gray-200 bg-white hover:bg-gray-50 h-8 rounded-[4px] cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              Architecture
            </Button>

            <Button
              onClick={() => navigate("/app/dashboard")}
              className="bg-[#111111] hover:bg-[#262626] text-white font-medium text-xs h-8 px-3.5 rounded-[4px] cursor-pointer"
            >
              Dashboard
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>

            {/* Mobile Hamburger Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-600 hover:text-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Slide-down/Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-6 space-y-4">
            <nav className="flex flex-col space-y-3 pt-2">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-gray-700 hover:text-black py-2 border-b border-gray-100"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSecurityModalOpen(true);
                  }}
                  className="w-full justify-center text-xs border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981] hover:text-white h-10 cursor-pointer"
                >
                  <Layers className="h-4 w-4 mr-2 text-[#10b981]" />
                  System Architecture
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/app/dashboard");
                  }}
                  className="w-full bg-[#3b82f6] hover:bg-blue-600 h-11"
                >
                  Open Workspace Dashboard →
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Production Security & API Key Vault Modal */}
      <SecurityShieldModal
        open={securityModalOpen}
        onOpenChange={setSecurityModalOpen}
      />
    </>
  );
}
