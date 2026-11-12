"use client";

import Image from "next/image";
import { CopyButton } from "./CopyButton";
import { Typography } from "./Typography";
import { detectBank, groupCard, groupSheba } from "@/lib/validation/banking";

export function BankCard({
  holder,
  card,
  iban,
  bank,
}: {
  holder: string;
  card?: string | null;
  iban?: string | null;
  bank?: string | null;
}) {
  const detected = detectBank(card, iban, bank);
  const displayBank = bank || detected.name;

  return (
    <div className="relative rounded-card bg-linear-to-br from-primary/50 via-white/25 to-emerald-400/20 p-0.5 shadow-bank-card">
      <div
        className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${detected.color} p-4 ring-1 ring-inset ring-white/15`}
      >
        <div className="pointer-events-none absolute -top-12 -start-12 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -end-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/45 to-transparent" />

        <div className="relative flex items-center justify-between gap-2 text-white/90">
          <div className="flex min-w-0 items-center gap-2.5">
            {detected.logo ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/15">
                <Image
                  src={detected.logo}
                  alt={displayBank}
                  width={48}
                  height={48}
                  sizes="48px"
                  className="h-8 w-8 object-contain"
                />
              </span>
            ) : (
              <span
                aria-hidden
                className="flex h-6 w-8 shrink-0 items-center justify-center rounded-md border border-amber-200/40 bg-linear-to-br from-amber-200/35 to-amber-500/10 shadow-inner"
              >
                <span className="h-3 w-4 rounded-xs border border-amber-100/35" />
              </span>
            )}
            <Typography variant="label-md" tone="inherit" className="truncate font-bold">
              {displayBank}
            </Typography>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full border border-white/15 bg-black/20 px-2.5 py-0.5 backdrop-blur-sm">
            <Typography variant="label-sm" tone="inherit" className="text-micro">
              کارت به کارت مستقیم
            </Typography>
          </span>
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-2">
          <Typography
            dir="ltr"
            numeric
            variant="title-md"
            className="whitespace-nowrap font-mono text-body font-bold tracking-wide text-white"
          >
            {card ? groupCard(card, true) : "شماره کارت ثبت نشده"}
          </Typography>
          {card && (
            <CopyButton
              value={card}
              label="کپی کارت"
              className="border border-white/15 bg-black/30 px-2.5 py-1 text-white hover:bg-black/45"
            />
          )}
        </div>

        {iban && (
          <div className="relative mt-2.5 flex items-center justify-between gap-1.5 rounded-2xl border border-white/10 bg-black/25 px-2.5 py-1.5 text-white/90">
            <Typography
              dir="ltr"
              numeric
              variant="label-sm"
              tone="inherit"
              className="whitespace-nowrap font-mono text-micro tracking-normal text-white/95"
            >
              {groupSheba(iban, true)}
            </Typography>
            <CopyButton
              value={iban}
              label="شبا"
              className="bg-white/12 px-2 py-0.5 text-micro"
            />
          </div>
        )}

        <div className="relative mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2.5 text-white/75">
          <Typography variant="body-sm" tone="inherit">
            به‌نام:
          </Typography>
          <Typography variant="label-md" className="text-white">
            {holder}
          </Typography>
        </div>
      </div>
    </div>
  );
}
