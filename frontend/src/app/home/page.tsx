import type { Metadata } from "next";
import { HomeDashboard } from "@/features/groups/components/HomeDashboard";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "صندوق‌های من",
  description: "مشاهده و مدیریت تمام صندوق‌های قرض‌الحسنه فعال و در حال عضوگیری.",
  path: "/home",
});

export default function HomePage() {
  return <HomeDashboard />;
}
