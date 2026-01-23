"use client";

import { useState } from "react";
import { ChevronDown, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PayoutHistoryProps {
  searchTerm?: string;
}

export function PayoutHistory({ searchTerm = "" }: PayoutHistoryProps) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const transactions = [
    {
      id: "PAY-001",
      date: "2024-01-15",
      amount: "₦50,000",
      status: "completed",
      method: "Bank Transfer",
      description: "Monthly Payout - January",
      reference: "TXN20240115001",
    },
    {
      id: "PAY-002",
      date: "2024-01-08",
      amount: "₦75,500",
      status: "completed",
      method: "PayPal",
      description: "Weekly Payout",
      reference: "TXN20240108001",
    },
    {
      id: "PAY-003",
      date: "2024-01-05",
      amount: "₦32,000",
      status: "processing",
      method: "Bank Transfer",
      description: "Payout Request #152",
      reference: "TXN20240105001",
    },
    {
      id: "PAY-004",
      date: "2024-01-01",
      amount: "₦45,000",
      status: "completed",
      method: "Cryptocurrency (USDT)",
      description: "Crypto Withdrawal",
      reference: "TXN20240101001",
    },
    {
      id: "PAY-005",
      date: "2023-12-28",
      amount: "₦120,000",
      status: "completed",
      method: "Bank Transfer",
      description: "Monthly Payout - December",
      reference: "TXN20231228001",
    },
    {
      id: "PAY-006",
      date: "2023-12-20",
      amount: "₦55,000",
      status: "failed",
      method: "PayPal",
      description: "Failed Transfer",
      reference: "TXN20231220001",
    },
    {
      id: "PAY-007",
      date: "2023-12-15",
      amount: "₦88,500",
      status: "completed",
      method: "Bank Transfer",
      description: "Weekly Payout",
      reference: "TXN20231215001",
    },
    {
      id: "PAY-008",
      date: "2023-12-10",
      amount: "₦42,000",
      status: "pending",
      method: "Bank Transfer",
      description: "Pending Payout",
      reference: "TXN20231210001",
    },
  ];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = searchTerm
      ? tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-400/10";
      case "processing":
        return "text-blue-400 bg-blue-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const downloadReport = () => {
    alert("Downloading payout report...");
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
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
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    filterStatus === "all"
                      ? "bg-purple-600/20 text-purple-400"
                      : "text-gray-300 hover:bg-[#1a1a1a]"
                  }`}
                >
                  All Transactions
                </button>
                <button
                  onClick={() => {
                    setFilterStatus("completed");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    filterStatus === "completed"
                      ? "bg-green-600/20 text-green-400"
                      : "text-gray-300 hover:bg-[#1a1a1a]"
                  }`}
                >
                  ✓ Completed
                </button>
                <button
                  onClick={() => {
                    setFilterStatus("processing");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    filterStatus === "processing"
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-300 hover:bg-[#1a1a1a]"
                  }`}
                >
                  ⏳ Processing
                </button>
                <button
                  onClick={() => {
                    setFilterStatus("pending");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    filterStatus === "pending"
                      ? "bg-yellow-600/20 text-yellow-400"
                      : "text-gray-300 hover:bg-[#1a1a1a]"
                  }`}
                >
                  ⏱ Pending
                </button>
                <button
                  onClick={() => {
                    setFilterStatus("failed");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    filterStatus === "failed"
                      ? "bg-red-600/20 text-red-400"
                      : "text-gray-300 hover:bg-[#1a1a1a]"
                  }`}
                >
                  ✗ Failed
                </button>
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

      {/* Table */}
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
                  Method
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-[#2a2a2a] hover:bg-[#121212] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{transaction.id}</p>
                        <p className="text-xs text-gray-500">{transaction.description}</p>
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
                      <p className="font-semibold text-white">{transaction.amount}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {transaction.method}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {getStatusLabel(transaction.status)}
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Total Transactions</p>
          <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Total Amount</p>
          <p className="text-2xl font-bold text-green-400">
            ₦{(filteredTransactions.length * 50000).toLocaleString()}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Completion Rate</p>
          <p className="text-2xl font-bold text-blue-400">
            {Math.round(
              (filteredTransactions.filter((t) => t.status === "completed").length /
                filteredTransactions.length) *
                100
            )}
            %
          </p>
        </div>
      </div>
    </div>
  );
}