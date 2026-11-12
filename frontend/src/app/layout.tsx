import type { Metadata, Viewport } from "next";
import { iranSans } from "./fonts";
import { Providers } from "@/components/ui/Providers";
import { APP_NAME, DEFAULT_DESCRIPTION, pageTitle } from "@/lib/seo/metadata";
import "./globals.css";

export const metadata: Metadata = {
  title: pageTitle(),
  description: DEFAULT_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#070E0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`dark ${iranSans.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-canvas text-foreground antialiased"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
