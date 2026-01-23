"use client"

import { Breadcrumb } from "@/components/buyer/dashboard/breadcrumb"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { OrderTabs } from "@/components/buyer/dashboard/order-tabs"

export default function DeliveredOrdersPage() {
  return (
    <div >
      <Breadcrumb
        items={[{ label: "Home", href: "/buyer/dashboard" }, { label: "Orders", href: "/buyer/dashboard/orders/delivered" }, { label: "Delivered Orders" }]}
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
        {/* Delivered Order Card with carousel */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white text-sm">Delivered 23rd October, 2025</div>
            <Link href="/buyer/dashboard/orders/delivered/NOB-134560" className="text-[#8451e1] text-sm hover:underline">
              View order details
            </Link>
          </div>

          <div className="relative">
            <div className="flex gap-4 mb-4 overflow-hidden">
              <img
                src="/Frame 2087327087.svg"
                alt="Product"
                className="w-24 h-28 object-cover rounded bg-[#212121]"
              />
              <img
                src="/Frame 2087327087.svg"
                alt="Product"
                className="w-24 h-28 object-cover rounded bg-[#212121]"
              />
              <img src="/Frame 2087327087.svg"alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
              <img src="/Frame 2087327087.svg" alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
            </div>

            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 rounded-full bg-[#212121] flex items-center justify-center hover:bg-[#2a2a2a]">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 rounded-full bg-[#212121] flex items-center justify-center hover:bg-[#2a2a2a]">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#212121]">
            <div className="flex items-center gap-8">
              <div>
                <span className="text-[#7e7e7e] text-sm">10 items:</span>
                <span className="text-white font-medium ml-2">NGN 31,500.00</span>
              </div>
              <div>
                <span className="text-[#7e7e7e] text-sm">Order ID:</span>
                <span className="text-white font-medium ml-2">NOB-134560</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}