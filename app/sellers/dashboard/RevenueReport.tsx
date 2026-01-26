"use client";

import { useDashboardData } from "@/modules/sellers";
import { defaultDashboardData } from "./dashboardDataStats";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function RevenueReport() {
  const [timeframe, setTimeframe] = useState("Month");
  const { data: dashboardData } = useDashboardData();
  const displayData = (dashboardData || defaultDashboardData) as typeof defaultDashboardData;
  const { revenueReport } = displayData;

  const maxIncome = Math.max(...revenueReport.map((r) => r.income), 1);
  const step = maxIncome / 10;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Revenue Report</h3>
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-400">Income</span>
          </div>
          <Button
            variant="outline"
            className="bg-[#222] border-[#333] text-white hover:bg-[#333] hover:text-white"
          >
            {timeframe}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
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
        </div>
      </div>
      <div className="h-64 relative">
        <div className="absolute inset-0 flex items-end">
          {revenueReport.map((item, index) => {
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-6 bg-blue-500 rounded-t"
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