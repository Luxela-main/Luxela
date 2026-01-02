"use client";

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
  const router = useRouter();

  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch("/api/profile/check");
        const data = await res.json();

        if (data.role === "seller") {
          if (data.profileExists === false) {
            router.push("/sellersAccountSetup");
            return;
          }
        }

        // allow render
        setCheckingProfile(false);
      } catch (e) {
        console.error("Profile check failed:", e);
        setCheckingProfile(false);
      }
    }

    checkProfile();
  }, []);

  if (checkingProfile) return null;

  const [search, setSearch] = useState("");
  const { data: dashboardData } = useDashboardData();

  const displayData = dashboardData || defaultDashboardData;

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

export default withAuth(Dashboard);
