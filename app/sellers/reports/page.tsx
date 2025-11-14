"use client"

import { useState } from "react"
import { BarChart3 } from "lucide-react"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"

export default function Reports() {
  const [search, setSearch] = useState("");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-gray-400 mt-1">View detailed reports and analytics for your store.</p>
        </div>
        <div className="w-80">
          <SearchBar search={search} setSearch={setSearch}/>
        </div>
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
