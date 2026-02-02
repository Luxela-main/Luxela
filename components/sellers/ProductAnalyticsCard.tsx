"use client";

import React from "react";
import { Eye, ShoppingCart, Zap, TrendingUp } from "lucide-react";

interface ProductAnalyticsCardProps {
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  trend: "up" | "down" | "stable";
}

export const ProductAnalyticsCard: React.FC<ProductAnalyticsCardProps> = ({
  views,
  clicks,
  conversions,
  conversionRate,
  trend,
}) => {
  const getTrendColor = (t: string) => {
    if (t === "up") return "text-green-500";
    if (t === "down") return "text-red-500";
    return "text-gray-500";
  };

  const getTrendIcon = (t: string) => {
    if (t === "up") return "↑";
    if (t === "down") return "↓";
    return "→";
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-lg border border-[#222] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Performance</h3>
        <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
          <span className="text-lg font-bold">{getTrendIcon(trend)}</span>
          <span className="text-xs font-semibold">
            {trend === "up" ? "Growing" : trend === "down" ? "Declining" : "Stable"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Views */}
        <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222]">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-400">Views</span>
          </div>
          <p className="text-xl font-bold text-white">{views.toLocaleString()}</p>
        </div>

        {/* Clicks */}
        <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222]">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-400">Clicks</span>
          </div>
          <p className="text-xl font-bold text-white">{clicks.toLocaleString()}</p>
        </div>

        {/* Conversions */}
        <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222]">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-400">Sales</span>
          </div>
          <p className="text-xl font-bold text-white">
            {conversions.toLocaleString()}
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-400">Conv. Rate</span>
          </div>
          <p className="text-xl font-bold text-purple-500">
            {conversionRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Conversion Visualization */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">Conversion Funnel</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">Views</span>
            <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500/60 w-full" />
            </div>
            <span className="text-xs text-gray-400 w-8">{views}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">Clicks</span>
            <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500/60"
                style={{
                  width: views > 0 ? `${(clicks / views) * 100}%` : "0%",
                }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8">
              {views > 0 ? `${((clicks / views) * 100).toFixed(0)}%` : "0%"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">Sales</span>
            <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500/60"
                style={{
                  width: clicks > 0 ? `${(conversions / clicks) * 100}%` : "0%",
                }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8">
              {clicks > 0 ? `${((conversions / clicks) * 100).toFixed(0)}%` : "0%"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalyticsCard;