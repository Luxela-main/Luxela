"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Store, ShoppingBag } from "lucide-react";

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRoleSelection = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      // Update user metadata with selected role
      const { error } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });

      if (error) throw error;

      // Redirect based on role
      if (selectedRole === "seller") {
        router.push("/sellers/dashboard");
      } else {
        router.push("/buyer/profile");
      }
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
        <div className="text-center mb-12">
          <img src="/luxela.svg" alt="Luxela Logo" className="w-40 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">Welcome to Luxela!</h1>
          <p className="text-zinc-400">Choose how you'd like to use Luxela</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Buyer Option */}
          <button
            onClick={() => setSelectedRole("buyer")}
            className={`p-8 rounded-xl border-2 transition-all ${selectedRole === "buyer"
                ? "border-purple-500 bg-purple-500/10"
                : "border-zinc-700 hover:border-zinc-600"
              }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full ${selectedRole === "buyer" ? "bg-purple-500/20" : "bg-zinc-800"
                }`}>
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">I want to buy</h3>
                <p className="text-sm text-zinc-400">
                  Discover and purchase unique fashion items from sellers around the world
                </p>
              </div>
            </div>
          </button>

          {/* Seller Option */}
          <button
            onClick={() => setSelectedRole("seller")}
            className={`p-8 rounded-xl border-2 transition-all ${selectedRole === "seller"
                ? "border-purple-500 bg-purple-500/10"
                : "border-zinc-700 hover:border-zinc-600"
              }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full ${selectedRole === "seller" ? "bg-purple-500/20" : "bg-zinc-800"
                }`}>
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">I want to sell</h3>
                <p className="text-sm text-zinc-400">
                  Showcase your fashion items and reach customers globally
                </p>
              </div>
            </div>
          </button>
        </div>

        <Button
          onClick={handleRoleSelection}
          disabled={!selectedRole || isSubmitting}
          className="w-full max-w-[400px] mx-auto bg-gradient-to-b from-purple-600 to-purple-400 via-purple-500 hover:from-purple-700 hover:to-purple-500 disabled:opacity-50"
        >
          {isSubmitting ? "Setting up your account..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}