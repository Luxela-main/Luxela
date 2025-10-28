import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

  let products: { slug: string; updatedAt: string }[] = [];

  try {
    const res = await fetch(`${SITE_URL}/api/products`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const text = await res.text();

      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          products = data;
        } else {
          console.warn("Unexpected API response format:", data);
        }
      } catch (err) {
        console.error("Failed to parse JSON from /api/products:", err);
      }
    } else {
      console.error("Failed to fetch products:", res.status, res.statusText);
    }
  } catch (error) {
    console.error("Error fetching /api/products:", error);
  }

  const productUrls = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...productUrls,
  ];
}
