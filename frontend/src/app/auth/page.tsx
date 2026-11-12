import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "ورود و ثبت‌نام",
  description: "احراز هویت سریع با شماره موبایل و ثبت اطلاعات بانکی دریافت وام.",
  path: "/auth",
});

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen />
    </Suspense>
  );
}
