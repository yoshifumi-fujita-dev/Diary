import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Noto_Sans_JP, Klee_One } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { BottomNav } from "@/components/BottomNav";
import { FontProvider } from "@/components/FontProvider";
import "./globals.css";

const shipporiMincho = Shippori_Mincho({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-shippori",
});

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans",
});

const kleeOne = Klee_One({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-klee",
});

export const viewport: Viewport = {
  themeColor: "#05040a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "4423 Diary",
  description: "4423 Diary",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "4423 Diary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${shipporiMincho.variable} ${notoSansJP.variable} ${kleeOne.variable} min-h-dvh antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-(family-name:--font-shippori)">
        {children}
        <BottomNav />
        <FontProvider />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
