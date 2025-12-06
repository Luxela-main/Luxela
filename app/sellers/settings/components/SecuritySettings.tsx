"use client";

import { Button } from "@/components/ui/button";
import { toastSvc } from "@/services/toast";

export function SecuritySettings() {
  const handleChangePassword = () => {
    toastSvc.success("Password change functionality coming soon.");
  };

  const handleTwoFactor = () => {
    toastSvc.success("2FA configuration coming soon.");
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-medium mb-6">Security Settings</h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between py-4 border-b border-[#333]">
          <div>
            <h3 className="font-medium text-white">Password</h3>
            <p className="text-sm text-gray-400">Update your account password.</p>
          </div>
          <Button variant="outline" onClick={handleChangePassword} className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white">
            Change Password
          </Button>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-[#333]">
          <div>
            <h3 className="font-medium text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-400">Add an extra layer of security to your account.</p>
          </div>
          <Button variant="outline" onClick={handleTwoFactor} className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white">
            Enable 2FA
          </Button>
        </div>
      </div>
    </div>
  );
}
