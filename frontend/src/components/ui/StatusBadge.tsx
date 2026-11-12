"use client";

import { cn } from "@/lib/format/digits";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  RECRUITING: {
    label: "در حال عضوگیری",
    cls: "bg-sun/15 text-sun border-sun/30",
  },
  ACTIVE: {
    label: "فعال",
    cls: "bg-primary/15 text-primary border-primary/35",
  },
  COMPLETED: {
    label: "تکمیل‌شده",
    cls: "bg-success/15 text-success border-success/35",
  },
  PAUSED: {
    label: "متوقف",
    cls: "bg-white/10 text-muted-foreground border-white/15",
  },
  PENDING_DRAW: {
    label: "آماده قرعه‌کشی",
    cls: "bg-royal/20 text-purple-200 border-royal/40",
  },
  COLLECTING: {
    label: "در حال جمع‌آوری",
    cls: "bg-gold/15 text-gold border-gold/35",
  },
  SETTLED: {
    label: "تسویه‌شده",
    cls: "bg-success/15 text-success border-success/35",
  },
  PENDING: {
    label: "در انتظار واریز",
    cls: "bg-white/10 text-muted-foreground border-white/15",
  },
  RECEIPT_SUBMITTED: {
    label: "در انتظار تایید",
    cls: "bg-gold/15 text-gold border-gold/35",
  },
  CONFIRMED: {
    label: "تایید شده",
    cls: "bg-primary/15 text-primary border-primary/35",
  },
  REJECTED: {
    label: "رد شده",
    cls: "bg-destructive/15 text-destructive border-destructive/35",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? {
    label: status,
    cls: "bg-white/10 text-foreground border-white/15",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-semibold",
        cfg.cls
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}
