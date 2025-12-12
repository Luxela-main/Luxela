import { Analytics } from "@vercel/analytics/next";
import { reportWebVitals } from "@/lib/analytics/webVitals";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import { spaceGrotesk } from "@/public/fonts";
import ClientProviders from "./ClientProviders";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}
      </head>
      <body suppressHydrationWarning className={spaceGrotesk.className}>
        <ClientProviders>{children}</ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}

export { reportWebVitals };