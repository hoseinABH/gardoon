"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { flushQueuedReceipts } from "@/lib/api/offlineQueue";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const syncPending = async () => {
      const count = await flushQueuedReceipts();
      if (count > 0) {
        toast.success(`${count} رسید در صف انتظار به سرور ارسال شد`);
      }
    };

    syncPending();
    window.addEventListener("online", syncPending);
    return () => window.removeEventListener("online", syncPending);
  }, []);

  return null;
}
