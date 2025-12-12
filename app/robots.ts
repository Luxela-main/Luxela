export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/checkout", "/profile", "/admin"],
      },
    ],
    sitemap: "https://theluxela.com/sitemap.xml",
  };
}
