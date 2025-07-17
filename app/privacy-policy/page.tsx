"use client";
import { Button } from "@/components/ui/Button";
import Header from "../user-onboarding/components/header";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/hooks/useToast";

export default function SignUpPage() {

  const [agreed, setAgreed] = useState<boolean>(false)

  const router = useRouter();
  const toast = useToast()

  const handleProceed = (e: React.FormEvent) => {

    e.preventDefault()

    if (!agreed) {
      toast.warning("You must agree to the terms and conditions.");
      return;
    }

    router.push("/");
  };
  const handleDecline = () => {
    console.log("Terms declined");
    router.back()
  }
  return (
    <>
      <Header />

      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-zinc-900 rounded-xl p-10 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">Terms of Agreement</h2>

          <div className="text-sm text-gray-300 space-y-4 mb-6 h-64 overflow-y-scroll pr-2">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </div>

          <form className="space-y-4" >
            <label className="flex items-start space-x-2 text-sm text-gray-300">
             <input
              type="checkbox"
              className="mr-2 mt-1 accent-purple-600"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
              <span>
                By clicking “Accept”, you agree to our Terms of Agreement and Privacy Policies
              </span>
            </label>

            <div className="flex pt-2 w-full items-center justify-center space-x-4">
              <Button
                className="bg-purple-600 hover:bg-purple-700 px-12 sm:w-auto rounded-md"
                onClick={handleProceed}
              >
                Proceed
              </Button>
              <Button variant="outline" className="sm:w-auto px-12" onClick={() =>handleDecline()}>
                Decline
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
