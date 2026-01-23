"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    frequency: "once",
    description: "",
  });

  const [step, setStep] = useState(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Payout scheduled successfully!\nAmount: ${formData.amount}\nMethod: ${formData.payoutMethod}`);
    onClose();
  };

  const availableMethods = [
    { id: "bank", name: "Bank Transfer - First Bank (****3456)" },
    { id: "paypal", name: "PayPal - seller@paypal.com" },
    { id: "crypto", name: "USDT Wallet - 0x742d...f7e1" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full p-6 border border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Schedule Payout</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#0a0a0a] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        {/* Progress Steps */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Amount & Method */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Balance: ₦125,450.00
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
                    min="0"
                    max="125450"
                    step="0.01"
                    required
                    className="w-full pl-8 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: ₦1,000 | Maximum: ₦125,450.00
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payout Method *
                </label>
                <select
                  name="payoutMethod"
                  value={formData.payoutMethod}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600"
                >
                  <option value="">Select a payment method</option>
                  {availableMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-300">
                  Payouts typically process within 1-3 business days depending on your payment
                  method.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
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
                      className="w-4 h-4 accent-purple-600"
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
                      className="w-4 h-4 accent-purple-600"
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
                      className="w-4 h-4 accent-purple-600"
                    />
                    <div>
                      <p className="font-medium text-white">Recurring</p>
                      <p className="text-xs text-gray-400">Automatic regular payouts</p>
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
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600"
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
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Review Your Payout</h3>

              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-xl font-bold text-white">₦{formData.amount}</span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                  <span className="text-gray-400">Payment Method</span>
                  <span className="text-white">
                    {availableMethods.find((m) => m.id === formData.payoutMethod)?.name}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a]">
                  <span className="text-gray-400">Schedule</span>
                  <span className="text-white">
                    {formData.scheduleType === "immediate"
                      ? "Immediate"
                      : formData.scheduleType === "scheduled"
                        ? `${formData.scheduleDate}`
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

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-[#2a2a2a]">
            {step > 1 && (
              <Button
                type="button"
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="flex-1 border-[#2a2a2a]"
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (
                    step === 1 &&
                    (!formData.amount || !formData.payoutMethod)
                  ) {
                    alert("Please fill in all required fields");
                    return;
                  }
                  setStep(step + 1);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm Payout
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}