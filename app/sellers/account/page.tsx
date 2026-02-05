"use client";

import { useState } from "react";
import {
   User,
   Store,
   CreditCard,
   Bell,
   Shield,
   HelpCircle,
   Truck,
} from "lucide-react";
import { useSellerProfile } from "@/modules/sellers";
import { LoadingState } from "@/components/sellers/LoadingState";
import { ProfileAccount } from "./components/ProfileAccount";
import { StoreAccount } from "./components/StoreAccount";
import { PaymentAccount } from "./components/PaymentAccount";
import { ShippingAccount } from "./components/ShippingAccount";

export default function Account() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { data: profileData, isLoading, error } = useSellerProfile();

  if (isLoading) {
    return <LoadingState message="Loading account..." />;
  }

  if (error) {
    return (
      <div className="pt-16 lg:pt-0 p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Profile</h2>
          <p className="text-gray-400 mb-4">{error?.message || "Failed to load your profile data. Please try refreshing the page."}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.seller) {
    return (
      <div className="pt-16 lg:pt-0 p-6">
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-400 mb-2">Profile Not Found</h2>
          <p className="text-gray-400">Your profile data could not be loaded. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0 p-6">
      <div className="flex items-center mb-6 pb-4 border-b-2 border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-semibold text-[#E5E7EB]">My Account</h1>
          <p className="text-gray-400 mt-1">
            Manage your account and store Account
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-64 md:pr-8 mb-6 md:mb-0">
          <div className="space-y-1">
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md cursor-pointer border-l-4 ${
                activeTab === "Profile"
                  ? "bg-[#1a1a1a] text-white border-[#E5E7EB]"
                  : "text-gray-400 hover:bg-[#1a1a1a] border-transparent hover:border-[#6B7280]"
              }`}
              onClick={() => setActiveTab("Profile")}>
              <User className="h-5 w-5 mr-3" />
              <span>Profile</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md cursor-pointer border-l-4 ${
                activeTab === "Store"
                  ? "bg-[#1a1a1a] text-white border-[#6B7280]"
                  : "text-gray-400 hover:bg-[#1a1a1a] border-transparent hover:border-[#D1D5DB]"
              }`}
              onClick={() => setActiveTab("Store")}>
              <Store className="h-5 w-5 mr-3" />
              <span>Store</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md cursor-pointer border-l-4 ${
                activeTab === "Shipping"
                  ? "bg-[#1a1a1a] text-white border-[#9CA3AF]"
                  : "text-gray-400 hover:bg-[#1a1a1a] border-transparent hover:border-[#E5E7EB]"
              }`}
              onClick={() => setActiveTab("Shipping")}>
              <Truck className="h-5 w-5 mr-3" />
              <span>Shipping</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md cursor-pointer border-l-4 ${
                activeTab === "Payment"
                  ? "bg-[#1a1a1a] text-white border-[#D1D5DB]"
                  : "text-gray-400 hover:bg-[#1a1a1a] border-transparent hover:border-[#9CA3AF]"
              }`}
              onClick={() => setActiveTab("Payment")}>
              <CreditCard className="h-5 w-5 mr-3" />
              <span>Payment</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[500px]">
          {activeTab === "Profile" && profileData && <ProfileAccount initialData={profileData} />}
          {activeTab === "Store" && profileData && <StoreAccount initialData={profileData} />}
          {activeTab === "Shipping" && profileData && <ShippingAccount initialData={profileData} />}
          {activeTab === "Payment" && profileData && <PaymentAccount initialData={profileData} />}
        </div>
      </div>
    </div>
  );
}