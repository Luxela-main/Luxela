"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus, Check, CreditCard, Wallet, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddPayoutMethodModal } from "./AddPayoutMethodModal";

interface PayoutMethod {
  id: string;
  name: string;
  type: "bank" | "paypal" | "crypto" | "wise";
  details: string;
  isDefault: boolean;
  isVerified: boolean;
  icon: React.ReactNode;
}

export function PayoutMethods() {
  const [methods, setMethods] = useState<PayoutMethod[]>([
    {
      id: "1",
      name: "Primary Bank Account",
      type: "bank",
      details: "First Bank • ****3456",
      isDefault: true,
      isVerified: true,
      icon: <CreditCard className="text-purple-400" size={24} />,
    },
    {
      id: "2",
      name: "PayPal Account",
      type: "paypal",
      details: "seller@paypal.com",
      isDefault: false,
      isVerified: true,
      icon: <Wallet className="text-blue-400" size={24} />,
    },
    {
      id: "3",
      name: "USDT Wallet",
      type: "crypto",
      details: "0x742d35Cc6634C0532925a3b844Bc9e7595f.....",
      isDefault: false,
      isVerified: false,
      icon: <DollarSign className="text-green-400" size={24} />,
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PayoutMethod | null>(null);

  const handleDeleteMethod = (id: string) => {
    if (confirm("Are you sure you want to delete this payment method?")) {
      setMethods(methods.filter((m) => m.id !== id));
    }
  };

  const handleSetDefault = (id: string) => {
    setMethods(
      methods.map((m) => ({
        ...m,
        isDefault: m.id === id,
      }))
    );
  };

  const handleAddMethod = (newMethod: any) => {
    setMethods([
      ...methods,
      {
        id: Date.now().toString(),
        ...newMethod,
        isDefault: false,
        isVerified: false,
        icon: newMethod.icon,
      },
    ]);
    setIsAddModalOpen(false);
  };

  const getMethodTypeLabel = (type: string) => {
    switch (type) {
      case "bank":
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

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Payment Methods</h3>
          <p className="text-gray-400 text-sm mt-1">Manage your payout payment methods</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Method</span>
        </Button>
      </div>

      {/* Methods List */}
      <div className="space-y-4">
        {methods.length > 0 ? (
          methods.map((method) => (
            <div
              key={method.id}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 hover:border-purple-600/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-[#0a0a0a] p-3 rounded-lg">{method.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-lg">{method.name}</h4>
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full">
                          Default
                        </span>
                      )}
                      {method.isVerified ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                          <Check size={14} />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-medium rounded-full">
                          Pending Verification
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{method.details}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {getMethodTypeLabel(method.type)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="p-2 hover:bg-[#0a0a0a] rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Set as default"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingMethod(method)}
                    className="p-2 hover:bg-[#0a0a0a] rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteMethod(method.id)}
                    disabled={method.isDefault}
                    className="p-2 hover:bg-[#0a0a0a] rounded-lg transition-colors text-gray-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">No payment methods added yet</p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              <Plus size={18} />
              Add Your First Method
            </Button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4">
        <h4 className="font-semibold text-purple-400 mb-2">💡 Tip</h4>
        <p className="text-sm text-gray-300">
          You can set one payment method as default for automatic payouts. Make sure your payment
          method is verified to avoid any issues with payout processing.
        </p>
      </div>

      {/* Add Method Modal */}
      {isAddModalOpen && (
        <AddPayoutMethodModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddMethod}
        />
      )}

      {/* Edit Modal would go here */}
      {editingMethod && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-lg max-w-md w-full p-6 border border-[#2a2a2a]">
            <h2 className="text-xl font-semibold text-white mb-4">Edit Payment Method</h2>
            <p className="text-gray-400 text-sm mb-4">
              Editing functionality would be implemented here
            </p>
            <Button
              onClick={() => setEditingMethod(null)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}