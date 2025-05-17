import type React from "react"
import Sidebar from "@/components/sellers/sidebar"

export default function SellersLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="dashboard-layout flex min-h-screen">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  )
}
