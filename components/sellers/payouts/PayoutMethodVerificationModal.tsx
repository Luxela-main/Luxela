"use client";

import { useState } from "react";
import { X, Mail, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSendPayoutVerification, useVerifyPayoutMethod } from "@/modules/seller/hooks/usePayoutVerification";

interface PayoutMethodVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  methodId: string;
  methodType: string;
  accountDetails: any;
}

type VerificationStep = "pending" | "code-sent" | "verify" | "verified";

export function PayoutMethodVerificationModal({
  isOpen,
  onClose,
  methodId,
  methodType,
  accountDetails,
}: PayoutMethodVerificationModalProps) {
  const [step, setStep] = useState<VerificationStep>("pending");
  const [verificationCode, setVerificationCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const sendVerification = useSendPayoutVerification();
  const verifyMethod = useVerifyPayoutMethod();

  const handleSendCode = async () => {
    try {
      await sendVerification.mutateAsync(methodId);
      setStep("code-sent");

      // Start countdown
      let seconds = 600;
      const interval = setInterval(() => {
        seconds--;
        setTimeLeft(seconds);
        if (seconds <= 0) clearInterval(interval);
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      return;
    }
    try {
      await verifyMethod.mutateAsync({
        methodId,
        verificationCode,
      });
      setStep("verified");
    } catch (err) {
      console.error(err);
    }
  };

  const handleResendCode = () => {
    setVerificationCode("");
    setTimeLeft(600);
    handleSendCode();
  };

  const getMethodEmoji = (type: string): string => {
    switch (type) {
      case "bank_transfer":
        return "🏦";
      case "paypal":
        return "🅿️";
      case "crypto":
        return "₿";
      case "wise":
        return "💱";
      default:
        return "💳";
    }
  };

  const getMethodName = (type: string): string => {
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

  const getEmailForMethod = (type: string): string => {
    switch (type) {
      case "bank_transfer":
        return "your registered email";
      case "paypal":
        return accountDetails?.email || "your PayPal email";
      case "crypto":
        return "your registered email";
      case "wise":
        return accountDetails?.email || "your Wise email";
      default:
        return "your email";
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-md w-full p-6 border border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Verify Payment Method
          </h2>
          <button
            onClick={onClose}
            disabled={verifyMethod.isPending || sendVerification.isPending}
            className="p-1 hover:bg-[#0a0a0a] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                step !== "pending"
                  ? "bg-green-600 text-white"
                  : "bg-[#2a2a2a] text-gray-400"
              }`}
            >
              {step !== "pending" ? "✓" : "1"}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Send Verification Code</p>
              <p className="text-xs text-gray-500">
                We'll send a code to {getEmailForMethod(methodType)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                ["verify", "verified"].includes(step)
                  ? step === "verified"
                    ? "bg-green-600 text-white"
                    : "bg-purple-600 text-white"
                  : "bg-[#2a2a2a] text-gray-400"
              }`}
            >
              {step === "verified" ? "✓" : "2"}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Enter Verification Code</p>
              <p className="text-xs text-gray-500">
                Confirm the 6-digit code from your email
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {step === "pending" && (
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Mail className="text-blue-400 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-300 mb-1">
                    {getMethodEmoji(methodType)} {getMethodName(methodType)}
                  </p>
                  <p className="text-xs text-gray-300">
                    {accountDetails?.accountName || "Account"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "code-sent" && (
            <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-300">
                  Verification code expires in:
                </p>
                <span className="text-lg font-bold text-purple-400">
                  {formatTimeLeft(timeLeft)}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Check your email at {getEmailForMethod(methodType)} for the 6-digit code
              </p>
            </div>
          )}

          {(step === "verify" || step === "code-sent") && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter 6-Digit Code *
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                disabled={verifyMethod.isPending}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={sendVerification.isPending || timeLeft > 120}
                  className="text-purple-400 hover:text-purple-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  Resend in {timeLeft <= 120 ? formatTimeLeft(timeLeft) : "2:00"}
                </button>
              </p>
            </div>
          )}

          {step === "verified" && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4 text-center">
              <CheckCircle className="text-green-400 mx-auto mb-2" size={40} />
              <h3 className="font-semibold text-green-400 mb-1">
                Verified Successfully!
              </h3>
              <p className="text-sm text-gray-300">
                Your {getMethodName(methodType)} payment method is now verified and ready for payouts.
              </p>
            </div>
          )}
        </div>

        {(sendVerification.isError || verifyMethod.isError) && (
          <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-3 mb-6 flex gap-2">
            <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
            <p className="text-sm text-red-300">
              {(sendVerification.error as any)?.message ||
                (verifyMethod.error as any)?.message ||
                "An error occurred"}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={verifyMethod.isPending || sendVerification.isPending || step === "verified"}
            className="flex-1 border-[#2a2a2a]"
          >
            Cancel
          </Button>

          {step === "pending" && (
            <Button
              onClick={handleSendCode}
              disabled={sendVerification.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {sendVerification.isPending ? "Sending..." : "Send Verification Code"}
            </Button>
          )}

          {(step === "code-sent" || step === "verify") && (
            <Button
              onClick={handleVerifyCode}
              disabled={!verificationCode || verifyMethod.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {verifyMethod.isPending ? "Verifying..." : "Verify Code"}
            </Button>
          )}

          {step === "verified" && (
            <Button
              onClick={onClose}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          )}
        </div>

        <div className="bg-[#0a0a0a] rounded-lg p-3 mt-6 border border-[#2a2a2a]">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-300">🔒 Security: </span>
            Your verification code is sent securely and will expire after 10 minutes for your protection.
          </p>
        </div>
      </div>
    </div>
  );
}