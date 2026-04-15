import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xxs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-accent text-accent-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        // Post type badges
        post: "border-transparent bg-[#F1F5F9] text-[#475569]",
        rental: "border-transparent bg-[#DCFCE7] text-[#166534]",
        event: "border-transparent bg-[#EDE9FE] text-[#5B21B6]",
        lost_found: "border-transparent bg-[#FEF3C7] text-[#92400E]",
        pet: "border-transparent bg-[#FAECE7] text-[#993C1D]",
        helper: "border-transparent bg-[#E0F2FE] text-[#0369A1]",
        classified: "border-transparent bg-[#F1F5F9] text-[#475569]",
        kitchen: "border-transparent bg-[#FDF4FF] text-[#7E22CE]",
        job: "border-transparent bg-[#ECFDF5] text-[#065F46]",
        venue: "border-transparent bg-[#DCFCE7] text-[#166534]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
