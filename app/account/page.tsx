"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "../../utils/supabase/client";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AccountPage = () => {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);


  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been successfully logged out.");
    } catch (err) {
      toast.error("Something went wrong while logging out.");
    } finally {
      setOpen(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader />
      </div>
    );
  }


  const userPicture = user.user_metadata?.avatar_url || "/assets/image 38.png";
  const username =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

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
            {userPicture ? (
              <Image
                src={userPicture}
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
              {username}
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

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogOverlay />
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center justify-between bg-red-600 hover:bg-red-700 rounded px-5 py-3 text-left transition text-white"
              >
                Log out
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="bg-[#0E0E0E] border border-[#2B2B2B] text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Are you sure you want to log out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-[#141414] text-white border border-[#2B2B2B] hover:bg-[#1a1a1a]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
