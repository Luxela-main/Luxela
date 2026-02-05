"use client";
export const dynamic = "force-dynamic";

import React from "react";
import withAuth from "../../../functions/hoc/withAuth";
import { AccountDetails } from "@/components/buyer/dashboard/account-details";
import { BillingAddress } from "@/components/buyer/dashboard/billing-address";
import { Breadcrumb } from "@/components/buyer/dashboard/breadcrumb";

function Dashboard() {
  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My Account" }]} />

      {/* Page Title */}
      <div className="mb-8 pb-6 border-b-2 border-[#ECBEE3]">
        <h1 className="text-white text-2xl font-semibold mb-2">
          Account Overview
        </h1>
        <p className="text-[#EA795B] text-sm font-medium">Manage your account settings and preferences</p>
      </div>

      {/* Content */}
      <div className="space-y-6 max-w-4xl">
        <div className="border-l-4 border-[#ECBEE3] bg-gradient-to-r from-[#ECBEE3]/5 to-transparent rounded-lg">
          <AccountDetails />
        </div>
        <div className="border-l-4 border-[#BEE3EC] bg-gradient-to-r from-[#BEE3EC]/5 to-transparent rounded-lg">
          <BillingAddress />
        </div>
      </div>
    </div>
  );
}

// Wrap the Dashboard component with withAuth before exporting
export default withAuth(Dashboard);