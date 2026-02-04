"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus, Check, CreditCard, Wallet, DollarSign, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddPayoutMethodModal } from "./AddPayoutMethodModal";
import { PayoutMethodVerificationModal } from "./PayoutMethodVerificationModal";
import { EditPayoutMethodModal } from "./EditPayoutMethodModal";
import { DeletePayoutMethodModal } from "./DeletePayoutMethodModal";
import { usePayoutMethods, useDeletePayoutMethod, useAddPayoutMethod, useUpdatePayoutMethod } from "@/modules/seller/queries/usePayoutMethods";

const getMethodIcon = (type: string) => {
  switch (type) {
    case "bank":
      return <CreditCard className="text-purple-400" size={24} />;
    case "paypal":
      return <Wallet className="text-blue-400" size={24} />;
    case "crypto":
      return <DollarSign className="text-green-400" size={24} />;
    case "wise":
      return <Wallet className="text-orange-400" size={24} />;
    default:
      return <CreditCard className="text-gray-400" size={24} />;
  }
};

export function PayoutMethods() {
  const { data: payoutMethods = [], isLoading, error, refetch } = usePayoutMethods();
  const deleteMutation = useDeletePayoutMethod();
  const addMutation = useAddPayoutMethod();
  const updateMutation = useUpdatePayoutMethod();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<any | null>(null);
  const [verifyingMethod, setVerifyingMethod] = useState<any | null>(null);

  const handleDeleteMethod = (method: any) => {
    setDeletingMethod(method);
  };

  const handleConfirmDelete = () => {
    if (deletingMethod) {
      deleteMutation.mutate(deletingMethod.id, {
        onSuccess: () => {
          setDeletingMethod(null);
        },
      });
    }
  };

  const handleSetDefault = (id: string) => {
    updateMutation.mutate({
      methodId: id,
      isDefault: true,
    });
  };

  const handleAddMethod = (newMethod: any) => {
    addMutation.mutate(newMethod, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        // Optionally refetch to ensure fresh data
        refetch?.();
      },
      onError: (error: any) => {
        console.error('Failed to add payout method:', error);
      },
    });
  };

  const handleEditMethod = (method: any) => {
    setEditingMethod(method);
  };

  const handleSaveEdit = (methodId: string, data: any) => {
    updateMutation.mutate(
      { methodId, ...data },
      {
        onSuccess: () => {
          setEditingMethod(null);
        },
      }
    );
  };

  const handleVerifyMethod = (method: any) => {
    setVerifyingMethod(method);
  };

  const getMethodTypeLabel = (type: string) => {
    switch (type) {
      case "bank":
      case "bank_transfer":
        return "Bank Transfer";
      case "paypal":
        return "PayPal";
      case "crypto":
        return "Cryptocurrency";
      case "wise":
        return "Wise";
      case "stripe":
        return "Stripe";
      default:
        return type;
    }
  };

  const normalizeType = (type: string) => {
    if (type === "bank_transfer") return "bank";
    return type;
  };



  const getAccountSummary = (method: any) => {
    const type = normalizeType(method.type);

    switch (type) {
      case 'bank': {
        const bankName = method.bankName || 'Bank';
        const accountNumber = method.accountNumber || 'XXXX';
        const lastFour = accountNumber?.slice(-4) || 'XXXX';
        return `${bankName}\n••••${lastFour}`;
      }
      case 'paypal': {
        return `PayPal\n${method.email || 'Email'}`;
      }
      case 'crypto': {
        const wallet = method.accountId || method.phoneNumber || 'Wallet';
        const walletDisplay = wallet && wallet.length > 8 ? `••••${wallet.slice(-8)}` : wallet;
        return `Cryptocurrency\n${walletDisplay}`;
      }
      case 'wise': {
        const email = method.email || method.accountNumber || 'Account';
        return `Wise\n${email}`;
      }
      case 'stripe': {
        const stripeId = method.accountId || method.accountNumber || 'Account';
        const stripeDisplay = stripeId && stripeId.length > 8 ? `••••${stripeId.slice(-8)}` : stripeId;
        return `Stripe\n${stripeDisplay}`;
      }
      default:
        return 'Payment Method';
    }
  };

  const getAccountName = (method: any) => {
    return method.accountName || method.name || 'Payment Method';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="h-32 bg-[#1a1a1a] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
        <p className="text-red-400">Failed to load payment methods</p>
        <Button
          onClick={() => refetch()}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="space-y-4">
        {payoutMethods.length > 0 ? (
          payoutMethods.map((method: any) => (
            <div
              key={method.id}
              className={`bg-[#1a1a1a] border ${(method.is_verified || method.isVerified) ? 'border-[#2a2a2a]' : 'border-yellow-600/30'} rounded-lg p-6 hover:border-purple-600/50 transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-[#0a0a0a] p-3 rounded-lg">{getMethodIcon(method.type || method.methodType)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white text-lg">{getAccountName(method)}</h4>
                      {(method.is_default || method.isDefault) && (
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full">
                          Default
                        </span>
                      )}
                      {(method.is_verified || method.isVerified) ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                          <Check size={14} />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-medium rounded-full flex items-center gap-1">
                          <AlertCircle size={14} />
                          Pending Verification
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-400">
                      {method.bankName && <p><span className="text-gray-500 font-medium">Bank:</span> {method.bankName}</p>}
                      {method.accountNumber && <p><span className="text-gray-500 font-medium">Account #:</span> ****{method.accountNumber.slice(-4)}</p>}
                      {method.email && <p><span className="text-gray-500 font-medium">Email:</span> {method.email}</p>}
                      {method.bankCountry && <p><span className="text-gray-500 font-medium">Country:</span> {method.bankCountry}</p>}
                      {method.sellerId && <p><span className="text-gray-500 font-medium">Seller ID:</span> {method.sellerId}</p>}
                    </div>
                    <p className="text-gray-500 text-xs mt-3">
                      {getMethodTypeLabel(method.type || method.methodType)} • Added{(method.created_at || method.createdAt) ? ` on ${new Date(method.created_at || method.createdAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!(method.is_verified || method.isVerified) && (
                    <button
                      onClick={() => handleVerifyMethod(method)}
                      className="p-2 hover:bg-[#0a0a0a] rounded-lg transition-colors text-yellow-400 hover:text-yellow-300"
                      title="Verify payment method"
                    >
                      <Send size={18} />
                    </button>
                  )}
                  {!(method.is_default || method.isDefault) && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="p-2 hover:bg-[#0a0a0a] rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Set as default"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditMethod(method)}
                    className="p-2 hover:bg-[#0a0a0a] rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Edit payment method"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteMethod(method)}
                    disabled={(method.is_default || method.isDefault) || deleteMutation.isPending}
                    className="p-2 hover:bg-[#0a0a0a] rounded-lg transition-colors text-gray-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete payment method"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">No payment methods available</p>
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

      <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4">
        <h4 className="font-semibold text-purple-400 mb-2">💡 Tip</h4>
        <p className="text-sm text-gray-300">
          Verify your payment methods to enable payouts. You can set one as default for automatic transfers.
        </p>
      </div>

      {isAddModalOpen && (
        <AddPayoutMethodModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddMethod}
        />
      )}

      {editingMethod && (
        <EditPayoutMethodModal
          isOpen={!!editingMethod}
          onClose={() => setEditingMethod(null)}
          onSave={handleSaveEdit}
          method={editingMethod}
          isLoading={updateMutation.isPending}
        />
      )}

      {deletingMethod && (
        <DeletePayoutMethodModal
          isOpen={!!deletingMethod}
          onClose={() => setDeletingMethod(null)}
          onConfirm={handleConfirmDelete}
          method={deletingMethod}
          isLoading={deleteMutation.isPending}
        />
      )}

      {verifyingMethod && (
        <PayoutMethodVerificationModal
          isOpen={!!verifyingMethod}
          onClose={() => setVerifyingMethod(null)}
          methodId={verifyingMethod.id}
          methodType={verifyingMethod.type}
          accountDetails={verifyingMethod.accountDetails}
        />
      )}
    </div>
  );
}