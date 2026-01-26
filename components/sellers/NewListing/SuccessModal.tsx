// SuccessModal.tsx
import { Button } from "@/components/ui/button";
import React from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onView: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onView }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-75 flex items-center justify-center z-50">
      <div className="h-60 bg-[#141414] border border-purple-700 rounded-2xl p-8 max-w-lg w-full mx-4 text-center items-center flex justify-center flex-col">
        <h2 className="text-lg font-semibold text-[#f2f2f2] mb-6">
          Product listed successfully!
        </h2>

        <div className="cursor-pointer rounded-md text-white bg-linear-to-b from-[#8451E1] via-#8451E1] to-[#5C2EAF] py-3 px-12">
          <button
            onClick={onView}
            className="rounded-md w-full h-full flex items-center justify-center "
          >
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
