import type { Metadata } from "next";
import { Shippori_Mincho } from "next/font/google";
import "./globals.css";

const shipporiMincho = Shippori_Mincho({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-shippori",
});

export const metadata: Metadata = {
  title: "日記",
  description: "個人日記アプリ",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
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
      <body className="min-h-full flex flex-col font-(family-name:--font-shippori)">{children}</body>
    </html>
  );
}
