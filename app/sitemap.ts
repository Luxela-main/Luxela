//import { MetadataRoute } from "next";
//import { db } from "@/server/db";
//import { listings } from "@/server/db/schema";

export const dynamic = "force-dynamic";

import { fetchAllProducts, fetchAllCategories, fetchAllBlogs } from "@/lib/data/sitemap";

export default async function sitemap() {
  const base = "https://luxela.com";

  const products = (await fetchAllProducts()).map((p: any) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt || new Date(),
  }));

  const categories = (await fetchAllCategories()).map((c: any) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: new Date(),
  }));

  const blogs = (await fetchAllBlogs()).map((b: any) => ({
    url: `${base}/blog/${b.slug}`,
    lastModified: b.updatedAt || new Date(),
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
    },
    ...products,
    ...categories,
    ...blogs,
  ];
}