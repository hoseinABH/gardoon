"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Icons, Sheet, Typography } from "@/components/ui";
import { usePwaStore } from "../store";

const UPDATE_HIGHLIGHTS = [
  {
    icon: Icons.RefreshCw,
    iconTone: "bg-sun/15 text-sun",
    title: "همگام‌سازی و دریافت اطلاعات تازه",
    description: "به‌روزرسانی وضعیت صندوق‌ها، اقساط و نتایج قرعه‌کشی",
  },
  {
    icon: Icons.Layers,
    iconTone: "bg-primary/12 text-primary",
    title: "پاک‌سازی داده‌های قدیمی و منقضی",
    description: "تخلیه کش قدیمی صفحات و جایگزینی با نگارش جدید",
  },
  {
    icon: Icons.ShieldCheck,
    iconTone: "bg-success/15 text-success",
    title: "بهبود پایداری و سرعت برنامه",
    description: "اعمال آخرین اصلاحات فنی و امنیتی وب‌اپلیکیشن",
  },
] as const;

export function UpdateAppSheet({
  onReload,
}: {
  onReload?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const {
    updateSheetOpen,
    waitingWorker,
    isUpdating,
    setIsUpdating,
    closeUpdateSheet,
  } = usePwaStore();

  const reloadApp = () => {
    if (onReload) {
      onReload();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();

      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const keys = await window.caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("gardoon-pages"))
              .map((key) => window.caches.delete(key))
          );
        } catch {
          // Ignore CacheStorage access errors in restricted modes
        }
      }

      if (waitingWorker) {
        await new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (!settled) {
              settled = true;
              resolve();
            }
          };

          if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              finish,
              { once: true }
            );
          }

          waitingWorker.postMessage({ type: "SKIP_WAITING" });
          setTimeout(finish, 1200);
        });
      }

      closeUpdateSheet();
      reloadApp();
    } catch {
      setIsUpdating(false);
      toast.error("خطا در به‌روزرسانی؛ صفحه مجدداً بارگذاری می‌شود");
      reloadApp();
    }
  };

  return (
    <Sheet
      open={updateSheetOpen}
      onClose={() => {
        if (!isUpdating) closeUpdateSheet();
      }}
      title="نسخه جدید گردون آماده است"
    >
      <div className="space-y-4">
        <div className="space-y-2.5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sun/15 text-sun ring-4 ring-sun/10">
            <Icons.Sparkles className="h-7 w-7" />
          </div>
          <Typography variant="body-md" tone="muted" className="leading-7">
            نسخه تازه برنامه در دسترس است. برای جایگزینی داده‌های قدیمی با
            اطلاعات جدید، به‌روزرسانی را تایید کنید.
          </Typography>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-white/8 bg-white/3 p-3.5">
          {UPDATE_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3 text-start">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.iconTone}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <Typography variant="label-md" className="block">
                    {item.title}
                  </Typography>
                  <Typography variant="body-sm" tone="muted" className="block">
                    {item.description}
                  </Typography>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2 pt-1">
          <Button
            variant="sun"
            size="lg"
            block
            loading={isUpdating}
            loadingLabel="در حال دریافت داده‌های تازه..."
            leading={<Icons.RefreshCw className="h-4 w-4" />}
            onClick={handleUpdate}
          >
            به‌روزرسانی و دریافت اطلاعات تازه
          </Button>
          <Button
            variant="ghost"
            size="sm"
            block
            disabled={isUpdating}
            onClick={closeUpdateSheet}
          >
            بعداً یادآوری کن
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
