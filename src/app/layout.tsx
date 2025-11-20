
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import './shopee-info.css';
// FIX: Import React to make the React namespace available for type annotations like React.ReactNode.
import React from "react";
import Providers from './providers'

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Inabiz Online - Content Genie",
  description: "Professional content generation tool - a MASTER SERVE innovation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body ap-style="" suppressHydrationWarning className={inter.className}>
        NEXTAUTH_SECRET=h7dxRRzHHZvnfbQFn4iPRfegjaHtqzkYKcmIE7MapXo=
                        NEXTAUTH_SECRET = h7dxRRzHHZvnfbQFn4iPRfegjaHtqzkYKcmIE7MapXo=
                NEXTAUTH_URL = https://www.inabiz.online
                THREADS_APP_ID = 1303297011016524
                THREADS_APP_SECRET = 3c3d66bd156fe1ddbbb722daaf62c5d        <div className="app-wrapper">
          <div className="app-container-wrapper">
            <Providers>{children}</Providers>
          </div>
        </div>

        {/* Facebook SDK */}
        <Script id="facebook-sdk" strategy="afterInteractive">
          {`
            window.fbAsyncInit = function() {
              FB.init({
                appId      : '1340853470991732',
                cookie     : true,
                xfbml      : true,
                version    : 'v17.0'
              });
              
              FB.AppEvents.logPageView();
            };

            (function(d, s, id){
              var js, fjs = d.getElementsByTagName(s)[0];
              if (d.getElementById(id)) {return;}
              js = d.createElement(s); js.id = id;
              js.src = "https://connect.facebook.net/en_US/sdk.js";
              fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
          `}
        </Script>
      </body>
    </html>
  );
}
