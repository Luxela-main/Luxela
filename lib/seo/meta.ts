import { SITE } from "./config";

export function buildMeta({
  title,
  description,
  image,
  url,
  keywords,
}: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string[];
}) {
  return {
    title: title ? `${title} | ${SITE.name}` : SITE.name,
    description: description || SITE.description,
    keywords: (keywords || SITE.keywords).join(", "),
    openGraph: {
      title: title ? `${title} | ${SITE.name}` : SITE.name,
      description: description || SITE.description,
      images: [image || SITE.defaultImage],
      url: url || SITE.url,
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image || SITE.defaultImage],
    },
  };
}