"use client";

import { useState } from "react";
import {
   User,
   Store,
   CreditCard,
   Bell,
   Shield,
   HelpCircle,
} from "lucide-react";
import { useSellerProfile } from "@/modules/sellers";
import { LoadingState } from "@/components/sellers/LoadingState";
import { ProfileAccount } from "./components/ProfileAccount";
import { StoreAccount } from "./components/StoreAccount";
import { PaymentAccount } from "./components/PaymentAccount";

export default function Account() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { data: profileData, isLoading } = useSellerProfile();

  if (isLoading) {
    return <LoadingState message="Loading account..." />;
  }

  return (
    <div className="pt-16 lg:pt-0 p-6">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Account</h1>
          <p className="text-gray-400 mt-1">
            Manage your account and store Account
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-64 md:pr-8 mb-6 md:mb-0">
          <div className="space-y-1">
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeTab === "Profile"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a]"
              }`}
              onClick={() => setActiveTab("Profile")}>
              <User className="h-5 w-5 mr-3" />
              <span>Profile</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeTab === "Store"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a]"
              }`}
              onClick={() => setActiveTab("Store")}>
              <Store className="h-5 w-5 mr-3" />
              <span>Store</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeTab === "Payment"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a]"
              }`}
              onClick={() => setActiveTab("Payment")}>
              <CreditCard className="h-5 w-5 mr-3" />
              <span>Payment</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "Profile" && <ProfileAccount initialData={profileData} />}
          {activeTab === "Store" && <StoreAccount initialData={profileData} />}
          {activeTab === "Payment" && <PaymentAccount initialData={profileData} />}
        </div>
      </div>
    </div>
  );
}