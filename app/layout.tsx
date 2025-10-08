"use client"; // 👈 add this at the very top


import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
// import { useEffect } from "react";
// import { createClient } from "../lib/supabase/client"; 

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
  //Included for getting supabase token for testing authenticated user
  //   useEffect(() => {
  //   const getToken = async () => {
  //         const supabase = createClient(); // 👈 call it here
  //     const { data } = await supabase.auth.getSession();
  //     console.log("Supabase access token:", data.session?.access_token);
  //   };
  //   getToken();
  // }, []);
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} scroll-smooth max-w-[1440px] overflow-x-hidden mx-auto`}>
      <body suppressHydrationWarning className={spaceGrotesk.className}>
        <AuthProvider>{children}</AuthProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
