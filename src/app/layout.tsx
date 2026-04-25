import type { Metadata, Viewport } from "next";
import { Shippori_Mincho } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const shipporiMincho = Shippori_Mincho({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-shippori",
});

export const viewport: Viewport = {
  themeColor: "#05040a",
  width: "device-width",
  initialScale: 1,
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
      className={`${shipporiMincho.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-(family-name:--font-shippori)">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
