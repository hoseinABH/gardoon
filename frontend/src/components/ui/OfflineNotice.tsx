"use client";

import { useState } from "react";
import { useOffline } from "next/offline";
import { Button } from "./Button";
import { AlertCircle } from "./Icons";
import { Sheet } from "./Sheet";
import { Typography } from "./Typography";

export function OfflineNotice() {
  const offline = useOffline();
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(offline);

  if (offline !== wasOffline) {
    setWasOffline(offline);
    if (!offline) {
      setDismissed(false);
    }
  }

  return (
    <Sheet
      open={offline && !dismissed}
      onClose={() => setDismissed(true)}
      title="اتصال اینترنت برقرار نیست"
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
          <AlertCircle className="h-7 w-7" />
        </div>
        <Typography variant="body-md" tone="muted" className="leading-7">
          در حال حاضر آفلاین هستید. اطلاعات ذخیره‌شده قابل مشاهده است و رسیدهای
          واریزی شما پس از اتصال مجدد به‌صورت خودکار ارسال خواهند شد.
        </Typography>
        <Button
          variant="filled"
          size="md"
          block
          onClick={() => setDismissed(true)}
        >
          متوجه شدم
        </Button>
      </div>
    </Sheet>
  );
}
