import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import ClientProviders from "./ClientProviders";
import { spaceGrotesk } from "@/public/fonts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

export const metadata: Metadata = {
  title: {
    default: "LUXELA — Authentic Fashion",
    template: "%s | LUXELA",
  },
  description:
    "LUXELA — buy, sell and pay for authentic fashion products easily using your local or digital currency.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "LUXELA — Authentic Fashion",
    description:
      "LUXELA — buy, sell and pay for authentic fashion products easily using your local or digital currency.",
    url: SITE_URL,
    siteName: "LUXELA",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LUXELA — Authentic Fashion",
    description:
      "LUXELA — buy, sell and pay for authentic fashion products easily using your local or digital currency.",
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "LUXELA",
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo.png`,
      "sameAs": [
        "https://www.facebook.com/yourpage",
        "https://www.instagram.com/yourprofile",
        "https://x.com/LuxelaPlace",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": "LUXELA",
      "publisher": {
        "@id": `${SITE_URL}/#organization`,
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={spaceGrotesk.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="max-w-[1440px] mx-auto">
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
