import { NextResponse } from "next/server";

export const GET = async () => {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

  const content = `
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
};