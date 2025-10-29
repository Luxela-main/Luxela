import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // env: {
  //   FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  //   FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  //   FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  //   FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  //   FIREBASE_MESSAGING_SENDER_ID:
  //     process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  //   FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  //   FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  // },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

// Validate required environment variables
const requiredEnvVars = [
 "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is missing`);
  }
});

export default nextConfig;
