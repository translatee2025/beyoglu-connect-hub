import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-1.5 py-0.5 text-xxs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-accent text-accent-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        post: "bg-[#F1F5F9] text-[#475569] border-[#F1F5F9]",
        rental: "bg-[#EFF4FF] text-[#1E3A5F] border-[#C7D7F7]",
        event: "bg-[#EDE9FE] text-[#5B21B6] border-[#EDE9FE]",
        lost_found: "bg-[#FEF3C7] text-[#92400E] border-[#FEF3C7]",
        pet: "bg-[#FAECE7] text-[#993C1D] border-[#FAECE7]",
        helper: "bg-[#E0F2FE] text-[#0369A1] border-[#E0F2FE]",
        classified: "bg-[#F1F5F9] text-[#475569] border-[#F1F5F9]",
        kitchen: "bg-[#FDF4FF] text-[#7E22CE] border-[#FDF4FF]",
        job: "bg-[#ECFDF5] text-[#065F46] border-[#ECFDF5]",
        venue: "bg-[#EFF4FF] text-[#1E3A5F] border-[#C7D7F7]",
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
