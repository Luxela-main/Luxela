"use client";

import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import localFont from "next/font/local";

const spaceGrotesk = localFont({
  src: [
    {
      path: "../public/fonts/SpaceGrotesk-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/SpaceGrotesk-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-space-grotesk",
});

const metadata: Metadata = {
  title: "LUXELA",
  description: "E-commerce platform for authentic fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={spaceGrotesk.className}>
        <div className="max-w-[1440px] mx-auto">
          <AuthProvider>{children}</AuthProvider>
          <ToastContainer />
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
