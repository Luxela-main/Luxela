import { Analytics } from "@vercel/analytics/next";
import { reportWebVitals } from "@/lib/analytics/webVitals";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import { spaceGrotesk } from "@/public/fonts";
import ClientProviders from "./ClientProviders";
import { SITE } from "@/lib/seo/config";
import type { Metadata } from "next";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com"
  ),

  title: {
    default:
      "Luxela Fashion | Trendy African Fashion, Premium Clothing & Online Store",
    template: "%s | Luxela Fashion",
  },

  description: SITE.description,

  keywords: SITE.keywords,

  alternates: {
    canonical: SITE.url,
  },

  openGraph: {
    title:
      "Luxela Fashion | Trendy African Fashion, Premium Clothing & Online Store",
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
    images: [
      {
        url: SITE.defaultImage,
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Luxela Fashion | Trendy African Fashion, Premium Clothing & Online Store",
    description: SITE.description,
    creator: SITE.twitter,
    images: [SITE.defaultImage],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
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
                  gtag('config', '${GA_ID}', {
                    page_path: window.location.pathname,
                  });
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