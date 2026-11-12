import type { Metadata } from "next";
import { ProfileScreen } from "@/features/auth/components/ProfileScreen";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "پروفایل و حساب بانکی",
  description: "مدیریت شماره کارت و شبا پیش‌فرض برای دریافت مبلغ وام در قرعه‌کشی.",
  path: "/profile",
});

export default function ProfilePage() {
  return <ProfileScreen />;
}
