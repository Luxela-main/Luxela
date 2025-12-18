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
                  gtag('config', '${GA_ID}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}
        {/* Robots meta for search engines */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE.url} />
        {/* Sitemap reference */}
        <link rel="sitemap" type="application/xml" href={`${SITE.url}/sitemap.xml`} />
      </head>

      <body suppressHydrationWarning className={spaceGrotesk.className}>
        <ClientProviders>{children}</ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}

export { reportWebVitals };