"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { Icons, Loader, Typography } from "@/components/ui";

export function ReceiptImagePreview({
  url,
  alt = "رسید واریز",
}: {
  url?: string | null;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let active = true;

    if (!url) {
      setSrc(null);
      return;
    }

    if (url.startsWith("data:") || url.startsWith("blob:")) {
      setSrc(url);
      return;
    }

    setFailed(false);
    api.obligations
      .fetchReceiptBlobUrl(url)
      .then((objectUrl) => {
        if (!active) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        revokedUrl = objectUrl;
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [url]);

  if (!url) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-black/25">
        <Icons.ImageOff className="h-5 w-5 text-muted-foreground opacity-70" />
        <Typography variant="body-sm" tone="muted">
          تصویر رسید در حالت آزمایشی پیوست نشده است
        </Typography>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10">
        <Icons.ImageOff className="h-5 w-5 text-destructive" />
        <Typography variant="body-sm" tone="danger">
          بارگذاری تصویر رسید ناموفق بود
        </Typography>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-white/6 text-primary">
        <Loader size="lg" label="در حال بارگذاری تصویر رسید" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={640}
      height={480}
      className="max-h-72 w-full rounded-2xl border border-white/10 object-contain bg-black/40"
    />
  );
}
