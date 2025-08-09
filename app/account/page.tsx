"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { signOut, getAuth } from "firebase/auth";
import {
  User as UserIcon,
  LogOut,
  Settings,
  ShoppingBag,
  List,
  AlertCircle,
  FileText,
  Store,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/components/hooks/useToast";
import { Loader } from "@/components/loader/loader";

const AccountPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/signin");
    } catch (err: any) {
      toast.error(err.message || "Logout failed");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 md:px-20">
      <div className="max-w-3xl mx-auto bg-zinc-900 rounded-xl shadow-md p-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div>
            <ArrowLeft
              className="h-8 w-8 cursor-pointer"
              onClick={router.back}
            />
          </div>
          <div className="h-16 w-16 rounded-full overflow-hidden border border-white/20">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt="Profile"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {user.displayName || user.email}
            </h2>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>

        {/* Account Menu */}
        <div className="space-y-4">
          <button
            onClick={() => router.push("/sellers/pending-orders")}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded px-5 py-3 text-left transition">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4" />
              <span>My Orders</span>
            </div>
            <span className="text-zinc-400 text-sm">View</span>
          </button>

          <button
            onClick={() => router.push("/sellers/sales")}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded px-5 py-3 text-left transition">
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4" />
              <span>Sales</span>
            </div>
            <span className="text-zinc-400 text-sm">View</span>
          </button>

          <button
            onClick={() => router.push("/sellers/my-listings")}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded px-5 py-3 text-left transition">
            <div className="flex items-center space-x-2">
              <List className="h-4 w-4" />
              <span>My Listings</span>
            </div>
            <span className="text-zinc-400 text-sm">View</span>
          </button>

          <button
            onClick={() => router.push("/sellers/reports")}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded px-5 py-3 text-left transition">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </div>
            <span className="text-zinc-400 text-sm">View</span>
          </button>

          <button
            onClick={() => router.push("/sellers/notifications")}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded px-5 py-3 text-left transition">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Notifications</span>
            </div>
            <span className="text-zinc-400 text-sm">View</span>
          </button>

          <button
            onClick={() => router.push("/sellers/support")}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded px-5 py-3 text-left transition">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span>Support</span>
            </div>
            <span className="text-zinc-400 text-sm">View</span>
          </button>

          <button
            onClick={() => router.push("/sellers/settings")}
            className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded px-5 py-3 text-left transition">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
            <span className="text-zinc-400 text-sm">Manage</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between bg-red-600 hover:bg-red-700 rounded px-5 py-3 text-left transition text-white">
            <div className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
