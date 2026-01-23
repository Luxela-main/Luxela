export const dynamic = 'force-dynamic';

import Header from "@/components/buyer/dashboard/header";
import { Sidebar } from "@/components/buyer/dashboard/sidebar";
import type React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0e0e0e]">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        {/* Responsive main content with proper spacing for mobile */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full lg:w-auto">
          {children}
        </main>
      </div>

      {/* <BuyerFooter /> */}
    </div>
  );
}