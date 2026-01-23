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
      <h1 className="text-white text-2xl font-semibold mb-8">
        Account Overview
      </h1>

      {/* Content */}
      <div className="space-y-6 max-w-4xl">
        <AccountDetails />
        <BillingAddress />
      </div>
    </div>
  );
}

// Wrap the Dashboard component with withAuth before exporting
export default withAuth(Dashboard);