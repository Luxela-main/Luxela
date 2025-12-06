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
import { ProfileSettings } from "./components/ProfileSettings";
import { StoreSettings } from "./components/StoreSettings";
import { PaymentSettings } from "./components/PaymentSettings";
import { NotificationSettings } from "./components/NotificationSettings";
import { SecuritySettings } from "./components/SecuritySettings";
import { HelpSettings } from "./components/HelpSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { data: profileData, isLoading } = useSellerProfile();

  if (isLoading) {
    return <LoadingState message="Loading settings..." />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-gray-400 mt-1">
            Manage your account and store settings
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
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeTab === "Notifications"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a]"
              }`}
              onClick={() => setActiveTab("Notifications")}>
              <Bell className="h-5 w-5 mr-3" />
              <span>Notifications</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeTab === "Security"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a]"
              }`}
              onClick={() => setActiveTab("Security")}>
              <Shield className="h-5 w-5 mr-3" />
              <span>Security</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${
                activeTab === "Help"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-400 hover:bg-[#1a1a1a]"
              }`}
              onClick={() => setActiveTab("Help")}>
              <HelpCircle className="h-5 w-5 mr-3" />
              <span>Help</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "Profile" && <ProfileSettings initialData={profileData} />}
          {activeTab === "Store" && <StoreSettings initialData={profileData} />}
          {activeTab === "Payment" && <PaymentSettings initialData={profileData} />}
          {activeTab === "Notifications" && <NotificationSettings />}
          {activeTab === "Security" && <SecuritySettings />}
          {activeTab === "Help" && <HelpSettings />}
        </div>
      </div>
    </div>
  );
}
