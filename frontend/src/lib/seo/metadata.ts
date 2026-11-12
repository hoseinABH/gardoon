import type { Metadata } from "next";

export const APP_NAME = "گردون";
export const APP_TAGLINE = "صندوق قرض‌الحسنه هوشمند";
export const DEFAULT_DESCRIPTION =
  "مدیریت هوشمند صندوق‌های قرض‌الحسنه خانوادگی و دوستانه، قرعه‌کشی شفاف سررسید و تایید مستقیم واریزی‌ها";

export function pageTitle(title?: string): string {
  return title ? `${title} | ${APP_NAME}` : `${APP_NAME} — ${APP_TAGLINE}`;
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
}: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const fullTitle = pageTitle(title);
  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      locale: "fa_IR",
      siteName: APP_NAME,
      url: path,
    },
  };
}
