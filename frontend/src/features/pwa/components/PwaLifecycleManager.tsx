"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { flushQueuedReceipts } from "@/lib/api/offlineQueue";
import { isInstallPromptDismissed } from "../storage";
import { usePwaStore, type PwaPlatform } from "../store";
import type { BeforeInstallPromptEvent } from "../types";
import { InstallAppSheet } from "./InstallAppSheet";
import { UpdateAppSheet } from "./UpdateAppSheet";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const AUTO_INSTALL_DELAY_MS = 2800;

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone =
    "standalone" in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true;
  return displayModeStandalone || navigatorStandalone;
}

function detectPlatform(): PwaPlatform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return "ios";
  }
  return "other";
}

export function PwaLifecycleManager() {
  const pathname = usePathname();
  const {
    isStandalone,
    platform,
    deferredPrompt,
    updateSheetOpen,
    setStandalone,
    setPlatform,
    setDeferredPrompt,
    setWaitingWorker,
    setRegistration,
    openInstallSheet,
    openUpdateSheet,
  } = usePwaStore();

  useEffect(() => {
    const standalone = detectStandalone();
    setStandalone(standalone);
    setPlatform(detectPlatform());

    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(display-mode: standalone)")
        : null;
    const handleDisplayModeChange = () => {
      setStandalone(detectStandalone());
    };
    media?.addEventListener?.("change", handleDisplayModeChange);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setStandalone(true);
      toast.success("گردون با موفقیت روی دستگاه شما نصب شد");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      media?.removeEventListener?.("change", handleDisplayModeChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [setDeferredPrompt, setPlatform, setStandalone]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let visibilityHandler: (() => void) | undefined;
    let activeReg: ServiceWorkerRegistration | null = null;

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          activeReg = reg;
          setRegistration(reg);

          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            openUpdateSheet();
          }

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setWaitingWorker(newWorker);
                openUpdateSheet();
              }
            });
          });

          intervalId = setInterval(() => {
            if (navigator.onLine) {
              reg.update().catch(() => undefined);
            }
          }, CHECK_INTERVAL_MS);

          visibilityHandler = () => {
            if (document.visibilityState === "visible" && navigator.onLine) {
              activeReg?.update().catch(() => undefined);
            }
          };
          document.addEventListener("visibilitychange", visibilityHandler);
        })
        .catch(() => undefined);
    }

    const syncPending = async () => {
      const count = await flushQueuedReceipts();
      if (count > 0) {
        toast.success(`${count} رسید در صف انتظار به سرور ارسال شد`);
      }
    };

    syncPending();
    window.addEventListener("online", syncPending);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }
      window.removeEventListener("online", syncPending);
    };
  }, [openUpdateSheet, setRegistration, setWaitingWorker]);

  useEffect(() => {
    if (isStandalone || updateSheetOpen || isInstallPromptDismissed()) {
      return;
    }
    // Keep onboarding and auth flows uninterrupted
    if (!pathname || pathname === "/" || pathname.startsWith("/auth")) {
      return;
    }
    const isEligibleAutoPrompt = Boolean(deferredPrompt) || platform === "ios";
    if (!isEligibleAutoPrompt) {
      return;
    }

    const timer = setTimeout(() => {
      const state = usePwaStore.getState();
      if (!state.updateSheetOpen && !state.isStandalone && !isInstallPromptDismissed()) {
        openInstallSheet();
      }
    }, AUTO_INSTALL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [
    deferredPrompt,
    isStandalone,
    openInstallSheet,
    pathname,
    platform,
    updateSheetOpen,
  ]);

  return (
    <>
      <InstallAppSheet />
      <UpdateAppSheet />
    </>
  );
}
