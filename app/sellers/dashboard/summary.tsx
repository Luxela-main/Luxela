import { Wallet, ShoppingBag, Package, RefreshCcw } from "lucide-react";
import { StatCard } from "./statCard";
import { defaultDashboardData } from "./dashboardDataStats";
import { useDashboardData } from "@/modules/sellers";

export const DashboardSummary = () => {
  const { data: dashboardData } = useDashboardData();
  const displayData = (dashboardData || defaultDashboardData) as typeof defaultDashboardData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Total Revenue"
        value={displayData.stats.totalRevenue.value}
        change={displayData.stats.totalRevenue.change}
        changeType={displayData.stats.totalRevenue.changeType}
        subtext={displayData.stats.totalRevenue.subtext}
        icon={<Wallet className="h-5 w-5" />}
      />
      <StatCard
        title="Total Sales"
        value={displayData.stats.totalSales.value}
        change={displayData.stats.totalSales.change}
        changeType={displayData.stats.totalSales.changeType}
        subtext={displayData.stats.totalSales.subtext}
        icon={<ShoppingBag className="h-5 w-5" />}
      />
      <StatCard
        title="Total Orders"
        value={displayData.stats.totalOrders.value}
        change={displayData.stats.totalOrders.change}
        changeType={displayData.stats.totalOrders.changeType}
        subtext={displayData.stats.totalOrders.subtext}
        icon={<Package className="h-5 w-5" />}
      />
      <StatCard
        title="Refunded"
        value={displayData.stats.refunded.value}
        change={displayData.stats.refunded.change}
        changeType={displayData.stats.refunded.changeType}
        subtext={displayData.stats.refunded.subtext}
        icon={<RefreshCcw className="h-5 w-5" />}
      />
    </div>
  );
};