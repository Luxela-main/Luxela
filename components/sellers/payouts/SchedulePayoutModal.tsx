"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/app/_trpc/client";

interface SchedulePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SchedulePayoutModal({ isOpen, onClose }: SchedulePayoutModalProps) {
  const [formData, setFormData] = useState({
    amount: "",
    payoutMethod: "",
    scheduleType: "immediate",
    scheduleDate: "",
    frequency: "monthly",
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const { mutate: createPayout, isPending: isCreating } = trpc.finance.schedulePayoutCreate.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const { data: methods, isLoading: methodsLoading } = trpc.sales.getPayoutMethod.useQuery() as any;
  const { data: balanceData } = trpc.finance.getPayoutBalance.useQuery({ currency: 'NGN' }) as any;

  // Get filtered payout methods based on schedule type
  const getFilteredPayoutMethods = () => {
    if (!methods || methods.length === 0) return [];

    // Immediate payouts: exclude Tsara (it's designed for recurring/automatic)
    if (formData.scheduleType === 'immediate') {
      return methods.filter((m: any) => m.type !== 'tsara');
    }

    // Recurring payouts: include all methods including Tsara
    if (formData.scheduleType === 'recurring') {
      return methods;
    }

    // Scheduled (one-time future): exclude Tsara
    if (formData.scheduleType === 'scheduled') {
      return methods.filter((m: any) => m.type !== 'tsara');
    }

    return methods;
  };

  const filteredMethods = getFilteredPayoutMethods();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.payoutMethod) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await createPayout({
        amountCents: Math.round(parseFloat(formData.amount) * 100),
        payoutMethodId: formData.payoutMethod,
        schedule: formData.scheduleType as any,
        scheduledDate: formData.scheduleType === "scheduled" ? new Date(formData.scheduleDate) : undefined,
        frequency: formData.frequency,
      });
    } finally {
      setLoading(false);
    }
  };

  const formattedMethods: Array<{ id: string; name: string }> = methods?.map((m: any) => {
    if (m.type === "bank_transfer") {
      return {
        id: m.id,
        name: `Bank Transfer - ${m.accountDetails?.accountName} (${m.accountDetails?.bankName})`,
      };
    }
    if (m.type === "paypal") {
      return {
        id: m.id,
        name: `PayPal - ${m.accountDetails?.email}`,
      };
    }
    if (m.type === "crypto") {
      return {
        id: m.id,
        name: `${m.accountDetails?.tokenType || "Crypto"} - ${m.accountDetails?.walletAddress?.slice(0, 10)}...${m.accountDetails?.walletAddress?.slice(-4)}`,
      };
    }
    if (m.type === "tsara") {
      return {
        id: m.id,
        name: `Tsara Escrow`,
      };
    }
    if (m.type === "wise") {
      return {
        id: m.id,
        name: `Wise - ${m.accountDetails?.email || m.accountDetails?.recipientId}`,
      };
    }
    return {
      id: m.id,
      name: m.type,
    };
  }) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full p-6 border border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Schedule Payout</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#0a0a0a] rounded-lg transition-colors cursor-pointer"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  s <= step
                    ? "bg-purple-600 text-white"
                    : "bg-[#0a0a0a] border border-[#2a2a2a] text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 rounded-full ${
                    s < step ? "bg-purple-600" : "bg-[#0a0a0a]"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Balance: ₦{(balanceData?.available || 0).toLocaleString()}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payout Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="1000"
                    max={balanceData?.available || 999999}
                    step="100"
                    required
                    className="w-full pl-8 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: ₦1,000 | Maximum: ₦{(balanceData?.available || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payout Method *
                </label>
                {methodsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                  </div>
                ) : (
                  <select
                    name="payoutMethod"
                    value={formData.payoutMethod}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="">Select a payment method</option>
                    {filteredMethods.map((method: any) => {
                      const formattedMethod = formattedMethods.find((m) => m.id === method.id);
                      return (
                        <option key={method.id} value={method.id}>
                          {method.type === 'tsara' ? '🔐 ' : ''}{formattedMethod?.name || method.type}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Tsara Escrow Info - Show for recurring payouts */}
              {formData.scheduleType === 'recurring' && (
                <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">✨</span>
                    <div>
                      <p className="text-sm font-semibold text-purple-300">
                        Tsara Escrow Available for Recurring Payouts
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Funds are automatically released to your account when buyers confirm order delivery. Enjoy peace of mind with escrow-backed recurring payouts.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-300">
                  Payouts typically process within 1-3 business days depending on your payment method.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  When would you like this payout? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-4 border border-[#2a2a2a] rounded-lg hover:border-purple-600/50 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="immediate"
                      checked={formData.scheduleType === "immediate"}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <p className="font-medium text-white">Immediate</p>
                      <p className="text-xs text-gray-400">Process right away</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-[#2a2a2a] rounded-lg hover:border-purple-600/50 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="scheduled"
                      checked={formData.scheduleType === "scheduled"}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <p className="font-medium text-white">Schedule for Later</p>
                      <p className="text-xs text-gray-400">Choose a specific date</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-[#2a2a2a] rounded-lg hover:border-purple-600/50 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="recurring"
                      checked={formData.scheduleType === "recurring"}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <p className="font-medium text-white">Recurring</p>
                      <p className="text-xs text-gray-400">Automatic regular payouts with Tsara Escrow</p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.scheduleType === "scheduled" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    name="scheduleDate"
                    value={formData.scheduleDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 cursor-pointer"
                  />
                </div>
              )}

              {formData.scheduleType === "recurring" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Frequency *
                  </label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Review Your Payout</h3>

              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-xl font-bold text-white">₦{parseFloat(formData.amount).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                  <span className="text-gray-400">Payment Method</span>
                  <span className="text-white text-sm">
                    {formattedMethods.find((m) => m.id === formData.payoutMethod)?.name || "Not selected"}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                  <span className="text-gray-400">Schedule</span>
                  <span className="text-white">
                    {formData.scheduleType === "immediate"
                      ? "Immediate"
                      : formData.scheduleType === "scheduled"
                        ? formData.scheduleDate
                        : `${formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)}`}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-gray-400">Processing Fee</span>
                  <span className="text-white">0% (Free)</span>
                </div>
              </div>

              <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4 flex gap-3">
                <div className="text-lg">✓</div>
                <p className="text-sm text-green-300">
                  Everything looks good! Click confirm to proceed with your payout.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-[#2a2a2a]">
            {step > 1 && (
              <Button
                type="button"
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="flex-1 border-[#2a2a2a] cursor-pointer"
                disabled={isCreating || loading}
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && (!formData.amount || !formData.payoutMethod)) {
                    alert("Please fill in all required fields");
                    return;
                  }
                  setStep(step + 1);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                disabled={isCreating || loading}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isCreating || loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 cursor-pointer"
              >
                {isCreating || loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  "Confirm Payout"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}