"use client";
export const dynamic = "force-dynamic";

import React from "react";
import withAuth from "../../../../functions/hoc/withAuth";
import { AccountDetails } from "@/components/buyer/dashboard/account-details";
import { BillingAddress } from "@/components/buyer/dashboard/billing-address";
import { Breadcrumb } from "@/components/buyer/dashboard/breadcrumb";

function AccountPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/buyer/dashboard" }, { label: "Account" }]} />

      {/* Page Title */}
      <div className="mb-8 pb-6 border-b-2 border-[#E5E7EB]">
        <h1 className="text-white text-2xl font-semibold mb-2">
          Account Settings
        </h1>
        <p className="text-[#6B7280] text-sm font-medium">Manage your account details and billing information</p>
      </div>

      {/* Content */}
      <div className="space-y-6 max-w-4xl">
        <div className="border-l-4 border-[#E5E7EB] bg-gradient-to-r from-[#E5E7EB]/5 to-transparent rounded-lg">
          <AccountDetails />
        </div>
        <div className="border-l-4 border-[#E5E7EB] bg-gradient-to-r from-[#E5E7EB]/5 to-transparent rounded-lg">
          <BillingAddress />
        </div>
      </div>
    </div>
  );
}

// Wrap the AccountPage component with withAuth before exporting
export default withAuth(AccountPage);