"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShellGuard } from "./AppShellGuard";
import { PersistentBottomNav } from "./BottomNav";
import { OfflineNotice } from "./OfflineNotice";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 15_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerRegister />
      <AppShellGuard />
      <OfflineNotice />
      {children}
      <PersistentBottomNav />
      <Toaster
        position="top-center"
        dir="rtl"
        toastOptions={{
          style: {
            background: "oklch(0.19 0.03 152)",
            color: "oklch(0.97 0.006 140)",
            border: "1px solid oklch(0.32 0.04 152)",
            borderRadius: "9999px",
            fontFamily: "var(--font-iransans), sans-serif",
            fontSize: "13px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
