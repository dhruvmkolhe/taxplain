import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border border-gray-200 bg-gray-100 text-gray-900",
        secondary:
          "border border-gray-200 bg-gray-50 text-gray-700",
        destructive:
          "border border-red-200 bg-red-50 text-red-700",
        success:
          "border border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:
          "border border-amber-200 bg-amber-50 text-amber-800",
        outline: "border border-gray-200 text-gray-600 bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
