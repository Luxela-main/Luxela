"use client";

import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePayoutMethodsRealtime } from "@/modules/seller/hooks/usePayoutMethodsRealtime";

interface PaymentAccountProps {
  initialData: any;
}



export function PaymentAccount({ initialData }: PaymentAccountProps) {
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  // Fetch real-time payout methods from Payout page
  const {
    payoutMethods,
    isLoading: methodsLoading,
    isLiveUpdating,
    refetch: refetchMethods,
    error: methodsError,
  } = usePayoutMethodsRealtime({
    pollIntervalMs: 30000,
    enabled: true,
    onDataChange: (methods) => {
      console.log('[PaymentAccount] Payout methods updated:', methods);
      // Update selected method if it exists
      if (selectedMethodId && methods.length > 0) {
        const found = methods.find((m: any) => m.id === selectedMethodId);
        if (found) {
          setSelectedMethodId(found.id);
        }
      }
    },
  });

  // Auto-select the default payout method if available
  useEffect(() => {
    if (!selectedMethodId && payoutMethods.length > 0) {
      const defaultMethod = payoutMethods.find((m: any) => m.is_default);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
      }
    }
  }, [payoutMethods, selectedMethodId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh payout methods
      await refetchMethods();
    } catch (error) {
      console.error("Error refreshing payment data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to normalize type field (handles both bank and bank_transfer formats)
  const normalizeType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      "bank_transfer": "bank",
      "bank": "bank",
      "paypal": "paypal",
      "crypto": "crypto",
      "wise": "wise",
      "stripe": "stripe",
    };
    return typeMap[type] || type;
  };

  // Helper function to get method type label
  const getMethodTypeLabel = (type: string) => {
    const normalized = normalizeType(type);
    switch (normalized) {
      case "bank":
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

  // Helper function to get method icon
  const getMethodIcon = (type: string) => {
    const normalized = normalizeType(type);
    switch (normalized) {
      case "bank":
        return "🏦";
      case "paypal":
        return "💳";
      case "crypto":
        return "₿";
      case "wise":
        return "💱";
      case "stripe":
        return "🔗";
      default:
        return "💰";
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  };

  // Helper function to safely parse account details
  const parseAccountDetails = (accountDetails: any): Record<string, any> => {
    if (!accountDetails) return {};
    if (typeof accountDetails === 'string') {
      try {
        return JSON.parse(accountDetails);
      } catch (e) {
        console.error('Failed to parse account details:', e);
        return {};
      }
    }
    return accountDetails as Record<string, any>;
  };

  // Helper function to mask account numbers
  const maskAccountNumber = (accountNumber: string | undefined): string => {
    if (!accountNumber || accountNumber.length === 0) return "****";
    if (accountNumber.length <= 4) return "****";
    return `****${accountNumber.slice(-4)}`;
  };

  // Helper function to get account details summary
  const getAccountSummary = (method: any) => {
    const normalized = normalizeType(method.type);
    const details = parseAccountDetails(method.account_details);
    
    switch (normalized) {
      case "bank":
        const bankName = details.bankName || details.bank_name || "Bank";
        const accountType = details.accountType || details.account_type || "Account";
        const maskedAccount = maskAccountNumber(details.accountNumber || details.account_number);
        return `${bankName} • ${accountType} • ${maskedAccount}`;
      case "paypal":
        return details.email || "PayPal Account";
      case "crypto":
        const address = details.walletAddress || details.wallet_address || "";
        return address && address.length > 0 ? `${address.slice(0, 10)}...${address.slice(-8)}` : "Crypto Wallet";
      case "wise":
        return details.email || "Wise Account";
      case "stripe":
        return details.accountId || details.account_id || "Stripe Account";
      default:
        return details.accountName || details.account_name || "Payment Account";
    }
  };

  const selectedMethod = selectedMethodId 
    ? payoutMethods.find((m: any) => m.id === selectedMethodId)
    : payoutMethods.find((m: any) => m.is_default);

  if (methodsError) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Payment Method</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-[#222] rounded-md transition disabled:opacity-50"
            title="Refresh payment data"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-400 font-medium">Failed to load payment methods</p>
          <p className="text-red-300/70 text-sm mt-2">
            {(methodsError as any)?.message || 'An error occurred while fetching your payment methods'}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (payoutMethods.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Payment Method</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-[#222] rounded-md transition disabled:opacity-50"
            title="Refresh payment data"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="bg-[#0f0f0f] rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No payment method set yet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Please configure your payment method in the Payout Methods section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium">Payment Methods</h2>
        <div className="flex items-center gap-3">
          {isLiveUpdating && (
            <span className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Updates
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-[#222] rounded-md transition disabled:opacity-50"
            title="Refresh payment data"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Payout Methods from Payout Page */}
        <div className="bg-[#0f0f0f] rounded-lg p-6 border border-[#333]">
          <h3 className="text-lg font-semibold text-white mb-4">Active Payout Methods</h3>
          <div className="space-y-3">
            {payoutMethods.map((method: any) => {
              const normalized = normalizeType(method.type);
              const addedDate = formatDate(method.created_at || method.createdAt);
              
              return (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMethodId === method.id || method.is_default
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-[#333] hover:border-purple-500/50 bg-[#0a0a0a]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl mt-1">{getMethodIcon(normalized)}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {(() => {
                            const details = parseAccountDetails(method.account_details);
                            return details?.accountName || details?.account_name || method.name || getMethodTypeLabel(normalized);
                          })()}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {getAccountSummary(method)}
                        </p>
                        {addedDate && (
                          <p className="text-gray-500 text-xs mt-2">
                            Added on {addedDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {method.is_default && (
                          <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full">
                            Default
                          </span>
                        )}
                        {method.is_verified ? (
                          <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                            <Check size={14} />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-medium rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-[#0f0f0f] rounded-lg p-4 border border-blue-900/20">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Real-time Data:</span> Payment methods are synced in real-time from your Payout Methods page. This secure view displays your configured payout methods and keeps you updated with any changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}