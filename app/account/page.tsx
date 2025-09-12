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

  // Config for menu items
  const menuItems = [
    { label: "My Orders", icon: ShoppingBag, href: "/sellers/pending-orders" },
    { label: "Sales", icon: Store, href: "/sellers/sales" },
    { label: "My Listings", icon: List, href: "/sellers/my-listings" },
    { label: "Reports", icon: FileText, href: "/sellers/reports" },
    {
      label: "Notifications",
      icon: AlertCircle,
      href: "/sellers/notifications",
    },
    { label: "Support", icon: HelpCircle, href: "/sellers/support" },
    {
      label: "Settings",
      icon: Settings,
      href: "/sellers/settings",
      action: "Manage",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 md:px-20">
      <div className="max-w-3xl mx-auto bg-zinc-900 rounded-xl shadow-md p-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <ArrowLeft className="h-8 w-8 cursor-pointer" onClick={router.back} />
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
          {menuItems.map(({ label, icon: Icon, href, action }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded px-5 py-3 text-left transition cursor-pointer">
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              <span className="text-zinc-400 text-sm">{action || "View"}</span>
            </button>
          ))}

          {/* Sign Out */}
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
