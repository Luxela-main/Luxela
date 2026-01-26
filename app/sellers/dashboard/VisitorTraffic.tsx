"use client";

import { useDashboardData } from "@/modules/sellers";
import { defaultDashboardData } from "./dashboardDataStats";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function VisitorTraffic() {
  const [visitorTimeframe, setVisitorTimeframe] = useState("Month");
  const { data: dashboardData } = useDashboardData();
  const displayData = (dashboardData || defaultDashboardData) as typeof defaultDashboardData;
  const { visitorTraffic } = displayData;

  const colors = ["bg-blue-500", "bg-[#B8A179]", "bg-gray-400", "bg-pink-200"];
  const strokeColors = ["#3B82F6", "#B8A179", "#9CA3AF", "#FFC0CB"];

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Visitors Traffic</h3>
        <Button
          variant="outline"
          className="bg-[#222] border-[#333] text-white hover:bg-[#333] hover:text-white"
        >
          {visitorTimeframe}
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
      <div className="flex justify-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#333"
              strokeWidth="20"
              strokeDasharray="251.2"
              strokeDashoffset="0"
            />
             <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 30) / 100}
                  transform="rotate(-90 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#B8A179"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 40) / 100}
                  transform="rotate(30 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#9CA3AF"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 20) / 100}
                  transform="rotate(174 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#FFC0CB"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 10) / 100}
                  transform="rotate(246 50 50)"
                />
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {visitorTraffic.map((item, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                colors[index % colors.length]
              }`}
            ></div>
            <span className="text-sm text-gray-400">
              {item.source} <span className="ml-1">{item.percentage}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}