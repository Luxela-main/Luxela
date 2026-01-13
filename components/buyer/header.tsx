"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, ChevronDown, Search, ShoppingCart, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/components/hooks/useToast";
import { useProfile } from "@/context/ProfileContext";
import { useCartState } from "@/modules/cart/context";

const NAVLINKS = [
  { name: "Home", href: "/buyer" },
  { name: "Brands", href: "/buyer/brands" },
  { name: "Collections", href: "/buyer/collections" },
];

const USER_DROPDOWN = [
  { name: "My Account", href: "/buyer/dashboard" },
  { name: "Track Order", href: "/buyer/dashboard/orders" },
  { name: "Return and Refund", href: "#" },
  { name: "Profile", href: "/buyer/profile" },
  { name: "Help Centre", href: "#" },
];

const BuyerHeader = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, loading } = useProfile();
  const { cart } = useCartState();
  const itemCount = cart?.items?.length || 0;

  const username = profile?.username || user?.email?.split("@")[0] || "User";
  const userPicture = profile?.profilePicture || "/images/seller/sparkles.svg";

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
      <nav className="z-[999] bg-[#0E0E0E] px-3 md:px-6 py-[18px] border-b border-[#2B2B2B] w-full">
        <div className="w-full flex items-center justify-between layout">
          {/* Mobile: Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden cursor-pointer p-2 bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121]"
          >
            {mobileMenuOpen ? (
              <X stroke="#DCDCDC" className="size-6" />
            ) : (
              <Menu stroke="#DCDCDC" className="size-6" />
            )}
          </button>

          {/* Desktop: Left Links */}
          <div className="hidden md:flex items-center gap-6">
            {NAVLINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[#DCDCDC] text-xs md:text-sm py-3 hover:transform hover:text-[#9872DD] hover:-translate-y-[1px] duration-300 ease-in-out"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Logo - Centered on mobile, normal on desktop */}
          <div className="md:block">
            <Link href="/" className="block w-[100px] md:w-[132px] h-auto">
              <Image
                src={"/images/Luxela-white-logo-200x32.svg"}
                width={200}
                height={32}
                alt="Luxela logo"
                className="w-full h-auto"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            {/* Desktop Icons */}
            <div className="hidden md:flex items-center gap-3">
              <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out">
                <Search stroke="#DCDCDC" className="size-6" />
              </button>
              <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out">
                <Bell stroke="#DCDCDC" className="size-6" />
              </button>
              {/* Desktop: Cart Icon */}

              <Link href={user ? "/cart" : "/signin?redirect=/cart"}>
                <button className="relative cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out group">
                  <ShoppingCart stroke="#DCDCDC" className="size-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#0E0E0E]">
                      {itemCount}{" "}
                    </span>
                  )}
                </button>
              </Link>
            </div>

            {/* Mobile: Cart Icon */}

            <Link href={user ? "/cart" : "/signin?redirect=/cart"}>
              <button className="md:hidden relative cursor-pointer p-2 bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121]">
                <ShoppingCart stroke="#DCDCDC" className="size-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {itemCount}{" "}
                  </span>
                )}
              </button>
            </Link>

            {/* User Dropdown or Sign In */}
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex cursor-pointer items-center gap-2 text-xs md:text-sm text-[#F2F2F2] px-2 md:px-4 py-1 shadow-[inset_0_0_0_1px_#212121] rounded-[4px] hover:bg-[#1a1a1a]">
                    <div className="size-7 md:size-8 overflow-hidden rounded-full">
                      <Image
                        src={userPicture}
                        width={40}
                        height={40}
                        alt="User avatar"
                        className="size-full rounded-full"
                      />
                    </div>
                    <span className="max-w-20 truncate hidden md:block">
                      {username}
                    </span>
                    <ChevronDown
                      size={18}
                      stroke="#DCDCDC"
                      className="hidden md:block"
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-56 z-[101] bg-[#0E0E0E] border border-[#2B2B2B]"
                >
                  <DropdownMenuGroup>
                    {USER_DROPDOWN.map((item) => (
                      <React.Fragment key={item.name}>
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in"
                        >
                          <Link href={item.href}>{item.name}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2B2B2B]" />
                      </React.Fragment>
                    ))}
                  </DropdownMenuGroup>

                  <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogOverlay />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="cursor-pointer text-red-400 hover:bg-red-600! hover:text-white!"
                      >
                        Log out
                      </DropdownMenuItem>
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
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/signin">
                <button className="flex cursor-pointer items-center gap-2 text-xs md:text-sm text-[#F2F2F2] px-4 md:px-6 py-2 bg-gradient-to-b from-[#9872DD] via-#8451E1] to-[#5C2EAF] rounded-[4px] hover:bg-[#8662cc] transition-colors duration-300 ease-in-out">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[998] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in Menu */}
          <div className="fixed top-[70px] left-0 w-64 h-[calc(100vh-70px)] bg-[#0E0E0E] border-r border-[#2B2B2B] z-[999] md:hidden overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Navigation Links */}
              <div className="space-y-4">
                {NAVLINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-[#DCDCDC] text-sm py-2 hover:text-[#9872DD] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 text-[#DCDCDC] text-sm py-3 px-4 rounded-[4px] shadow-[inset_0_0_0_1px_#212121]">
                  <Search stroke="#DCDCDC" className="size-5" />
                  <span>Search</span>
                </button>
                <button className="w-full flex items-center gap-3 text-[#DCDCDC] text-sm py-3 px-4 rounded-[4px] shadow-[inset_0_0_0_1px_#212121]">
                  <Bell stroke="#DCDCDC" className="size-5" />
                  <span>Notifications</span>
                </button>
              </div>

              {/* User Menu (when signed in) */}
              {user && (
                <div className="space-y-3 pt-4 border-t border-[#2B2B2B]">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider">
                    Account
                  </h3>
                  {USER_DROPDOWN.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-[#DCDCDC] text-sm py-2 hover:text-[#9872DD] transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setOpen(true);
                    }}
                    className="w-full text-left text-red-400 text-sm py-2 hover:text-red-300 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BuyerHeader;
