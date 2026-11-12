import type { Metadata } from "next";
import { GroupDetailScreen } from "@/features/groups/components/GroupDetailScreen";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildMetadata({
    title: "جزئیات صندوق و اقساط",
    description: "مدیریت قرعه‌کشی سررسید، پرداخت اقساط کارت‌به‌کارت و گفتگوی اعضای صندوق.",
    path: `/groups/${id}`,
  });
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupDetailScreen groupId={id} />;
}
