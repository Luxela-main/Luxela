import type { NextConfig } from "next";
import path from "path";

const isVercelEnv = !!process.env.VERCEL;
const isLocalEnv = !isVercelEnv && process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
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
  },
  ...(isVercelEnv && {
    headers: async () => {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "X-XSS-Protection", value: "1; mode=block" },
          ],
        },
      ];
    },
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