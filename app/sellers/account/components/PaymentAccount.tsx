"use client";

import { useEffect, useState } from "react";
import { CreditCard, DollarSign, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PaymentAccountProps {
  initialData: any;
}

const methodLabels = {
  fiat_currency: "Fiat Currency",
  cryptocurrency: "Cryptocurrency",
  both: "Fiat Currency & Cryptocurrency",
};

const fiatMethodLabels = {
  bank: "Bank Transfer",
  paypal: "PayPal",
  stripe: "Stripe",
  flutterwave: "Flutterwave",
};

const walletTypeLabels = {
  phantom: "Phantom Wallet",
  solflare: "Solflare",
  backpack: "Backpack",
  wallet_connect: "WalletConnect",
};

export function PaymentAccount({ initialData }: PaymentAccountProps) {
  const [paymentData, setPaymentData] = useState(initialData?.payment || null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time subscription or periodic refresh of payment data
  const { data: latestProfile } = (trpc.seller as any).getProfile.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: true,
  });

  useEffect(() => {
    if (latestProfile?.payment) {
      setPaymentData(latestProfile.payment);
    }
  }, [latestProfile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Manually refetch the latest data
      const result = await (trpc.seller as any).getProfile.fetch();
      if (result?.payment) {
        setPaymentData(result.payment);
      }
    } catch (error) {
      console.error("Error refreshing payment data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!paymentData) {
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
            Please configure your payment method in settings.
          </p>
        </div>
      </div>
    );
  }

  const preferredMethod = paymentData.preferredPayoutMethod as string;

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

      <div className="space-y-6">
        {/* Primary Payout Method */}
        <div className="bg-[#0f0f0f] rounded-lg p-6 border border-[#8451E1]/20">
          <div className="flex items-start">
            <CreditCard className="h-6 w-6 text-[#8451E1] mr-4 mt-1" />
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-2">Primary Payout Method</p>
              <p className="text-white text-lg font-medium">
                {methodLabels[preferredMethod as keyof typeof methodLabels] || preferredMethod}
              </p>
            </div>
          </div>
        </div>

        {/* Fiat Payment Details */}
        {(preferredMethod === "fiat_currency" || preferredMethod === "both") && paymentData.fiatPayoutMethod && (
          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-[#333]">
            <div className="flex items-start mb-4">
              <DollarSign className="h-6 w-6 text-green-400 mr-4 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Fiat Currency Payout</p>
                <p className="text-white text-lg font-medium">
                  {fiatMethodLabels[paymentData.fiatPayoutMethod as keyof typeof fiatMethodLabels] || paymentData.fiatPayoutMethod}
                </p>
              </div>
            </div>

            {paymentData.fiatPayoutMethod === "bank" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#333]">
                {paymentData.bankCountry && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Bank Country</p>
                    <p className="text-white font-medium">{paymentData.bankCountry}</p>
                  </div>
                )}
                {paymentData.accountHolderName && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Account Holder</p>
                    <p className="text-white font-medium">{paymentData.accountHolderName}</p>
                  </div>
                )}
                {paymentData.accountNumber && (
                  <div className="md:col-span-2">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Account Number</p>
                    <p className="text-white font-medium font-mono">
                      {paymentData.accountNumber.slice(-4).padStart(paymentData.accountNumber.length, "*")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Crypto Payment Details */}
        {(preferredMethod === "cryptocurrency" || preferredMethod === "both") && paymentData.walletType && (
          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-[#333]">
            <div className="flex items-start mb-4">
              <Wallet className="h-6 w-6 text-blue-400 mr-4 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Cryptocurrency Payout</p>
                <p className="text-white text-lg font-medium">
                  {walletTypeLabels[paymentData.walletType as keyof typeof walletTypeLabels] || paymentData.walletType}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#333]">
              {paymentData.preferredPayoutToken && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Preferred Token</p>
                  <p className="text-white font-medium">{paymentData.preferredPayoutToken}</p>
                </div>
              )}
              {paymentData.walletAddress && (
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Wallet Address</p>
                  <p className="text-white font-medium font-mono text-sm break-all">
                    {paymentData.walletAddress.slice(0, 10)}...{paymentData.walletAddress.slice(-10)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Notice */}
        <div className="bg-[#0f0f0f] rounded-lg p-4 border border-blue-900/20">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Read-only view:</span> Payment method information is displayed in real-time from your account settings. This is a secure view showing only your configured payout method.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}