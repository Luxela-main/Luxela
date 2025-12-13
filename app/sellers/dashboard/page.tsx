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

  const { data: dashboardData, isLoading } = useDashboardData();

  const displayData = dashboardData || defaultDashboardData;

  // if (isLoading) {
  //   return <LoadingState message="Loading dashboard data..." />;
  // }

  return (
    <div className="pt-16 px-6 md:pt-0">
      <div className="mb-6">
        <div className="w-60 z-10 lg:w-80 max-lg:fixed max-md:right-10 max-lg:right-12 max-lg:top-[18px] lg:ml-auto">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>
      <div className="mb-6 md:max-lg:pt-10">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Monitor your sales, track payouts, and manage your listings—all in
            one place
          </p>
        </div>
      </div>
      <DashboardSummary />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueReport />
        <VisitorTraffic />
      </div>
      <TopSellingProducts products={displayData.topSellingProducts} />
    </div>
  );
}

export default withAuth(Dashboard);
