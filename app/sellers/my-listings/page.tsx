"use client"

import { useState } from "react"
import { Package, Filter, PlusCircle } from "lucide-react"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"

export default function MyListings() {
    const [search, setSearch] = useState("");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Listing</h1>
          <p className="text-gray-400 mt-1">View and manage all your listed products in one place.</p>
        </div>
        <div className="w-80">
          <SearchBar search={search} setSearch={setSearch}/>
        </div>
      </div>

      <div className="flex justify-between mb-6">
        <div className="flex space-x-2">
          <button className="bg-[#1a1a1a] border border-[#333] text-white px-4 py-2 rounded-md flex items-center">
            <span className="mr-2">Single Items</span>
          </button>
          <button className="text-gray-400 px-4 py-2 rounded-md">Collections</button>
        </div>
        <div className="flex space-x-2">
          <button className="bg-[#1a1a1a] border border-[#333] text-white px-4 py-2 rounded-md flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <span>Filter</span>
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md flex items-center">
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-[#333] text-gray-400 text-sm">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span>Product Name</span>
          </div>
          <div>Category</div>
          <div>Price</div>
          <div>Stock</div>
          <div>Status</div>
          <div>Action</div>
        </div>

        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="Your Listing is currently empty"
          description="once you start add products, your products will show up here."
        />
      </div>
    </div>
  )
}
