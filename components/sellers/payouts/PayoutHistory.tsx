"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Download, Filter, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePayoutHistory } from "@/modules/seller/queries";

interface PayoutHistoryProps {
  searchTerm?: string;
}

export function PayoutHistory({ searchTerm = "" }: PayoutHistoryProps) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const { data: payoutHistory = [], isLoading } = usePayoutHistory();

  const filteredTransactions = useMemo(() => {
    return (payoutHistory || []).filter((tx) => {
      const matchesSearch = searchTerm
        ? tx.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tx as any).description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tx as any).reference?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesStatus = filterStatus === "all" || (tx as any).status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [payoutHistory, searchTerm, filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "paid_out":
        return "text-green-400 bg-green-400/10";
      case "processing":
        return "text-blue-400 bg-blue-400/10";
      case "pending":
      case "pending_payout":
        return "text-yellow-400 bg-yellow-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: "Completed",
      paid_out: "Paid Out",
      processing: "Processing",
      pending: "Pending",
      pending_payout: "Pending Payout",
      failed: "Failed",
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const downloadReport = () => {
    const csvContent = [
      ["Date", "Amount", "Status", "Type", "Description"],
      ...filteredTransactions.map((tx) => [
        tx.date,
        typeof tx.amount === "string" ? tx.amount : `₦${(tx as any).amountCents / 100}`,
        (tx as any).status,
        (tx as any).type,
        (tx as any).description,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout_history_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-300 hover:border-purple-600/50 transition-colors"
            >
              <Filter size={18} />
              <span className="text-sm">Filter</span>
              <ChevronDown size={16} />
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#121212] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                {["all", "completed", "paid_out", "pending", "processing", "failed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      filterStatus === status
                        ? "bg-purple-600/20 text-purple-400"
                        : "text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    {status === "all" ? "All Transactions" : getStatusLabel(status)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={downloadReport}
          variant="outline"
          className="gap-2 border-[#2a2a2a] hover:border-purple-600/50"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Download Report</span>
        </Button>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#0a0a0a]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader size={20} className="animate-spin" />
                      <p className="text-gray-400">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-[#2a2a2a] hover:bg-[#121212] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{transaction.id}</p>
                        <p className="text-xs text-gray-500">{(transaction as any).description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(transaction.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">
                        ₦{typeof transaction.amount === "string" ? transaction.amount : `${((transaction as any).amountCents / 100).toLocaleString()}`}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 capitalize">
                      {(transaction as any).type}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          (transaction as any).status
                        )}`}
                      >
                        {getStatusLabel((transaction as any).status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-400">No transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Total Transactions</p>
          <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Total Amount</p>
          <p className="text-2xl font-bold text-green-400">
            ₦{filteredTransactions
              .reduce((sum, tx) => sum + (typeof tx.amount === "string" ? parseFloat(tx.amount) : (tx as any).amountCents / 100), 0)
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Completion Rate</p>
          <p className="text-2xl font-bold text-blue-400">
            {filteredTransactions.length > 0
              ? Math.round(
                  (filteredTransactions.filter(
                    (t) => (t as any).status === "completed" || (t as any).status === "paid_out"
                  ).length /
                    filteredTransactions.length) *
                    100
                )
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  );
}