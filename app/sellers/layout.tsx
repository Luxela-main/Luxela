import type React from "react";
import Sidebar from "@/components/sellers/sidebar";

export default function SellersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-[272px]">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
