"use client";

import { cn } from "@/lib/format/digits";

export function Avatar({
  name,
  hue = 160,
  size = "md",
  ring = false,
  badge,
}: {
  name: string;
  hue?: number;
  size?: "xs" | "sm" | "md" | "lg";
  ring?: boolean;
  badge?: "crown" | "check";
}) {
  const sizes = {
    xs: "h-7 w-7 text-2xs",
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };
  const initials = (name || "گ").trim().slice(0, 2);

  return (
    <div className="relative inline-flex shrink-0">
      <div
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 65% 48%), hsl(${
            (hue + 40) % 360
          } 70% 30%))`,
        }}
        className={cn(
          "flex items-center justify-center rounded-full font-bold text-white shadow-inner select-none",
          sizes[size],
          ring && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        {initials}
      </div>
      {badge === "crown" && (
        <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-micro shadow">
          ★
        </span>
      )}
      {badge === "check" && (
        <span className="absolute -bottom-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-micro font-bold text-on-primary shadow">
          ✓
        </span>
      )}
    </div>
  );
}
