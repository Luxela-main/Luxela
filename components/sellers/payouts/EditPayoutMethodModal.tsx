"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Wallet, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditPayoutMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (methodId: string, data: any) => void;
  method: any;
  isLoading?: boolean;
}

export function EditPayoutMethodModal({
  isOpen,
  onClose,
  onSave,
  method,
  isLoading = false,
}: EditPayoutMethodModalProps) {
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    sortCode: "",
    paypalEmail: "",
    walletAddress: "",
    walletNetwork: "",
    wiseEmail: "",
  });

  useEffect(() => {
    if (method && method.accountDetails) {
      const details = method.accountDetails;
      setFormData({
        bankName: details.bankName || "",
        accountNumber: details.accountNumber || "",
        accountName: details.accountName || "",
        sortCode: details.sortCode || "",
        paypalEmail: details.email || "",
        walletAddress: details.walletAddress || "",
        walletNetwork: details.walletNetwork || "",
        wiseEmail: details.email || "",
      });
    }
  }, [method, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!method) return;

    let updatedDetails;

    switch (method.type) {
      case "bank_transfer":
        updatedDetails = {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          sortCode: formData.sortCode,
        };
        break;
      case "paypal":
        updatedDetails = {
          email: formData.paypalEmail,
        };
        break;
      case "crypto":
        updatedDetails = {
          walletNetwork: formData.walletNetwork,
          walletAddress: formData.walletAddress,
        };
        break;
      case "wise":
        updatedDetails = {
          email: formData.wiseEmail,
        };
        break;
      default:
        return;
    }

    onSave(method.id, {
      accountDetails: updatedDetails,
    });
  };

  const getMethodTypeLabel = (type: string) => {
    switch (type) {
      case "bank_transfer":
        return "Bank Transfer";
      case "paypal":
        return "PayPal";
      case "crypto":
        return "Cryptocurrency";
      case "wise":
        return "Wise";
      default:
        return type;
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "bank_transfer":
        return <CreditCard className="text-purple-400" size={24} />;
      case "paypal":
        return <Wallet className="text-blue-400" size={24} />;
      case "crypto":
        return <DollarSign className="text-green-400" size={24} />;
      case "wise":
        return <Wallet className="text-amber-400" size={24} />;
      default:
        return <CreditCard className="text-gray-400" size={24} />;
    }
  };

  if (!isOpen || !method) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full p-6 border border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#0a0a0a] p-2 rounded-lg">
              {getMethodIcon(method.type)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Edit {getMethodTypeLabel(method.type)}
              </h2>
              <p className="text-gray-400 text-sm">
                Update your {getMethodTypeLabel(method.type).toLowerCase()} details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-[#0a0a0a] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {method.type === "bank_transfer" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="e.g., First Bank"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  placeholder="Your full name as on bank account"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Your account number"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort Code / SWIFT Code
                </label>
                <input
                  type="text"
                  name="sortCode"
                  value={formData.sortCode}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {method.type === "paypal" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PayPal Email *
              </label>
              <input
                type="email"
                name="paypalEmail"
                value={formData.paypalEmail}
                onChange={handleInputChange}
                placeholder="your-email@paypal.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 disabled:opacity-50"
              />
            </div>
          )}

          {method.type === "crypto" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Network/Token *
                </label>
                <select
                  name="walletNetwork"
                  value={formData.walletNetwork}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 disabled:opacity-50"
                >
                  <option value="">Select network</option>
                  <option value="USDC (SOL)">USDC (SOL)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Address *
                </label>
                <input
                  type="text"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleInputChange}
                  placeholder="Your wallet address"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 disabled:opacity-50 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {method.type === "wise" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wise Email *
              </label>
              <input
                type="email"
                name="wiseEmail"
                value={formData.wiseEmail}
                onChange={handleInputChange}
                placeholder="your-email@wise.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 disabled:opacity-50"
              />
            </div>
          )}

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              After updating your payment method details, you may need to verify it again to ensure your new information is correct.
            </p>
          </div>

          <div className="flex gap-3 pt-6 border-t border-[#2a2a2a]">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-[#2a2a2a]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}