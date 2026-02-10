"use client";
export const dynamic = "force-dynamic";

import React from "react";
import withAuth from "../../../functions/hoc/withAuth";
import { Breadcrumb } from "@/components/buyer/dashboard/breadcrumb";
import { DashboardMetrics } from "@/modules/buyer/components";

function Dashboard() {
  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Dashboard" }]} />

      {/* Page Title */}
      <div className="mb-8 pb-6 border-b-2 border-[#E5E7EB]">
        <h1 className="text-white text-2xl font-semibold mb-2">
          Dashboard
        </h1>
        <p className="text-[#6B7280] text-sm font-medium">Track your orders, spending, and account activity</p>
      </div>

      {/* Dashboard Metrics */}
      <div className="mb-8">
        <DashboardMetrics />
      </div>
    </div>
  );
}

// Wrap the Dashboard component with withAuth before exporting
export default withAuth(Dashboard);