import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { reportWebVitals } from "@/lib/analytics/webVitals";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import { spaceGrotesk } from "@/public/fonts";
import ClientProviders from "./ClientProviders";
import { SITE } from "@/lib/seo/config";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/seo/structured-data";
import type { Metadata } from "next";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com"
  ),
  title: {
    default: "Luxela Fashion – African Trendy Clothing Store",
    template: "%s | Luxela Fashion",
  },
  description:
    "Shop trendy and affordable African fashion for men and women. Premium clothing, fast delivery, and flexible payments across Africa.",
  keywords: SITE.keywords,
  alternates: {
    canonical: SITE.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Luxela Fashion – African Trendy Clothing Store",
    description:
      "Shop trendy and affordable African fashion for men and women. Premium clothing, fast delivery, and flexible payments across Africa.",
    url: SITE.url,
    siteName: "Luxela Fashion",
    locale: SITE.locale,
    type: "website",
    images: [
      {
        url: SITE.defaultImage,
        width: 1200,
        height: 630,
        alt: "Luxela Fashion – African Trendy Clothing Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxela Fashion – African Trendy Clothing Store",
    description:
      "Shop trendy and affordable African fashion for men and women. Premium clothing, fast delivery, and flexible payments across Africa.",
    creator: SITE.twitter,
    images: [SITE.defaultImage],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Organization & Website Schema */}
        <Script
          id="org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateOrganizationSchema({
                name: "Luxela Fashion",
                url: SITE.url,
                logo: `${SITE.url}/logo.png`,
                description: "African Trendy Clothing Store",
                socialProfiles: [
                  "https://www.instagram.com/luxela",
                  "https://www.twitter.com/luxela",
                  "https://www.facebook.com/luxela",
                ],
              })
            ),
          }}
          strategy="afterInteractive"
        />

        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateWebSiteSchema({
                name: "Luxela Fashion",
                url: SITE.url,
              })
            ),
          }}
          strategy="afterInteractive"
        />

        {/* GA4 */}
        {GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script
              id="gtag-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag() {
                    dataLayer.push(arguments);
                  }
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    'page_path': window.location.pathname,
                    'allow_google_signals': true,
                    'allow_ad_personalization_signals': true,
                  });
                `,
              }}
            />
          </>
        )}

        <meta name="robots" content="index, follow" />
        <link
          rel="sitemap"
          type="application/xml"
          href={`${SITE.url}/sitemap.xml`}
        />
      </head>

      <body suppressHydrationWarning className={spaceGrotesk.className}>
        {/* Client Providers */}
        <ClientProviders>{children}</ClientProviders>

        {/* Analytics */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

export { reportWebVitals };