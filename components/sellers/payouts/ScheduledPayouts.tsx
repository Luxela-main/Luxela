"use client";

import { trpc } from "@/app/_trpc/client";
import { Calendar, DollarSign, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScheduledPayouts() {
  const { data: payouts, isLoading, refetch } = trpc.finance.scheduledPayoutsGet.useQuery();
  const { mutate: cancelPayout } = trpc.finance.scheduledPayoutCancel.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Scheduled Payouts</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  if (!payouts || payouts.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Scheduled Payouts</h3>
        <p className="text-gray-400 text-center py-8">No scheduled payouts yet</p>
      </div>
    );
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getScheduleLabel = (schedule: string) => {
    const labels: Record<string, string> = {
      immediate: "Immediate",
      daily: "Daily",
      weekly: "Weekly",
      bi_weekly: "Bi-weekly",
      monthly: "Monthly",
    };
    return labels[schedule] || schedule;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
      case "processing":
        return "bg-blue-600/20 text-blue-400 border-blue-600/30";
      case "completed":
        return "bg-green-600/20 text-green-400 border-green-600/30";
      case "failed":
        return "bg-red-600/20 text-red-400 border-red-600/30";
      default:
        return "bg-gray-600/20 text-gray-400 border-gray-600/30";
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
      <div className="p-6 border-b border-[#2a2a2a]">
        <h3 className="text-lg font-semibold text-white">Scheduled Payouts</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0a0a0a]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Next Run
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {payouts.map((payout: any) => (
              <tr key={payout.id} className="hover:bg-[#0a0a0a] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-gray-400" />
                    <span className="text-white font-medium">
                      ₦{(payout.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-300">{getScheduleLabel(payout.schedule)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar size={16} />
                    {formatDate(payout.nextScheduledAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      payout.status
                    )}`}
                  >
                    {payout.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {payout.status === "pending" && (
                    <Button
                      onClick={() => cancelPayout({ payoutId: payout.id })}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-600/10"
                    >
                      <X size={18} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}