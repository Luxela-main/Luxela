export const dynamic = 'force-dynamic';

import { Sidebar } from "@/components/buyer/dashboard/sidebar";
import type React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col bg-[#0e0e0e]">
      <div className="flex flex-1">
        <Sidebar />

        {/* Responsive main content with proper spacing for mobile and desktop */}
        <main className="flex-1 w-full p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* <BuyerFooter /> */}
    </div>
  );
}