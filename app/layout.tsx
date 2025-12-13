import { Analytics } from "@vercel/analytics/next";
import { reportWebVitals } from "@/lib/analytics/webVitals";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import { spaceGrotesk } from "@/public/fonts";
import ClientProviders from "./ClientProviders";
import { SITE } from "@/lib/seo/config";
import type { Metadata } from "next";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

/**
 * Global SEO metadata (applies to ALL pages)
 * Google-safe title length
 * No duplicate manual <meta> tags
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com"
  ),

  title: {
    default: "Luxela Fashion",
    template: "%s | Luxela",
  },

  description:
    "Trendy, premium, and affordable African fashion with fast delivery, flexible payments, and quality craftsmanship.",

  keywords: SITE.keywords,

  alternates: {
    canonical: SITE.url,
  },

  openGraph: {
    title: "Luxela Fashion",
    description:
      "Trendy, premium, and affordable African fashion with fast delivery and flexible payment options.",
    url: SITE.url,
    siteName: "Luxela Fashion",
    locale: SITE.locale,
    type: "website",
    images: [
      {
        url: SITE.defaultImage,
        width: 1200,
        height: 630,
        alt: "Luxela Fashion – African Fashion Marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Luxela Fashion",
    description:
      "Trendy, premium, and affordable African fashion with fast delivery and flexible payment options.",
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
        {/* Google Analytics (GA4) */}
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