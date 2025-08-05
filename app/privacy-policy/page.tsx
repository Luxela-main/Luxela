"use client";
import { Button } from "@/components/ui/button"
  ;
import Header from "../user-onboarding/components/header";
import { useRouter } from "next/navigation";

export default function SignUpPage() {

  const router = useRouter();

  const handleProceed = () => {
    console.log("Terms accepted");
    router.push("../../page.tsx");
  };
  const handleDecline = () => {
    console.log("Terms declined");
    router.push("../page.tsx");
  }
  return (
    <>
      <Header />

      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-zinc-900 rounded-xl p-10 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">Terms of Agreement</h2>

          <div className="text-sm text-gray-300 space-y-4 mb-6 h-64 overflow-y-scroll pr-2">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
            </p>
          </div>

          <form className="space-y-4">
            <label className="flex items-start space-x-2 text-sm text-gray-300">
              <input type="checkbox" className="mt-1" />
              <span>
                By clicking “Accept”, you agree to our Terms of Agreement and Privacy Policies
              </span>
            </label>

            <div className="flex space-x-4 pt-2">
              <Button
                className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto px-6 py-2 rounded-md"
                onClick={(e) => {
                  e.preventDefault();

                }}
              >
                Proceed
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto px-6 py-2">
                Decline
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
