import BuyerFooter from "@/components/buyer/footer"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import type React from "react"


interface LayoutProps {
  children: React.ReactNode
}

export default async function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0e0e0e]">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8">{children}</main>
      </div>

      <BuyerFooter />
    </div>
  )
}
