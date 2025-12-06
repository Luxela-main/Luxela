"use client"

import { useState } from "react"
import { Package, Filter, PlusCircle } from "lucide-react"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"
import { useMyListings } from "@/modules/sellers"
import { LoadingState } from "@/components/sellers/LoadingState"
import { ErrorState } from "@/components/sellers/ErrorState"

export default function MyListings() {
    const [search, setSearch] = useState("");

    // TanStack Query hook for listings data
    const { 
      data: listings, 
      isLoading, 
      error, 
      refetch 
    } = useMyListings();

    // Show loading state
    if (isLoading) {
      return <LoadingState message="Loading your listings..." />;
    }

    // Show error state
    if (error) {
      return (
        <ErrorState 
          message="Failed to load listings. Please try again."
          onRetry={() => refetch()}
        />
      );
    }

    const filteredListings = listings?.filter((listing: any) => 
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.category?.toLowerCase().includes(search.toLowerCase())
    ) || [];

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

        {filteredListings.length === 0 ? (
          <EmptyState
            icon={<Package className="h-16 w-16" />}
            title="Your Listing is currently empty"
            description="once you start add products, your products will show up here."
          />
        ) : (
          filteredListings.map((listing: any, index: number) => (
            <div key={listing.id} className="border-b border-[#333]">
              <div className="grid grid-cols-6 gap-4 p-4 items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex items-center">
                    <div className="bg-[#222] p-1 rounded-md mr-2">
                      <Package className="h-5 w-5" />
                    </div>
                    <span>{listing.title}</span>
                  </div>
                </div>
                <div>{listing.category || 'Unknown'}</div>
                <div>₦{((listing.priceCents || 0) / 100).toLocaleString()}</div>
                <div>{listing.quantityAvailable || 0}</div>
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (listing.quantityAvailable || 0) > 10
                        ? "bg-green-100 text-green-800"
                        : (listing.quantityAvailable || 0) > 0
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                    {(listing.quantityAvailable || 0) > 10
                      ? "In stock"
                      : (listing.quantityAvailable || 0) > 0
                      ? "Low stock"
                      : "Sold out"}
                  </span>
                </div>
                <div>
                  <button className="bg-transparent border-[#333] hover:bg-[#222] hover:text-white text-sm px-3 py-1 rounded">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
