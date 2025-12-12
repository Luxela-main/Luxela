import { Analytics } from "@vercel/analytics/next";
export { reportWebVitals } from "@/lib/analytics/webVitals";
import Script from "next/script"; 
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { spaceGrotesk } from "@/public/fonts";
import ClientProviders from "./ClientProviders";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script
          id="ga-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { page_path: window.location.pathname });
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={spaceGrotesk.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}