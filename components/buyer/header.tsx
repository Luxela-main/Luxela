"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, ChevronDown, Search, ShoppingCart } from "lucide-react";
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

const NAVLINKS = [
  { name: "Home", href: "/buyer" },
  { name: "Brands", href: "/buyer/brands" },
  { name: "Collections", href: "/buyer/collections" },
];


const BuyerHeader = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const username =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const userPicture = user.user_metadata?.avatar_url || "/assets/image 38.png";

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
    <nav className="z-[999] bg-[#0E0E0E] px-3 md:px-6 py-[18px] border-b border-[#2B2B2B] w-full ">
      <div className="w-full md:flex items-center md:justify-between layout">
        {/* Left Links */}
        <div className="flex items-center gap-6">
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

        {/* Logo */}
        <div className="hidden md:block">
          <Image
            src={"/images/Luxela-white-logo-200x32.svg"}
            width={200}
            height={32}
            alt="Luxela logo"
          /></div>

        {/* Right Actions */}
        <div className="flex justify-between items-center gap-5 mt-10 md:mt-0">
          <div className="items-center gap-3 flex">
            <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out">
              <Search stroke="#DCDCDC" className="size-4 md:size-6" />
            </button>
            <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out">
              <Bell stroke="#DCDCDC" className="size-4 md:size-6" />
            </button>
            <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out">
              <ShoppingCart stroke="#DCDCDC" className="size-4 md:size-6" />
            </button>
          </div>

          {/* User Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-xs md:text-sm text-[#F2F2F2] px-4 py-1 shadow-[inset_0_0_0_1px_#212121] rounded-[4px] hover:bg-[#1a1a1a]">
                <div className="size-8 overflow-hidden rounded-full">
                  <Image
                    src={userPicture}
                    width={40}
                    height={40}
                    alt="User avatar"
                    className="size-full rounded-full"
                  />
                </div>
                <span className="max-w-20 truncate hidden md:block">{username}</span>
                <ChevronDown size={20} stroke="#DCDCDC" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 z-[101] bg-[#0E0E0E] border border-[#2B2B2B]"
            >
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Track Order
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Track Order
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2B2B2B]" />
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Return and Refund
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Return and Refund
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2B2B2B]" />
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Help Centre
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Help Centre
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-[#2B2B2B]" />

              {/* Logout Confirmation */}
              <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogOverlay />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer text-red-400"
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
        </div>
      </div>

    </nav >
  );
};

export default BuyerHeader;
