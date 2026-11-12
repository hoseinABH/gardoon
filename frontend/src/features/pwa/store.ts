"use client";

import { create } from "zustand";
import { dismissInstallPrompt } from "./storage";
import type { BeforeInstallPromptEvent } from "./types";

export type PwaPlatform = "chromium" | "ios" | "other";

export interface PwaState {
  isStandalone: boolean;
  platform: PwaPlatform;
  deferredPrompt: BeforeInstallPromptEvent | null;
  waitingWorker: ServiceWorker | null;
  registration: ServiceWorkerRegistration | null;
  installSheetOpen: boolean;
  updateSheetOpen: boolean;
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  isUpdating: boolean;

  setStandalone: (value: boolean) => void;
  setPlatform: (platform: PwaPlatform) => void;
  setDeferredPrompt: (event: BeforeInstallPromptEvent | null) => void;
  setWaitingWorker: (worker: ServiceWorker | null) => void;
  setRegistration: (reg: ServiceWorkerRegistration | null) => void;
  openInstallSheet: () => void;
  closeInstallSheet: (snooze?: boolean) => void;
  openUpdateSheet: () => void;
  closeUpdateSheet: () => void;
  setIsUpdating: (updating: boolean) => void;
  triggerInstall: () => Promise<"accepted" | "dismissed" | "manual">;
  checkForUpdate: () => Promise<"update-found" | "up-to-date" | "unsupported">;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  isStandalone: false,
  platform: "other",
  deferredPrompt: null,
  waitingWorker: null,
  registration: null,
  installSheetOpen: false,
  updateSheetOpen: false,
  updateAvailable: false,
  isCheckingUpdate: false,
  isUpdating: false,

  setStandalone: (isStandalone) => set({ isStandalone }),
  setPlatform: (platform) => set({ platform }),
  setDeferredPrompt: (deferredPrompt) =>
    set({
      deferredPrompt,
      platform: deferredPrompt ? "chromium" : get().platform,
    }),
  setWaitingWorker: (waitingWorker) =>
    set({
      waitingWorker,
      updateAvailable: Boolean(waitingWorker),
    }),
  setRegistration: (registration) => set({ registration }),

  openInstallSheet: () => set({ installSheetOpen: true }),
  closeInstallSheet: (snooze = true) => {
    if (snooze) {
      dismissInstallPrompt(7);
    }
    set({ installSheetOpen: false });
  },

  openUpdateSheet: () => set({ updateSheetOpen: true }),
  closeUpdateSheet: () => set({ updateSheetOpen: false }),
  setIsUpdating: (isUpdating) => set({ isUpdating }),

  triggerInstall: async () => {
    const prompt = get().deferredPrompt;
    if (!prompt) {
      return "manual";
    }
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        set({ deferredPrompt: null, installSheetOpen: false });
      } else {
        dismissInstallPrompt(7);
        set({ installSheetOpen: false });
      }
      return outcome;
    } catch {
      return "manual";
    }
  },

  checkForUpdate: async () => {
    const { registration, waitingWorker } = get();
    if (waitingWorker) {
      set({ updateAvailable: true, updateSheetOpen: true });
      return "update-found";
    }
    if (!registration) {
      return "unsupported";
    }

    set({ isCheckingUpdate: true });
    try {
      await registration.update();
      const waiting = registration.waiting;
      if (waiting) {
        set({
          waitingWorker: waiting,
          updateAvailable: true,
          updateSheetOpen: true,
        });
        return "update-found";
      }
      return "up-to-date";
    } catch {
      return "unsupported";
    } finally {
      set({ isCheckingUpdate: false });
    }
  },
}));
