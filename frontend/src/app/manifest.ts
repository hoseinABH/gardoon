import type { MetadataRoute } from "next";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "گردون | صندوق قرض‌الحسنه هوشمند",
    short_name: "گردون",
    description: "دفترکل هوشمند مدیریت صندوق‌های قرض‌الحسنه خانوادگی و دوستانه",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#070E0A",
    background_color: "#070E0A",
    icons: [
      ...ICON_SIZES.map((size) => ({
        src: `/icons/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      {
        src: "/icons/maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
