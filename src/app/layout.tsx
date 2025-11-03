
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import  './globals.css';
import './shopee-info.css';
// FIX: Import React to make the React namespace available for type annotations like React.ReactNode.
import React from "react";
import Providers from './providers'

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
      <body ap-style="" suppressHydrationWarning className={inter.className}>
        <div className="app-wrapper">
          <div className="app-container-wrapper">
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
