"use client";

import withAuth from "@/functions/hoc/withAuth";
import { useState } from "react";
import SearchBar from "@/components/search-bar";
import { useDashboardData } from "@/modules/sellers";
import { LoadingState } from "@/components/sellers/LoadingState";
import { defaultDashboardData } from "./dashboardDataStats";
import { DashboardSummary } from "./summary";
import { RevenueReport } from "./RevenueReport";
import { VisitorTraffic } from "./VisitorTraffic";
import { TopSellingProducts } from "./TopSellingProducts";

function Dashboard() {
  const [search, setSearch] = useState("");

  const { 
    data: dashboardData, 
    isLoading, 
  } = useDashboardData();

  const displayData = dashboardData || defaultDashboardData;

  // if (isLoading) {
  //   return <LoadingState message="Loading dashboard data..." />;
  // }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Monitor your sales, track payouts, and manage your listings—all in
            one place
          </p>
        </div>
        <div className="w-80">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>
      <DashboardSummary/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueReport />
        <VisitorTraffic />
      </div>
      <TopSellingProducts products={displayData.topSellingProducts} />
    </div>
  );
}

export default withAuth(Dashboard);
