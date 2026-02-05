"use client";

import { useDashboardData } from "@/modules/sellers";
import { defaultDashboardData } from "./dashboardDataStats";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export function VisitorTraffic() {
  const [visitorTimeframe, setVisitorTimeframe] = useState("Month");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: dashboardData } = useDashboardData();
  const displayData = (dashboardData || defaultDashboardData) as typeof defaultDashboardData;
  const { visitorTraffic } = displayData;

  const timeframeOptions = ["Month", "Quarter", "Year"];
  const colors = ["bg-[#E5E7EB]", "bg-[#6B7280]", "bg-[#9CA3AF]", "bg-[#E5E7EB]"];
  const strokeColors = ["#E5E7EB", "#6B7280", "#9CA3AF", "#E5E7EB"];

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

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border-2 border-l-4 border-l-[#9CA3AF] bg-gradient-to-br from-[#9CA3AF]/10 via-transparent border-[#9CA3AF]/40">
      <div className="flex justify-between items-center mb-4 border-b border-[#9CA3AF]/20 pb-4">
        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#9CA3AF] to-[#E5E7EB]">Visitors Traffic</h3>
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            className="bg-[#222] border-[#333] text-white hover:bg-[#333] hover:text-white"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {visitorTimeframe}
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
            <div className="absolute top-full right-0 mt-2 w-32 bg-[#222] border border-[#333] rounded-lg shadow-lg z-10">
              {timeframeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setVisitorTimeframe(option);
                    setIsDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    visitorTimeframe === option
                      ? "bg-blue-500 text-white"
                      : "text-gray-400 hover:bg-[#333] hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
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