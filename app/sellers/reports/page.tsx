"use client"

import { useState } from "react"
import { BarChart3 } from "lucide-react"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"

export default function Reports() {
  const [search, setSearch] = useState("");

  return (
     <div className="pt-16 px-2 lg:px-6 md:pt-0">
      <div className="mb-6">
        <div className="w-60 z-10 lg:w-80 max-lg:fixed max-md:right-6 max-lg:right-12 max-lg:top-[18px] lg:ml-auto">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>
      <div className="mb-6 md:max-lg:pt-10">
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-gray-400 mt-1">View detailed reports and analytics for your store.</p>
        </div>
     

      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#333] flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          <span className="font-medium">Sales Reports</span>
        </div>

        <EmptyState
          icon={<BarChart3 className="h-16 w-16" />}
          title="No reports available yet"
          description="Once you start making sales, detailed reports will be generated here."
        />
      </div>
    </div>
  )
}
