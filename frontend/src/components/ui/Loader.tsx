"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format/digits";

export function Loader({
  size = "md",
  className,
  label,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  const sizes = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };
  return (
    <span
      role="status"
      aria-label={label ?? "در حال بارگذاری"}
      className="inline-flex items-center justify-center"
    >
      <Loader2
        aria-hidden
        className={cn("animate-spin text-current", sizes[size], className)}
      />
    </span>
  );
}
