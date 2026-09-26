import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] px-4 py-2 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#111111] text-white hover:bg-black active:bg-gray-800 dark:bg-[#f2f2f2] dark:text-[#0f0f0f] dark:hover:bg-[#e5e7eb]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-gray-200 bg-white text-[#111111] hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#f2f2f2] dark:hover:bg-[#242424] dark:hover:border-[#404040]",
        secondary:
          "bg-gray-100 text-[#111111] hover:bg-gray-200 active:bg-gray-300 dark:bg-[#242424] dark:text-[#f2f2f2] dark:hover:bg-[#2a2a2a]",
        ghost:
          "text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 dark:text-[#9ca3af] dark:hover:text-[#f2f2f2] dark:hover:bg-[#242424]",
        link:
          "text-[#111111] dark:text-[#f2f2f2] underline-offset-4 hover:underline",
        success:
          "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded px-3 text-xs min-h-[32px]",
        lg: "h-11 rounded px-6 text-base font-medium min-h-[44px]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
