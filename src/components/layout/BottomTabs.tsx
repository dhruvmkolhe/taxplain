import { NavLink } from "react-router-dom";
import { appNavItems } from "./Sidebar";
import { cn } from "@/src/lib/utils";

export function BottomTabs() {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-2 py-1.5 flex items-center justify-around"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {appNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded transition-colors min-h-[44px] min-w-[44px]",
                isActive
                  ? "text-[#111111] font-semibold"
                  : "text-gray-500 hover:text-gray-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "p-1 rounded transition-colors",
                    isActive ? "bg-gray-100" : "bg-transparent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                  {item.shortLabel}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
