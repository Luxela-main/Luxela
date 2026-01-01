"use client";

import withAuth from "@/functions/hoc/withAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { useDashboardData } from "@/modules/sellers";
import { defaultDashboardData } from "./dashboardDataStats";
import { DashboardSummary } from "./summary";
import { RevenueReport } from "./RevenueReport";
import { VisitorTraffic } from "./VisitorTraffic";
import { TopSellingProducts } from "./TopSellingProducts";

function Dashboard() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const { data: dashboardData } = useDashboardData();
  const displayData = dashboardData || defaultDashboardData;

  useEffect(() => {
    const checkSellerSetup = async () => {
      try {
        const res = await fetch("/api/profile/check", { method: "GET" });

        if (!res.ok) return;
        const result = await res.json();

        // If seller has not completed setup, redirect
        if (result?.role === "seller" && result?.setupComplete === false) {
          router.push("/sellersAccountSetup");
        }
      } catch (_) {
      }
    };

    checkSellerSetup();
  }, [router]);

  return (
    <div className="pt-16 px-6 md:pt-0">
      <div className="mb-6">
        <div className="w-60 z-10 lg:w-80 max-lg:fixed max-md:right-10 max-lg:right-12 max-lg:top-[18px] lg:ml-auto">
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

export default withAuth(Dashboard)
