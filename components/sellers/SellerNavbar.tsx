"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, LogOut, Settings, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/hooks/useToast";
import { useSellerNotificationsCount, usePendingOrders } from "@/modules/sellers";
import { useSellerProfile } from "@/modules/sellers/queries/useSellerProfile";
import { useRealtimeSellerNotifications } from "@/hooks/useRealtimeSellerNotifications";
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
import Logo from "@/public/luxela.svg";

export default function SellerNavbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const toast = useToast();

  // Enable realtime notifications polling
  useRealtimeSellerNotifications();

  // Get notification count from badge query (lightweight, polls frequently)
  const { data: notificationCountData } = useSellerNotificationsCount();
  const unreadNotificationCount = notificationCountData?.count || 0;

  // Get pending order counts
  const { data: pendingOrders = [] } = usePendingOrders();
  const pendingOrderCount = pendingOrders.length;
  const totalAlerts = unreadNotificationCount + pendingOrderCount;

  // Get seller profile - automatically syncs when cache is invalidated
  const { data: profileData } = useSellerProfile();
  const user = profileData?.seller
    ? {
        avatarUrl:
          profileData.seller.profilePhoto || "/default-avatar.png",
        fullName: profileData.business?.fullName || "Seller",
        email: profileData.business?.officialEmail,
      }
    : null;

  const handleLogout = async () => {
    try {
      await logout();
      // AuthContext handles navigation to /signin automatically
      toast.success("You have been successfully logged out.");
    } catch (err) {
      toast.error("Something went wrong while logging out.");
    } finally {
      setOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 w-full bg-[#121212] border-b border-[#222] bg-opacity-95">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16 w-full">
        {/* Left - Logo (hidden on mobile, shown on tablet and desktop) */}
        <Link
          href="/sellers/dashboard"
          className="hidden md:flex items-center flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <Image
            src={Logo}
            alt="LUXELA"
            width={140}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </Link>

        {/* Center - Spacer */}
        <div className="flex-1" />

        {/* Right - Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications & Pending Orders Alert */}
          {totalAlerts > 0 && (
            <div className="hidden sm:flex gap-1 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              {unreadNotificationCount > 0 && (
                <span className="text-xs font-medium text-red-400">
                  {unreadNotificationCount} message
                  {unreadNotificationCount > 1 ? "s" : ""}
                </span>
              )}
              {unreadNotificationCount > 0 && pendingOrderCount > 0 && (
                <span className="text-red-400/50">•</span>
              )}
              {pendingOrderCount > 0 && (
                <span className="text-xs font-medium text-red-400">
                  {pendingOrderCount} pending
                </span>
              )}
            </div>
          )}

          {/* Notifications Button */}
          <Link
            href="/sellers/notifications"
            className="relative p-2 rounded-lg hover:bg-[#1e1e1e] transition-colors cursor-pointer group"
          >
            <Bell size={20} className="text-[#f1f1f1] group-hover:text-purple-400 transition-colors" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg shadow-red-500/50 group-hover:animate-none group-hover:shadow-red-500/75 transition-all">
                {unreadNotificationCount > 99
                  ? "99+"
                  : unreadNotificationCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {user && (
            <div 
              className="relative"
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
            >
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg hover:bg-[#1e1e1e] transition-colors group cursor-pointer"
              >
                <Image
                  src={user.avatarUrl}
                  alt={user.fullName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-md object-cover"
                />
                <div className="hidden sm:flex flex-col items-start">
                  <p className="text-sm font-medium text-white truncate max-w-[100px]">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-400">Seller</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ml-1 hidden sm:block ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {(isUserMenuOpen || isProfileHovered) && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] rounded-lg shadow-xl border border-[#2B2B2B] overflow-hidden">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-[#2B2B2B]">
                    <p className="text-sm font-medium text-white truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/sellers/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-[#242424] transition-colors"
                    >
                      <User size={16} />
                      <span>Account</span>
                    </Link>

                    <Link
                      href="/sellers/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-[#242424] transition-colors"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>

                    <div className="border-t border-[#2B2B2B]">
                      <AlertDialog open={open} onOpenChange={setOpen}>
                        <AlertDialogOverlay />
                        <AlertDialogTrigger asChild>
                          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                            <LogOut size={16} />
                            <span>Log out</span>
                          </button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="bg-[#0E0E0E] border border-[#2B2B2B] text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Are you sure you want to log out of your seller
                              account?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-[#141414] text-white border border-[#2B2B2B] hover:bg-[#1a1a1a]">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleLogout}
                              className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                            >
                              Log out
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}