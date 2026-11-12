import type { Metadata } from "next";
import { CreateGroupWizard } from "@/features/groups/components/CreateGroupWizard";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "ایجاد صندوق جدید",
  description: "تعیین مبلغ وام، دوره قرعه‌کشی شمسی و ساخت صندوق قرض‌الحسنه جدید.",
  path: "/create",
});

export default function CreatePage() {
  return <CreateGroupWizard />;
}
