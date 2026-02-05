"use client";

import { useDashboardData } from "@/modules/sellers";
import { defaultDashboardData } from "./dashboardDataStats";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export function RevenueReport() {
  const [timeframe, setTimeframe] = useState("Month");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: dashboardData } = useDashboardData();
  const displayData = (dashboardData || defaultDashboardData) as typeof defaultDashboardData;
  const { revenueReport } = displayData;

  const timeframeOptions = ["Month", "Quarter", "Year"];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const maxIncome = Math.max(...revenueReport.map((r) => r.income), 1);
  const step = maxIncome / 10;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border-2 border-l-4 border-l-[#6B7280] bg-gradient-to-br from-[#6B7280]/10 via-transparent to-[#E5E7EB]/5 border-[#6B7280]/40">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6B7280] to-[#E5E7EB]">Revenue Report</h3>
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-gradient-to-r from-[#6B7280] to-[#E5E7EB] rounded-full mr-2"></div>
            <span className="text-sm text-gray-400">Income</span>
          </div>
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              className="bg-[#222] border-[#9CA3AF]/40 text-white hover:bg-[#9CA3AF]/20 hover:border-[#9CA3AF]/60"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {timeframe}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`ml-2 transform transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-[#222] border border-[#9CA3AF]/40 rounded-lg shadow-lg z-10">
                {timeframeOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setTimeframe(option);
                      setIsDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      timeframe === option
                        ? "bg-gradient-to-r from-[#6B7280] to-[#E5E7EB] text-white"
                        : "text-gray-400 hover:bg-[#9CA3AF]/20 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-64 relative">
        <div className="absolute inset-0 flex items-end">
          {revenueReport.map((item, index) => {
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-6 bg-gradient-to-t from-[#6B7280] via-[#E5E7EB] to-[#E5E7EB] rounded-t hover:shadow-lg hover:shadow-[#6B7280]/40 transition-all"
                  style={{
                    height:
                      maxIncome > 0
                        ? `${(item.income / maxIncome) * 100}%`
                        : "0%",
                  }}
                ></div>
                <span className="text-xs text-gray-400 mt-2">{item.month}</span>
              </div>
            );
          })}
        </div>
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-right pr-2">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="text-xs text-gray-400">
              {Math.round(maxIncome - i * step).toLocaleString()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}