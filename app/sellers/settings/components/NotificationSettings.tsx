"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; 
import { useState } from "react";
import { toastSvc } from "@/services/toast";
import { Label } from "@/components/ui/label";

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleSave = () => {
    // Mock save
    toastSvc.success("Notification preferences updated");
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-medium mb-6">Notification Settings</h2>
      <p className="text-gray-400 mb-6">Manage how you receive updates and alerts.</p>

      <div className="space-y-6">
        <div className="flex items-center justify-between py-4 border-b border-[#333]">
          <div>
            <h3 className="font-medium text-white">Email Notifications</h3>
            <p className="text-sm text-gray-400">Receive emails about new orders and payouts.</p>
          </div>
          <div className="flex items-center">
            <Switch id="airplane-mode" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            <Label htmlFor="airplane-mode">Email Notifications</Label>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-[#333]">
          <div>
            <h3 className="font-medium text-white">Push Notifications</h3>
            <p className="text-sm text-gray-400">Receive real-time alerts on your device.</p>
          </div>
          <div className="flex items-center">
            <Switch id="airplane-mode" checked={pushNotifications} onCheckedChange={setPushNotifications} />
            <Label htmlFor="airplane-mode">Push Notifications</Label>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-[#333]">
          <div>
            <h3 className="font-medium text-white">Marketing Emails</h3>
            <p className="text-sm text-gray-400">Receive updates about new features and promotions.</p>
          </div>
           <div className="flex items-center">
              <Switch id="airplane-mode" checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              <Label htmlFor="airplane-mode">Marketing Emails</Label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
