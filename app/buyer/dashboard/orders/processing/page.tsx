"use client"

import { Breadcrumb } from "@/components/buyer/dashboard/breadcrumb"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import { OrderTabs } from "@/components/buyer/dashboard/order-tabs"

export default function ProcessingOrdersPage() {
  return (
    <div>
      <Breadcrumb
        items={[{ label: "Home", href: "/buyer/dashboard" }, { label: "Orders", href: "/buyer/dashboard/orders" }, { label: "Processing Orders" }]}
      />

      <h1 className="text-white text-2xl font-semibold mb-8">Orders</h1>

      <div className="flex items-center justify-between mb-8">
        <OrderTabs />

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e7e7e]" />
          <Input
            placeholder="Item name/ Order Id/ Tracking No."
            className="pl-10 bg-[#1a1a1a] border-[#212121] text-white placeholder:text-[#7e7e7e]"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Processing Order Card */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[#d4af37] text-sm">Shipping Est. Delivery 23rd October, 2025</div>
            <Link href="/buyer/dashboard/orders/processing/NOB-134560" className="text-[#8451e1] text-sm hover:underline">
              View order details
            </Link>
          </div>

          <div className="flex gap-4 mb-4">
            <img src="/Frame 2087327087.svg" alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
            <img src="/Frame 2087327087.svg" alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
            <img src="/Frame 2087327087.svg" alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#212121]">
            <div className="text-[#7e7e7e] text-sm">Order ID:</div>
            <div className="text-white font-medium">NOB-134560</div>
          </div>
        </div>
      </div>
    </div>
  )
}