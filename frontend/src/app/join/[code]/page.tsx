import type { Metadata } from "next";
import { InviteJoinScreen } from "@/features/groups/components/InviteJoinScreen";
import { buildMetadata } from "@/lib/seo/metadata";
import { resolveBackendOrigin } from "@/server/backendProxy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  try {
    const res = await fetch(
      `${resolveBackendOrigin()}/api/groups/invite/${encodeURIComponent(decoded)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const preview = (await res.json()) as { title?: string };
      if (preview.title) {
        return buildMetadata({
          title: `دعوت به ${preview.title}`,
          description: `دعوت‌نامه رسمی برای پیوستن به صندوق قرض‌الحسنه «${preview.title}»`,
          path: `/join/${decoded}`,
        });
      }
    }
  } catch {
    // fallback static invite title
  }
  return buildMetadata({
    title: `دعوت‌نامه صندوق (${decoded})`,
    description: "مشاهده شرایط صندوق قرض‌الحسنه و عضویت با کد دعوت.",
    path: `/join/${decoded}`,
  });
}

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <InviteJoinScreen code={decodeURIComponent(code)} />;
}
