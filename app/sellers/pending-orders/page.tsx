"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"

export default function PendingOrders() {
      const [search, setSearch] = useState("");

  return (
    <div className="p-6">

       <div className="mb-6">
              <div className="w-60 z-10 lg:w-80 max-lg:fixed max-md:right-10 max-lg:right-12 max-lg:top-[18px] lg:ml-auto">
                <SearchBar search={search} setSearch={setSearch} />
              </div>
            </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Pending Orders</h1>
          <p className="text-gray-400 mt-1">View and manage all your pending orders in one place.</p>
        </div>
    
      </div>

      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-4 p-4 border-b border-[#333] text-gray-400 text-sm">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span>Order ID</span>
          </div>
          <div>Product</div>
          <div>Customer</div>
          <div>Order Date</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Action</div>
        </div>

        <EmptyState
          icon={<Clock className="h-16 w-16" />}
          title="No pending orders at the moment"
          description="When customers place orders, they will appear here for you to process."
        />
      </div>
    </div>
  )
}
