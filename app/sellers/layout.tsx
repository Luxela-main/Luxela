import type React from "react";
import Sidebar from "@/components/sellers/sidebar";

export default function SellersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
