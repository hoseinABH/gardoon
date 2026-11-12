import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { ONBOARDING_COOKIE_NAME } from "@/features/onboarding/storage";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  description:
    "گردون؛ مدیریت هوشمند صندوق‌های قرض‌الحسنه خانوادگی و دوستانه با قرعه‌کشی شفاف سررسید.",
  path: "/",
});

export default async function RootPage() {
  const cookieStore = await cookies();
  if (cookieStore.get(ONBOARDING_COOKIE_NAME)?.value === "1") {
    redirect("/auth");
  }
  return <OnboardingScreen />;
}
