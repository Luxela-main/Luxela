"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import withAuth from "@/functions/hoc/withAuth";
import SearchBar from "@/components/search-bar";
import { useDashboardData } from "@/modules/sellers";
import { defaultDashboardData } from "./dashboardDataStats";
import { DashboardSummary } from "./summary";
import { RevenueReport } from "./RevenueReport";
import { VisitorTraffic } from "./VisitorTraffic";
import { TopSellingProducts } from "./TopSellingProducts";

function Dashboard() {
  const [search, setSearch] = useState("");
  const { data: dashboardData } = useDashboardData();
  const displayData = (dashboardData || defaultDashboardData) as typeof defaultDashboardData;

  return (
    <div className="px-6 mt-4 md:mt-0">
      <div className="mb-6 flex justify-end">
        <div className="w-60 lg:w-80">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>

      <div className="mb-6 md:max-lg:pt-10">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Monitor your sales, track payouts, and manage your listings—all in one place
        </p>
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