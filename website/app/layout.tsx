import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PureMac — Free disk space insight for macOS",
  description:
    "PureMac is a free, open-source macOS app that scans your disk, summarizes reclaimable space, and helps you clean large files safely.",
  icons: [{ rel: "icon", url: "/icon.png", type: "image/png" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
