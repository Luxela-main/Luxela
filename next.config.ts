import type { NextConfig } from "next";
import path from "path";

const isVercelEnv = !!process.env.VERCEL;
const isLocalEnv = !isVercelEnv && process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Performance: Enable Turbopack for faster builds
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh1.googleusercontent.com" },
      { protocol: "https", hostname: "lh2.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "bychpijffixdnqonbxyj.supabase.co" },
    ],
    unoptimized: !isVercelEnv,
    // Performance: Optimize image sizes for different devices
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable React Strict Mode for development
  reactStrictMode: true,

  // Performance: Aggressive caching and compression headers
  ...(isVercelEnv && {
    headers: async () => {
      return [
        // Security headers
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "X-XSS-Protection", value: "1; mode=block" },
          ],
        },
        // Cache static assets aggressively (1 year)
        {
          source: "/static/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        // Cache images (30 days)
        {
          source: "/images/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=2592000, immutable" },
          ],
        },
        // Cache fonts (1 year)
        {
          source: "/fonts/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        // Cache versioned JS/CSS bundles (1 year)
        {
          source: "/_next/static/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        // Cache pages with revalidation (1 hour)
        {
          source: "/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
          ],
        },
      ];
    },
    compress: true,
  }),

  ...(isLocalEnv && {}),
};

// Only check for required env vars in production or when explicitly needed
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

// Skip env var validation during build if they're not set
if (process.env.NODE_ENV !== "production" || isVercelEnv) {
  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      console.warn(`Environment variable ${key} is missing. This may cause issues at runtime.`);
    }
  });
}

export default nextConfig;