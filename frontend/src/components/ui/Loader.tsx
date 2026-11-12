"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format/digits";

export interface LoaderProps {
  variant?: "circular" | "dots";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function Loader({
  variant = "dots",
  size = "md",
  className,
  label,
}: LoaderProps) {
  const circularSizes = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  const dotSizes = {
    xs: "h-1 w-1",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  const dotGaps = {
    xs: "gap-1",
    sm: "gap-1.5",
    md: "gap-2",
    lg: "gap-2.5",
  };

  if (variant === "dots") {
    return (
      <span
        role="status"
        aria-label={label ?? "در حال بارگذاری"}
        className={cn("inline-flex items-center justify-center", dotGaps[size], className)}
      >
        <span className={cn("rounded-full bg-current animate-dot-1", dotSizes[size])} />
        <span className={cn("rounded-full bg-current animate-dot-2", dotSizes[size])} />
        <span className={cn("rounded-full bg-current animate-dot-3", dotSizes[size])} />
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={label ?? "در حال بارگذاری"}
      className="inline-flex items-center justify-center"
    >
      <Loader2
        aria-hidden
        className={cn("animate-spin text-current", circularSizes[size], className)}
      />
    </span>
  );
}
