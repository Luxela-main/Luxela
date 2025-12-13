import type React from "react";
import Sidebar from "@/components/sellers/sidebar";

// export default function SellersLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <div className="min-h-screen">
//       <Sidebar />
//         <div className="lg:pl-[272px] pt-16 lg:pt-0">
//         <div className="min-h-screen p-4 lg:p-6">{children}</div>
//       </div>
//     </div>
//   );
// }



export default function SellersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 md:ml-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}