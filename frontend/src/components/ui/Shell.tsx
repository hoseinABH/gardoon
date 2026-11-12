"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/format/digits";

export function Shell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-dvh w-full bg-canvas text-foreground flex justify-center overscroll-none select-none">
      <div
        className={cn(
          "relative flex w-full max-w-shell min-h-dvh flex-col bg-background shadow-shell md:border-x md:border-white/6 overflow-x-clip",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
