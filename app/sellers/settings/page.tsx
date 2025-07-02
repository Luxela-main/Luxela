"use client"

import { useState } from "react"
import { User, Store, CreditCard, Bell, Shield, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Profile")

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account and store settings</p>
        </div>
      </div>

      <div className="flex">
        <div className="w-64 pr-8">
          <div className="space-y-1">
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${activeTab === "Profile" ? "bg-[#1a1a1a] text-white" : "text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              onClick={() => setActiveTab("Profile")}
            >
              <User className="h-5 w-5 mr-3" />
              <span>Profile</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${activeTab === "Store" ? "bg-[#1a1a1a] text-white" : "text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              onClick={() => setActiveTab("Store")}
            >
              <Store className="h-5 w-5 mr-3" />
              <span>Store</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${activeTab === "Payment" ? "bg-[#1a1a1a] text-white" : "text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              onClick={() => setActiveTab("Payment")}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <span>Payment</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${activeTab === "Notifications" ? "bg-[#1a1a1a] text-white" : "text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              onClick={() => setActiveTab("Notifications")}
            >
              <Bell className="h-5 w-5 mr-3" />
              <span>Notifications</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${activeTab === "Security" ? "bg-[#1a1a1a] text-white" : "text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              onClick={() => setActiveTab("Security")}
            >
              <Shield className="h-5 w-5 mr-3" />
              <span>Security</span>
            </button>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-md ${activeTab === "Help" ? "bg-[#1a1a1a] text-white" : "text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              onClick={() => setActiveTab("Help")}
            >
              <HelpCircle className="h-5 w-5 mr-3" />
              <span>Help</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "Profile" && (
            <div className="bg-[#1a1a1a] rounded-lg p-6">
              <h2 className="text-xl font-medium mb-6">Profile Settings</h2>

              <div className="mb-6">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-[#222] rounded-full mr-6 flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <Button variant="outline" className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white mb-2">
                      Upload Photo
                    </Button>
                    <p className="text-xs text-gray-400">Recommended: 200x200px, Max 5MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2">First Name</label>
                    <Input
                      defaultValue="MomManor"
                      className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Last Name</label>
                    <Input
                      defaultValue="Daniel"
                      className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Email Address</label>
                  <Input
                    defaultValue="mommanor@example.com"
                    className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Phone Number</label>
                  <Input
                    defaultValue="+234 800 123 4567"
                    className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Bio</label>
                  <Textarea
                    defaultValue="Fashion designer and retailer specializing in contemporary clothing."
                    className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Store" && (
            <div className="bg-[#1a1a1a] rounded-lg p-6">
              <h2 className="text-xl font-medium mb-6">Store Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2">Store Name</label>
                  <Input
                    defaultValue="MomManor Fashion"
                    className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Store Description</label>
                  <Textarea
                    defaultValue="Contemporary fashion store offering unique designs for the modern individual."
                    className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Store Logo</label>
                  <div className="flex items-center mb-2">
                    <div className="w-16 h-16 bg-[#222] rounded-md mr-4 flex items-center justify-center">
                      <Store className="h-8 w-8 text-gray-400" />
                    </div>
                    <Button variant="outline" className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white">
                      Upload Logo
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">Recommended: 400x400px, Max 5MB</p>
                </div>

                <div>
                  <label className="block text-sm mb-2">Store Banner</label>
                  <div className="border border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-[#222] h-40">
                    <p className="text-sm text-gray-400 mb-2">Drag and drop banner image here or click to browse</p>
                    <Button variant="outline" className="bg-transparent border-[#333] hover:bg-[#333] hover:text-white">
                      Upload Banner
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Recommended: 1200x300px, Max 10MB</p>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "Profile" && activeTab !== "Store" && (
            <div className="bg-[#1a1a1a] rounded-lg p-6 flex items-center justify-center h-96">
              <p className="text-gray-400">{activeTab} settings will be available soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
