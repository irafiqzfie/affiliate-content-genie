
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// FIX: Import React to make the React namespace available for type annotations like React.ReactNode.
import React from "react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Affiliate Content Genie",
  description: "Your AI assistant for viral Shopee & TikTok content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
