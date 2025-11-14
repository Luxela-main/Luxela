"use client";
import { useState } from "react";
import { useToast } from "@/components/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Header } from "../../app/signup/components/header";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const [agreed, setAgreed] = useState<boolean>(false);
  const router = useRouter();
  const toast = useToast();

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.warning("You must agree to the terms and conditions.");
      return;
    }
    router.push("/");
  };

  const handleDecline = () => {
    console.log("Terms declined");
    router.back();
  };

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gradient-to-b from-[#141414] via-[#1a1a1a] to-[#141414] text-white flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl">
          {/* Sticky Title */}
          <div className="sticky top-0 bg-[#1a1a1a] z-10 pb-4 mb-4 border-b border-gray-700">
            <h2 className="text-3xl font-bold text-purple-400">
              Terms of Agreement
            </h2>
          </div>

          {/* Scrollable Content */}
          <div className="text-sm text-gray-300 space-y-6 mb-6 overflow-y-auto pr-3 max-h-[26rem] custom-scrollbar leading-relaxed">
            <p>
              Luxela is a global fashion marketplace that allows buyers and
              sellers to transact in both fiat currencies and digital assets,
              including SOL and stablecoins like USDC on the Solana blockchain.
              By accessing or using Luxela’s platform, website, or related
              services (“Services”), you agree to the following terms:
            </p>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                1. Acceptance of Terms
              </h2>
              <p>
                By using Luxela, you acknowledge that you have read, understood,
                and agreed to this Agreement. If you do not agree, you may not
                use the platform.
              </p>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                2. Eligibility
              </h2>
              <p>To use Luxela, you must:</p>
              <li>
                Be at least 18 years of age or the age of majority in your
                jurisdiction.
              </li>
              <li>Have the legal capacity to enter into binding agreements.</li>
              <li>
                Comply with all applicable local and international laws related
                to financial transactions and digital assets.
              </li>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                3. Platform Purpose
              </h2>
              <p>
                Luxela connects buyers and sellers globally. We support
                purchases through:
              </p>
              <li>Fiat payments via local providers.</li>
              <li>
                Stablecoins on Solana (e.g., USDC, USDT) <br />
                All products must be authentic, and sellers are independently
                responsible for quality and delivery.
              </li>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                4. User Accounts and Wallets
              </h2>
              <p>
                You must create an account to use certain features. You may:
              </p>
              <li>Connect a Phantom or compatible Solana wallet.</li>
              <li>
                Link bank accounts or payment methods for fiat transactions{" "}
                <br />
                You are responsible for keeping your login credentials secure.
              </li>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                5. Fees and Payment
              </h2>
              <li>
                Buyers pay the price listed by the seller; sellers pay a 1%
                platform fee per sale.
              </li>
              <li>
                Currency payment can be refunded as we use an escrow payment,
                all refunds are subject to sellers refund policy.
              </li>
              <li>
                Fiat refunds are subject to seller policy and applicable law.
              </li>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                6. Authenticity and Standards
              </h2>
              <p>
                Luxela prohibits counterfeit, misleading, or illegal items.
                Accounts selling such products may be suspended or removed.
              </p>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                7. Currency Volatility
              </h2>
              <p>
                For blockchain transactions, exchange rates may fluctuate.
                Luxela does not bear responsibility for price volatility or
                finality of crypto transactions.
              </p>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                8. You may not use Luxela to:
              </h2>
              <li>
                Engage in money laundering or unlawful financial activities.
              </li>
              <li>Sell prohibited goods.</li>
              <li>
                Harm, defraud, or harass other users or the platform <br />
                Violations may lead to immediate suspension or legal action.
              </li>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                9. Intellectual Property
              </h2>
              <p>
                All platform content, branding, and code belong to Luxela. You
                may not copy or reuse them without written permission.
              </p>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                10. Termination
              </h2>
              <p>
                Luxela reserves the right to suspend or terminate your account
                at any time for violating these terms or any applicable laws.
              </p>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                11. Limitation of Liability
              </h2>
              <p>To the extent allowed by law, Luxela is not liable for:</p>
              <li>Indirect, incidental, or consequential damages.</li>
              <li>
                Losses from currency fluctuations or fraudulent activity by
                other users.
              </li>
            </ul>

            <ul>
              <h2 className="text-lg font-semibold text-purple-300">
                12. Updates to Terms
              </h2>
              <p>
                We may revise these terms at any time. Continued use of Luxela
                constitutes your acceptance of any updates.
              </p>
            </ul>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start space-x-3 text-sm text-gray-300 mb-6">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-purple-500"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              By clicking “Accept”, you agree to our{" "}
              <span className="text-purple-400 underline cursor-pointer">
                Terms of Agreement
              </span>{" "}
              and{" "}
              <span className="text-purple-400 underline cursor-pointer">
                Privacy Policies
              </span>
              .
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 w-full items-center justify-center">
            <Button
              className="bg-purple-600 hover:bg-purple-700 px-12 py-3 rounded-lg text-lg font-semibold"
              onClick={handleProceed}>
              Proceed
            </Button>
            <Button
              variant="outline"
              className="border-gray-500 text-gray-300 hover:bg-gray-800 px-12 py-3 rounded-lg text-lg font-semibold"
              onClick={handleDecline}>
              Decline
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(168, 85, 247, 0.6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </>
  );
}
