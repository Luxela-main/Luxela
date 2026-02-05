"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Store, ShoppingBag } from "lucide-react";

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] =
    useState<"buyer" | "seller" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Prevent logged-out access
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/signin");
        return;
      }
    };

    checkAuth();
  }, [router, supabase]);

  const handleRoleSelection = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/signin");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: { role: selectedRole },
      });

      if (error) throw error;

      router.replace(
        selectedRole === "seller"
          ? "/sellersAccountSetup"
        : "/buyer/profile/create"
      );
    } catch (error) {
      console.error("Error setting role:", error);
      alert("Failed to set role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full flex flex-col items-center">
        <div className="text-center mb-12 pb-6 border-b-2 border-[#ECE3BE]">
          <img
            src="/luxela.svg"
            alt="Luxela Logo"
            className="w-40 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold mb-2 text-white">Welcome to Luxela!</h1>
          <p className="text-[#EA795B]">
            Choose how you'd like to use Luxela
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedRole("buyer")}
            className={`p-8 rounded-xl border-2 transition-all ${selectedRole === "buyer"
                ? "border-[#BEECE3] bg-[#BEECE3]/10"
                : "border-[#ECE3BE] hover:border-[#BEECE3]"
              }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-zinc-800">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">I want to buy</h3>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole("seller")}
            className={`p-8 rounded-xl border-2 transition-all ${selectedRole === "seller"
                ? "border-[#BEE3EC] bg-[#BEE3EC]/10"
                : "border-[#ECE3BE] hover:border-[#BEE3EC]"
              }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-zinc-800">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">I want to sell</h3>
            </div>
          </button>
        </div>

        <Button
          onClick={handleRoleSelection}
          disabled={!selectedRole || isSubmitting}
          className="w-full max-w-[400px] bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? "Setting up your account..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}