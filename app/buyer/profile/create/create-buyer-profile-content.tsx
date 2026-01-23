"use client";

import { Suspense } from "react";
import CreateBuyerProfileForm from "./create-form";

function LoadingFallback() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md mx-auto mt-10">
      <h2 className="text-xl font-medium mb-6 text-white">
        Create Your Profile to Continue
      </h2>
      <div className="text-[#7e7e7e]">Loading profile form...</div>
    </div>
  );
}

export default function CreateBuyerProfileContent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreateBuyerProfileForm />
    </Suspense>
  );
}