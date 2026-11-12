"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/format/digits";
import { Check, Copy } from "./Icons";
import { RippleLayer, useRipple } from "./Ripple";
import { Typography } from "./Typography";

export function CopyButton({
  value,
  label = "کپی",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const ripple = useRipple(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("در حافظه کپی شد");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("کپی انجام نشد");
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      onPointerDown={ripple.onPointerDown}
      onKeyDown={ripple.onKeyDown}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap overflow-hidden rounded-full bg-white/8 px-3 py-1 text-foreground hover:bg-white/14 active:scale-95 transition cursor-pointer",
        className
      )}
    >
      <RippleLayer ripples={ripple.ripples} />
      <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap">
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5 opacity-80" />
        )}
        <Typography variant="label-sm" tone="inherit">
          {copied ? "کپی شد" : label}
        </Typography>
      </span>
    </button>
  );
}
