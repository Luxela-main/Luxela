import React, { useState } from "react";
import { CreditCard, Wallet } from "lucide-react";

type PaymentOption = "card" | "wallet" | null;

const PaymentMethods: React.FC = () => {
  const [selected, setSelected] = useState<PaymentOption>(null);

  return (
    <div className="w-full max-w-md mx-auto bg-[#111] text-white p-6 rounded-xl border border-neutral-800 shadow-md">
      <h2 className="text-sm font-medium mb-4">Payment Methods</h2>

      <div
        className={`flex flex-col gap-3 p-4 rounded-lg cursor-pointer border transition ${
          selected === "card"
            ? "border-purple-500 bg-purple-950/20"
            : "border-neutral-700 hover:border-neutral-500"
        }`}
        onClick={() => setSelected("card")}>
        <div className="flex items-center gap-3">
          <input
            type="radio"
            checked={selected === "card"}
            onChange={() => setSelected("card")}
            className="accent-purple-500"
          />
          <CreditCard size={18} />
          <span className="text-sm">Add a new card</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <img src="/visa.svg" alt="VISA" className="h-6" />
          <img src="/mastercard.svg" alt="MasterCard" className="h-6" />
          <img src="/opay.svg" alt="Opay Checkout" className="h-6" />
        </div>
      </div>

      <div
        className={`flex flex-col gap-3 mt-5 p-4 rounded-lg cursor-pointer border transition ${
          selected === "wallet"
            ? "border-purple-500 bg-purple-950/20"
            : "border-neutral-700 hover:border-neutral-500"
        }`}
        onClick={() => setSelected("wallet")}>
        <div className="flex items-center gap-3">
          <input
            type="radio"
            checked={selected === "wallet"}
            onChange={() => setSelected("wallet")}
            className="accent-purple-500"
          />
          <Wallet size={18} />
          <span className="text-sm">Add Wallet</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { name: "Phantom", icon: "/phantom.svg" },
            { name: "Solflare", icon: "/solflare.svg" },
            { name: "Backpack", icon: "/backpack.svg" },
            { name: "Wallet Connect", icon: "/walletconnect.svg" },
          ].map((wallet) => (
            <button
              key={wallet.name}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-md text-xs transition">
              <img src={wallet.icon} alt={wallet.name} className="h-4" />
              {wallet.name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-neutral-400 mt-5">
        <span className="text-yellow-500 mr-1">?</span>I don’t have a wallet{" "}
        <a href="#" className="text-purple-400 hover:underline ml-1">
          click here
        </a>
      </p>
    </div>
  );
};

export default PaymentMethods;
