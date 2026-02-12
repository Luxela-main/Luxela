"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { PayoutStats } from "@/components/sellers/payouts/PayoutStats";
import { PayoutHistory } from "@/components/sellers/payouts/PayoutHistory";
import { PayoutMethods } from "@/components/sellers/payouts/PayoutMethods";
import { SchedulePayoutModal } from "@/components/sellers/payouts/SchedulePayoutModal";
import { LoadingState } from "@/components/sellers/LoadingState";
import { ErrorState } from "@/components/sellers/ErrorState";
import { usePayoutStats, usePayoutHistory } from "@/modules/seller/queries";

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  const { data: payoutStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = usePayoutStats();
  const { data: payoutHistory, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = usePayoutHistory();
  
  const isLoading = statsLoading || historyLoading;
  const error = (statsError as any)?.message || (historyError as any)?.message;

  const handleRetry = () => {
    refetchStats?.();
    refetchHistory?.();
    window.location.reload();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (isLoading) {
    return <LoadingState message="Loading payout data..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error || 'Failed to load payout data'}
        onRetry={handleRetry}
      />
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "history", label: "History", icon: "📜" },
    { id: "methods", label: "Payout Methods", icon: "💳" },
  ];

  return (
    <div className="relative">
      {}
      <div className="mb-8 mt-12 md:mt-0 pb-6 border-b-2 border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Payouts</h1>
            <p className="text-[#6B7280] mt-2 font-medium">Manage your earnings and payout settings</p>
          </div>
          <div className="w-full md:w-auto flex gap-3">
            <div className="w-full md:w-60 lg:w-80">
              <SearchBar search={search} setSearch={setSearch} />
            </div>
            <Button
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap cursor-pointer"
            >
              Schedule Payout
            </Button>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a1a1a] border-l-4 border-l-[#E5E7EB] rounded-lg p-6 hover:border-l-[#6B7280] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Available Balance</p>
              <p className="text-2xl font-bold text-white mt-2">₦{((payoutStats as any)?.availableBalance || 0).toLocaleString()}</p>
            </div>
            <div className="bg-purple-600/20 p-3 rounded-lg">
              <DollarSign className="text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border-l-4 border-l-[#E5E7EB] rounded-lg p-6 hover:border-l-[#9CA3AF] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Paid Out</p>
              <p className="text-2xl font-bold text-white mt-2">₦{((payoutStats as any)?.totalPaidOut || 0).toLocaleString()}</p>
            </div>
            <div className="bg-green-600/20 p-3 rounded-lg">
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border-l-4 border-l-[#E5E7EB] rounded-lg p-6 hover:border-l-[#6B7280] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Pending Payouts</p>
              <p className="text-2xl font-bold text-white mt-2">₦{((payoutStats as any)?.pendingPayouts || 0).toLocaleString()}</p>
            </div>
            <div className="bg-blue-600/20 p-3 rounded-lg">
              <Clock className="text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border-l-4 border-l-[#E5E7EB] rounded-lg p-6 hover:border-l-[#6B7280] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Monthly Growth</p>
              <p className="text-2xl font-bold text-white mt-2">+{((payoutStats as any)?.monthlyGrowthPercentage || 0).toFixed(1)}%</p>
            </div>
            <div className="bg-orange-600/20 p-3 rounded-lg">
              <TrendingUp className="text-orange-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="border-b border-[#2a2a2a] mb-6">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? "border-purple-600 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {}
      <div>
        {activeTab === "overview" && <PayoutStats />}
        {activeTab === "history" && <PayoutHistory searchTerm={search} />}
        {activeTab === "methods" && <PayoutMethods />}
      </div>

      {}
      {isScheduleModalOpen && (
        <SchedulePayoutModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
        />
      )}
    </div>
  );
}