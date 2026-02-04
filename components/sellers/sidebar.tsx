"use client";

import {
  LayoutGrid,
  ShoppingCart,
  BarChart3,
  X,
  Menu,
  DollarSign,
} from "lucide-react";
import { Bell, Clock, FileText, Headphones, User, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/luxela.svg";
import { usePathname } from "next/navigation";
import { useSellerProfile } from "@/modules/sellers/queries/useSellerProfile";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/hooks/useToast";
import { useNotifications, usePendingOrders } from "@/modules/sellers";
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


export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const toast = useToast();
    const [open, setOpen] = useState(false);
    const { logout } = useAuth();
  
  // Get notification and pending order counts
  const { data: notifications = [] } = useNotifications();
  const { data: pendingOrders = [] } = usePendingOrders();
  const { data: sellerProfileData } = useSellerProfile();
  
  const unreadNotificationCount = notifications.filter((n: any) => !n.isRead).length;
  const pendingOrderCount = pendingOrders.length;

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Use TRPC hook for seller profile data that automatically updates when cache is invalidated
  const user = sellerProfileData?.seller && sellerProfileData.business
    ? {
        fullName: sellerProfileData.business.fullName || "Seller",
        role: "seller",
        email: sellerProfileData.business.officialEmail,
        avatarUrl: sellerProfileData.seller.profilePhoto || "https://via.placeholder.com/30"
      }
    : null;

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


  return (
    <>
      {/* Mobile Menu Button - Hidden on lg screens */}
   <button
  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  className="lg:hidden fixed top-3 left-4 z-[70] p-2 rounded-lg bg-[#141414] shadow-lg hover:bg-[#1f1f1f] transition-colors cursor-pointer"
  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
>
  {isMobileMenuOpen ? (
    <X size={24} className="text-[#f1f1f1]" />
  ) : (
    <Menu size={24} className="text-[#f1f1f1]" />
  )}
</button>
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden pt-16"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 overflow-y-auto bg-[#121212] border-r border-[#222] z-[60] lg:z-auto pt-0 w-64 flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:pt-16`}
      >
        {/* Logo - Only visible on mobile */}
        <div className="lg:hidden px-4 py-4 border-b border-[#222] flex items-center justify-center sticky top-0 bg-[#121212] z-20 mt-16">
          <Image
            src={Logo}
            alt="LUXELA"
            width={120}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </div>

        <nav className="flex-1 px-4 py-2">
          <ul className="space-y-1">
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive("/sellers/dashboard")
                    ? "bg-[#1e1e1e]"
                    : "hover:bg-[#1e1e1e]"
                }`}
              >
                <LayoutGrid size={20} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/my-listings"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive("/sellers/my-listings")
                    ? "bg-[#1e1e1e]"
                    : "hover:bg-[#1e1e1e]"
                }`}
              >
                <ShoppingCart size={20} />
                <span>My listings</span>
              </Link>
            </li>
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/sales"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive("/sellers/sales")
                    ? "bg-[#1e1e1e]"
                    : "hover:bg-[#1e1e1e]"
                }`}
              >
                <BarChart3 size={20} />
                <span>Sales</span>
              </Link>
            </li>
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/notifications"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive("/sellers/notifications")
                    ? "bg-[#1e1e1e]"
                    : "hover:bg-[#1e1e1e]"
                } relative`}
              >
                <Bell size={20} />
                <span>Notifications</span>
                {unreadNotificationCount > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/pending-orders"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive("/sellers/pending-orders")
                    ? "bg-[#1e1e1e]"
                    : "hover:bg-[#1e1e1e]"
                } relative`}
              >
                <Clock size={20} />
                <span>Pending orders</span>
                {pendingOrderCount > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingOrderCount > 99 ? '99+' : pendingOrderCount}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/reports"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive("/sellers/reports")
                    ? "bg-[#1e1e1e]"
                    : "hover:bg-[#1e1e1e]"
                }`}
              >
                <FileText size={20} />
                <span>Reports</span>
              </Link>
            </li>
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/payouts"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive("/sellers/payouts")
                    ? "bg-[#1e1e1e]"
                    : "hover:bg-[#1e1e1e]"
                }`}
              >
                <DollarSign size={20} />
                <span>Payouts</span>
              </Link>
            </li>
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/account"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  isActive("/sellers/account")
                    ? "bg-[#1e1e1e]"
                    : "hover:bg-[#1e1e1e]"
                }`}
              >
                <User size={20} />
                <span>Account</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-auto px-4 py-6">
          <ul className="space-y-1">
            <li>
              <Link
                onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/support"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#1e1e1e]"
              >
                <Headphones size={20} />
                <span>Contact support</span>
              </Link>
            </li>
            <li>
              <Link
               onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                href="/sellers/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#1e1e1e]"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </li>
          </ul>


          {user && (
            <div className="relative mt-10">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center bg-stone-800/40 rounded-sm px-2 justify-between gap-3 py-2 hover:bg-stone-800/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={user.avatarUrl}
                    alt="User"
                    width={30}
                    height={30}
                    className="rounded-sm"
                  />
                  <div className="text-left">
                    <p className="text-sm capitalize truncate max-w-28 font-medium text-white">
                      {user.fullName}
                    </p>
                    <p className="text-xs capitalize text-gray-500">{user.role}</p>
                  </div>
                </div>
                <ChevronDown
                fill="#8451E1"
                  size={20}
                  className={`text-purple-700 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-black rounded-lg shadow-lg border border-purple-700/30 overflow-hidden">
                     <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogOverlay />
                    <AlertDialogTrigger asChild>
                      <button
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-stone-700/30 transition-colors border-gray-700 cursor-pointer"
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
              )}
            </div>
          )}
        </div>      
      </div>
    </>
  );
}