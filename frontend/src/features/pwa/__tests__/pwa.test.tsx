import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstallAppSheet } from "../components/InstallAppSheet";
import { UpdateAppSheet } from "../components/UpdateAppSheet";
import {
  clearInstallPromptDismissal,
  isInstallPromptDismissed,
} from "../storage";
import { usePwaStore } from "../store";
import type { BeforeInstallPromptEvent } from "../types";

function resetPwaStore() {
  usePwaStore.setState({
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
  });
}

describe("PWA Install & Update Sheets", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearInstallPromptDismissal();
    resetPwaStore();
  });

  it("renders native install CTA when beforeinstallprompt is captured and invokes prompt()", async () => {
    const user = userEvent.setup();
    const promptSpy = vi.fn().mockResolvedValue(undefined);
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      platforms: ["web"],
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
      prompt: promptSpy,
    } as unknown as BeforeInstallPromptEvent;

    usePwaStore.getState().setDeferredPrompt(mockPromptEvent);
    usePwaStore.getState().openInstallSheet();

    render(<InstallAppSheet />);

    expect(screen.getByText("نصب وب‌اپلیکیشن گردون")).toBeInTheDocument();
    const installBtn = screen.getByRole("button", {
      name: /نصب و افزودن به صفحه اصلی/,
    });
    await user.click(installBtn);

    await waitFor(() => {
      expect(promptSpy).toHaveBeenCalledTimes(1);
      expect(usePwaStore.getState().installSheetOpen).toBe(false);
    });
  });

  it("renders iOS Safari instructions when on iOS without deferredPrompt", () => {
    usePwaStore.getState().setPlatform("ios");
    usePwaStore.getState().openInstallSheet();

    render(<InstallAppSheet />);

    expect(
      screen.getByText(/راهنمای نصب در آیفون و آیپد/)
    ).toBeInTheDocument();
    expect(screen.getByText(/افزودن به صفحه اصلی/)).toBeInTheDocument();
  });

  it("snoozes install prompt in localStorage when dismissed", async () => {
    const user = userEvent.setup();
    const mockPromptEvent = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
    } as unknown as BeforeInstallPromptEvent;

    usePwaStore.getState().setDeferredPrompt(mockPromptEvent);
    usePwaStore.getState().openInstallSheet();

    render(<InstallAppSheet />);

    await user.click(screen.getByRole("button", { name: "بعداً یادآوری کن" }));

    expect(usePwaStore.getState().installSheetOpen).toBe(false);
    expect(isInstallPromptDismissed()).toBe(true);
  });

  it("opens UpdateAppSheet on new version, clears stale queries, posts SKIP_WAITING, and reloads", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    queryClient.setQueryData(["groups"], [{ id: "stale-group" }]);
    const clearSpy = vi.spyOn(queryClient, "clear");

    const postMessageSpy = vi.fn();
    const mockWaitingWorker = {
      postMessage: postMessageSpy,
      state: "installed",
    } as unknown as ServiceWorker;

    const reloadSpy = vi.fn();

    usePwaStore.getState().setWaitingWorker(mockWaitingWorker);
    usePwaStore.getState().openUpdateSheet();

    render(
      <QueryClientProvider client={queryClient}>
        <UpdateAppSheet onReload={reloadSpy} />
      </QueryClientProvider>
    );

    expect(screen.getByText("نسخه جدید گردون آماده است")).toBeInTheDocument();
    expect(
      screen.getByText(/پاک‌سازی داده‌های قدیمی و منقضی/)
    ).toBeInTheDocument();

    const updateBtn = screen.getByRole("button", {
      name: /به‌روزرسانی و دریافت اطلاعات تازه/,
    });
    await user.click(updateBtn);

    await waitFor(
      () => {
        expect(clearSpy).toHaveBeenCalledTimes(1);
        expect(postMessageSpy).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
        expect(reloadSpy).toHaveBeenCalledTimes(1);
      },
      { timeout: 2500 }
    );
  });

  it("detects waiting worker during checkForUpdate and opens UpdateAppSheet", async () => {
    const mockWaiting = {
      postMessage: vi.fn(),
      state: "installed",
    } as unknown as ServiceWorker;

    const updateSpy = vi.fn().mockImplementation(async () => {
      (mockRegistration as { waiting: ServiceWorker | null }).waiting =
        mockWaiting;
    });

    const mockRegistration = {
      waiting: null,
      update: updateSpy,
    } as unknown as ServiceWorkerRegistration;

    usePwaStore.getState().setRegistration(mockRegistration);

    const outcome = await usePwaStore.getState().checkForUpdate();

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(outcome).toBe("update-found");
    expect(usePwaStore.getState().updateAvailable).toBe(true);
    expect(usePwaStore.getState().updateSheetOpen).toBe(true);
  });
});
