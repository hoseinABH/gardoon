"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "./IconButton";
import { ArrowRight, GardoonLogo } from "./Icons";
import { Typography } from "./Typography";

export function TopBar({
  title,
  subtitle,
  backTo,
  right,
  showLogo = false,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  right?: ReactNode;
  showLogo?: boolean;
}) {
  const router = useRouter();

  const onBack = () => {
    if (backTo) router.push(backTo);
    else router.back();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-background/85 px-4 py-3 backdrop-blur-lg border-b border-white/5">
      <div className="flex items-center gap-2.5 min-w-0">
        {backTo !== undefined ? (
          <IconButton
            variant="tonal"
            size="sm"
            onClick={onBack}
            aria-label="بازگشت"
            className="h-9 w-9"
          >
            <ArrowRight className="h-4 w-4" />
          </IconButton>
        ) : showLogo ? (
          <GardoonLogo size={34} />
        ) : null}
        <div className="min-w-0">
          <Typography variant="title-sm" className="truncate block text-body">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="label-sm" tone="muted" className="truncate block">
              {subtitle}
            </Typography>
          )}
        </div>
      </div>
      {right && <div className="flex items-center gap-1.5 shrink-0">{right}</div>}
    </header>
  );
}
