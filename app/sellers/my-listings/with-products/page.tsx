'use client'

import { Filter, PlusCircle, Shirt, MoreVertical } from "lucide-react"
import SearchBar from "@/components/search-bar"
import React from "react";

export default function MyListingsWithProducts() {
  const [search, setSearch] = React.useState("");
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Listing</h1>
          <p className="text-gray-400 mt-1">View and manage all your listed products in one place.</p>
        </div>
        <div className="w-80">
          <SearchBar search={search} setSearch={setSearch}  />
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

        <div className="border-b border-[#333]">
          <div className="grid grid-cols-6 gap-4 p-4 items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center">
                <div className="bg-[#222] p-1 rounded-md mr-2">
                  <Shirt className="h-5 w-5" />
                </div>
                <span>Product Name</span>
              </div>
            </div>
            <div>Men's clothing</div>
            <div>₦40,000.00</div>
            <div>300</div>
            <div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1"></span>
                In stock
              </span>
            </div>
            <div>
              <button className="text-gray-400 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-[#333]">
          <div className="grid grid-cols-6 gap-4 p-4 items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center">
                <div className="bg-[#222] p-1 rounded-md mr-2">
                  <Shirt className="h-5 w-5" />
                </div>
                <span>Product Name</span>
              </div>
            </div>
            <div>Women's clothing</div>
            <div>₦50,000.00</div>
            <div>280</div>
            <div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1"></span>
                Low stock
              </span>
            </div>
            <div>
              <button className="text-gray-400 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-[#333]">
          <div className="grid grid-cols-6 gap-4 p-4 items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center">
                <div className="bg-[#222] p-1 rounded-md mr-2">
                  <Shirt className="h-5 w-5" />
                </div>
                <span>Product Name</span>
              </div>
            </div>
            <div>Men's clothing</div>
            <div>₦40,000.00</div>
            <div>300</div>
            <div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1"></span>
                Sold out
              </span>
            </div>
            <div>
              <button className="text-gray-400 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 text-sm">
        <div className="text-gray-400">Result 1 - 10 of 20</div>
        <div className="flex space-x-2">
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md flex items-center">
            <span className="mr-1">Previous</span>
          </button>
          <button className="bg-purple-600 text-white px-3 py-1 rounded-md">1</button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md">2</button>
          <button className="text-gray-400 px-3 py-1">...</button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md">4</button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md flex items-center">
            <span className="mr-1">Next</span>
          </button>
        </div>
      </div>
    </div>
  )
}
