import type React from "react";
import Sidebar from "@/components/sellers/sidebar";
import SellerNavbar from "@/components/sellers/SellerNavbar";

export default function SellersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SellerNavbar />
      {/* Layout: Mobile has navbar at top with pt-16, Desktop has navbar at top and sidebar on left */}
      <div className="flex flex-col lg:flex-row min-h-screen pt-16">
        <Sidebar />
        {/* Main content - full width on mobile, adjusted width on desktop */}
        <main className="flex-1 w-full lg:w-[calc(100%-16rem)]">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}