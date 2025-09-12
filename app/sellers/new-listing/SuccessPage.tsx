import React from "react";
import Link from "next/link";

interface SuccessPageProps {
  onReset: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onReset }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        className="w-[509px] h-[281px] rounded-[16px] bg-gradient-to-br from-[#151515] via-[#151515] to-[#141414] border border-[#8451E1] flex flex-col items-center justify-center space-y-6 p-6 text-white"
      >
        <h2 className="text-2xl font-semibold text-center">
          Product listed successfully!
        </h2>

        <div className="flex gap-4">
          <Link
            href="#"
            className="cursor-pointer w-[150px] h-[48px] flex items-center justify-center bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] transition rounded-[10px] px-6"
          >
            View
          </Link>
          <button
            onClick={onReset}
            className="w-[150px] h-[48px] flex items-center justify-center border border-[#8451E1] rounded-[10px] px-6 hover:bg-[#8451E1]/20 transition"
          >
            List Another
          </button>
        </div>
      </div>
    </div>
  );
};
