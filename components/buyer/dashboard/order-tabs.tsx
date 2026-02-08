"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function OrderTabs() {
  const pathname = usePathname()

  const tabs = [
    { id: "all", label: "All Orders", href: "/buyer/dashboard/orders" },
    { id: "processing", label: "Processing", href: "/buyer/dashboard/orders/processing" },
    { id: "shipped", label: "Shipped", href: "/buyer/dashboard/orders/shipped" },
    { id: "delivered", label: "Delivered", href: "/buyer/dashboard/orders/delivered" },
    { id: "returned", label: "Returned", href: "/buyer/dashboard/orders/returned" },
  ]

  // Check if current path matches tab (including detail pages)
  const isActive = (href: string) => {
    // All Orders should only be active on the exact list page
    if (href === "/buyer/dashboard/orders") {
      return pathname === "/buyer/dashboard/orders"
    }
    // Other tabs are active on their index and nested routes
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="flex gap-8 border-b-2 border-[#E5E7EB] bg-gradient-to-r from-[#E5E7EB]/5 to-transparent">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`pb-3 text-sm transition-colors relative ${
            isActive(tab.href) ? "text-white" : "text-[#7e7e7e] hover:text-white"
          }`}
        >
          {tab.label}
          {isActive(tab.href) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E5E7EB] via-[#E5E7EB] to-[#6B7280]" />}
        </Link>
      ))}
    </div>
  )
}