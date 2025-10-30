import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

  return {
    name: "LUXELA — Authentic Fashion",
    short_name: "LUXELA",
    description:
      "LUXELA — an e-commerce platform for authentic fashion. Discover curated, high-quality apparel and accessories.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait",
    scope: "/",
    id: "/",
    icons: [
      {
        src: `${SITE_URL}/icons/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${SITE_URL}/icons/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${SITE_URL}/icons/maskable-icon.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
