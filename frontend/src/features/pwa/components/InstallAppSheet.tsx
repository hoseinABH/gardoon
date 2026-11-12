"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  GardoonLogo,
  Icons,
  Sheet,
  Typography,
} from "@/components/ui";
import { usePwaStore } from "../store";

const INSTALL_FEATURES = [
  {
    icon: Icons.Smartphone,
    iconTone: "bg-primary/12 text-primary",
    title: "دسترسی مستقیم و تمام‌صفحه",
    description: "اجرا از صفحه اصلی گوشی بدون نوار آدرس مرورگر",
  },
  {
    icon: Icons.Sparkles,
    iconTone: "bg-sun/15 text-sun",
    title: "سرعت بالا و پشتیبانی آفلاین",
    description: "بارگذاری فوری اطلاعات و ثبت رسید در صف آفلاین",
  },
  {
    icon: Icons.ShieldCheck,
    iconTone: "bg-success/15 text-success",
    title: "همیشه به‌روز و بدون محدودیت",
    description: "بدون نیاز به فروشگاه‌های جانبی یا دانلود مجدد فایل نصبی",
  },
] as const;

export function InstallAppSheet() {
  const {
    installSheetOpen,
    platform,
    deferredPrompt,
    closeInstallSheet,
    triggerInstall,
  } = usePwaStore();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const outcome = await triggerInstall();
      if (outcome === "accepted") {
        toast.success("درخواست نصب گردون ثبت شد");
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Sheet
      open={installSheetOpen}
      onClose={() => closeInstallSheet(true)}
      title="نصب وب‌اپلیکیشن گردون"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-white/8 bg-white/4 p-3.5">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-elevated ring-1 ring-primary/25">
            <GardoonLogo size={36} />
          </div>
          <div className="min-w-0 space-y-0.5 text-start">
            <Typography variant="title-md" className="block truncate">
              گردون
            </Typography>
            <Typography variant="body-sm" tone="muted" className="block">
              صندوق قرض‌الحسنه هوشمند خانوادگی و دوستانه
            </Typography>
          </div>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-white/8 bg-white/3 p-3.5">
          {INSTALL_FEATURES.map((item) => {
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

        {deferredPrompt ? (
          <div className="space-y-2 pt-1">
            <Button
              variant="sun"
              size="lg"
              block
              loading={installing}
              loadingLabel="در حال آماده‌سازی نصب..."
              leading={<Icons.Download className="h-4 w-4" />}
              onClick={handleInstall}
            >
              نصب و افزودن به صفحه اصلی
            </Button>
            <Button
              variant="ghost"
              size="sm"
              block
              disabled={installing}
              onClick={() => closeInstallSheet(true)}
            >
              بعداً یادآوری کن
            </Button>
          </div>
        ) : platform === "ios" ? (
          <div className="space-y-3">
            <div className="space-y-2.5 rounded-2xl border border-sun/25 bg-sun/8 p-3.5 text-start">
              <Typography variant="label-md" tone="sun" className="block">
                راهنمای نصب در آیفون و آیپد (Safari):
              </Typography>
              <ol className="space-y-2 text-xs leading-6 text-foreground/90">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sun/20 text-micro font-bold text-sun">
                    ۱
                  </span>
                  <span>
                    دکمه اشتراک‌گذاری{" "}
                    <Icons.Share2 className="mx-0.5 inline h-3.5 w-3.5 text-primary" />{" "}
                    در نوار ابزار پایین سافاری را لمس کنید.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sun/20 text-micro font-bold text-sun">
                    ۲
                  </span>
                  <span>
                    گزینه{" "}
                    <strong className="font-bold text-foreground">
                      «افزودن به صفحه اصلی»
                    </strong>{" "}
                    <Icons.SquarePlus className="mx-0.5 inline h-3.5 w-3.5 text-primary" />{" "}
                    را انتخاب کنید.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sun/20 text-micro font-bold text-sun">
                    ۳
                  </span>
                  <span>
                    در بالای صفحه دکمه{" "}
                    <strong className="font-bold text-foreground">
                      «افزودن» (Add)
                    </strong>{" "}
                    را بزنید.
                  </span>
                </li>
              </ol>
            </div>
            <Button
              variant="sun"
              size="lg"
              block
              onClick={() => closeInstallSheet(true)}
            >
              متوجه شدم
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-3.5 text-start">
              <Typography variant="body-sm" tone="muted" className="leading-6">
                برای نصب گردون، منوی مرورگر خود را باز کرده و گزینه{" "}
                <strong className="font-bold text-foreground">
                  «نصب برنامه»
                </strong>{" "}
                یا{" "}
                <strong className="font-bold text-foreground">
                  «افزودن به صفحه اصلی»
                </strong>{" "}
                را انتخاب کنید.
              </Typography>
            </div>
            <Button
              variant="sun"
              size="lg"
              block
              onClick={() => closeInstallSheet(true)}
            >
              متوجه شدم
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
