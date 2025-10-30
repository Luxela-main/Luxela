"use client"

import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function OrdersPage() {
  const pathname = usePathname()

  const tabs = [
    { id: "all", label: "All Orders", href: "/dashboard/orders" },
    { id: "processing", label: "Processing", href: "/dashboard/orders/processing" },
    { id: "shipped", label: "Shipped", href: "/dashboard/orders/shipped" },
    { id: "delivered", label: "Delivered", href: "/dashboard/orders/delivered" },
    { id: "returned", label: "Returned", href: "/dashboard/orders/returned" },
  ]

  const hasOrders = true

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/dashboard" }, { label: "Orders" }]} />

      <h1 className="text-white text-2xl font-semibold mb-8">Orders</h1>

      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-8 border-b border-[#212121]">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`pb-3 text-sm transition-colors relative ${
                pathname === tab.href ? "text-white" : "text-[#7e7e7e] hover:text-white"
              }`}
            >
              {tab.label}
              {pathname === tab.href && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8451e1]" />}
            </Link>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e7e7e]" />
          <Input
            placeholder="Item name/ Order Id/ Tracking No."
            className="pl-10 bg-[#1a1a1a] border-[#212121] text-white placeholder:text-[#7e7e7e]"
          />
        </div>
      </div>

      {hasOrders ? (
        <div className="space-y-6 py-[19px] px-[30px] bg-[#141414]">
          {/* Order Card 1 - Shipping */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[#d4af37] text-sm">Shipping Est. Delivery 23rd October, 2025</div>
              <Link href="/dashboard/orders/processing/NOB-134560" className="text-[#8451e1] text-sm hover:underline">
                View order details
              </Link>
            </div>

            <div className="flex gap-4 mb-4">
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
              <img src="/Frame 2087327087.svg" alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#212121]">
              <div className="text-[#7e7e7e] text-sm">Order ID:</div>
              <div className="text-white font-medium">NOB-134560</div>
            </div>
          </div>

          {/* Order Card 2 - Delivered with carousel */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white text-sm">Delivered 23rd October, 2025</div>
              <Link href="/dashboard/orders/delivered/NOB-134560" className="text-[#8451e1] text-sm hover:underline">
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
                <img src="/Frame 2087327087.svg" alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
                <img src="/Frame 2087327087.svg" alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
              </div>

              {/* Carousel arrows */}
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

          {/* Order Card 3 - Delivered with Returned badge */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-white text-sm">Delivered 23rd October, 2025</span>
                <span className="flex items-center gap-1 text-[#ff5e5e] text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#ff5e5e]" />
                  Returned
                </span>
              </div>
              <Link href="/dashboard/orders/returned/NOB-134560" className="text-[#8451e1] text-sm hover:underline">
                View order details
              </Link>
            </div>

            <div className="flex gap-4 mb-4">
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
              <img src="/Frame 2087327087.svg" alt="Product" className="w-24 h-28 object-cover rounded bg-[#212121]" />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#212121]">
              <div className="text-[#7e7e7e] text-sm">Order ID:</div>
              <div className="text-white font-medium">NOB-134560</div>
            </div>
          </div>
        </div>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-48 h-48 mb-8">
            <img src="/purple-shopping-cart.jpg" alt="Empty cart" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-white text-xl font-medium mb-2">You haven't placed any order yet.</h2>
          <p className="text-[#7e7e7e] text-sm mb-8">Your orders will be saved here</p>
          <Button className="bg-[#8451e1] hover:bg-[#7041c7] text-white px-8">Continue Shopping</Button>
        </div>
      )}
    </div>
  )
}
