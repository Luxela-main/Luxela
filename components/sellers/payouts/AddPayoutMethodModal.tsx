"use client";

import { useState } from "react";
import { X, CreditCard, Wallet, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddPayoutMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (method: any) => void;
}

export function AddPayoutMethodModal({ isOpen, onClose, onAdd }: AddPayoutMethodModalProps) {
  const [methodType, setMethodType] = useState<"bank" | "paypal" | "crypto" | "wise" | null>(
    null
  );
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newMethod;

    switch (methodType) {
      case "bank":
        newMethod = {
          name: `${formData.bankName}`,
          type: "bank",
          details: `${formData.bankName} • ****${formData.accountNumber.slice(-4)}`,
          icon: <CreditCard className="text-purple-400" size={24} />,
        };
        break;
      case "paypal":
        newMethod = {
          name: "PayPal Account",
          type: "paypal",
          details: formData.paypalEmail,
          icon: <Wallet className="text-blue-400" size={24} />,
        };
        break;
      case "crypto":
        newMethod = {
          name: `${formData.walletNetwork} Wallet`,
          type: "crypto",
          details: `${formData.walletAddress.slice(0, 10)}...${formData.walletAddress.slice(-5)}`,
          icon: <DollarSign className="text-green-400" size={24} />,
        };
        break;
      case "wise":
        newMethod = {
          name: "Wise Account",
          type: "wise",
          details: formData.wiseEmail,
          icon: <Wallet className="text-amber-400" size={24} />,
        };
        break;
      default:
        return;
    }

    onAdd(newMethod);
    resetForm();
  };

  const resetForm = () => {
    setMethodType(null);
    setFormData({
      bankName: "",
      accountNumber: "",
      accountName: "",
      sortCode: "",
      paypalEmail: "",
      walletAddress: "",
      walletNetwork: "",
      wiseEmail: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full p-6 border border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Add Payout Method</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#0a0a0a] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        {/* Method Selection */}
        {!methodType ? (
          <div className="space-y-3">
            <p className="text-gray-400 mb-4">Select a payment method type:</p>

            <button
              onClick={() => setMethodType("bank")}
              className="w-full p-4 border border-[#2a2a2a] rounded-lg hover:border-purple-600/50 hover:bg-[#0a0a0a] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="text-purple-400" size={24} />
                <div>
                  <h4 className="font-semibold text-white">Bank Transfer</h4>
                  <p className="text-sm text-gray-400">Direct bank account transfer</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMethodType("paypal")}
              className="w-full p-4 border border-[#2a2a2a] rounded-lg hover:border-blue-600/50 hover:bg-[#0a0a0a] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Wallet className="text-blue-400" size={24} />
                <div>
                  <h4 className="font-semibold text-white">PayPal</h4>
                  <p className="text-sm text-gray-400">Send to your PayPal account</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMethodType("crypto")}
              className="w-full p-4 border border-[#2a2a2a] rounded-lg hover:border-green-600/50 hover:bg-[#0a0a0a] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="text-green-400" size={24} />
                <div>
                  <h4 className="font-semibold text-white">Cryptocurrency</h4>
                  <p className="text-sm text-gray-400">USDT, USDC, or other crypto</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMethodType("wise")}
              className="w-full p-4 border border-[#2a2a2a] rounded-lg hover:border-amber-600/50 hover:bg-[#0a0a0a] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Wallet className="text-amber-400" size={24} />
                <div>
                  <h4 className="font-semibold text-white">Wise (TransferWise)</h4>
                  <p className="text-sm text-gray-400">Fast international transfers</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {methodType === "bank" && (
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
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
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
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
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
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
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
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            )}

            {methodType === "paypal" && (
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
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                />
              </div>
            )}

            {methodType === "crypto" && (
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
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="">Select network</option>
                    <option value="USDT (TRC-20)">USDT (TRC-20)</option>
                    <option value="USDT (ERC-20)">USDT (ERC-20)</option>
                    <option value="USDC (Polygon)">USDC (Polygon)</option>
                    <option value="Bitcoin">Bitcoin</option>
                    <option value="Solana">Solana</option>
                    <option value="Ethereum">Ethereum</option>
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
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {methodType === "wise" && (
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
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-[#2a2a2a]">
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                }}
                variant="outline"
                className="flex-1 border-[#2a2a2a]"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Add Method
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}