"use client";

import { Bell, ChevronDown, Search, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

const NAVLINKS = [
  { name: "Home", href: "/buyer" },
  { name: "Brands", href: "/buyer/brands" },
  { name: "Collections", href: "/buyer/collections" },
];

const BuyerHeader = () => {
  const router = useRouter();
  return (
    <nav className="z-[999] bg-[#0E0E0E] px-6 py-[18px] border-b border-[#2B2B2B] w-full ">
      <div className="w-full flex items-center justify-between">
        {/* Left Links */}
        <div className="flex items-center gap-6">
          {NAVLINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[#DCDCDC] text-xs md:text-sm py-3 hover:transform hover:text-[#9872DD] hover:-translate-y-[1px] duration-300 ease-in-out">
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
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-5">
          <div className="items-center gap-3 hidden md:flex">
            <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:transform hover:-translate-y-[1px] duration-300 ease-in-out">
              <Search stroke="#DCDCDC" className="size-4 md:size-6" />
            </button>
            <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:transform hover:-translate-y-[1px] duration-300 ease-in-out">
              <Bell stroke="#DCDCDC" className="size-4 md:size-6" />
            </button>
            <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:transform hover:-translate-y-[1px] duration-300 ease-in-out">
              <ShoppingCart
                stroke="#DCDCDC"
                className="size-4 md:size-6"
                onClick={() => router.push("/cart")}
              />
            </button>
          </div>

          {/* User Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 text-xs md:text-sm text-[#F2F2F2] px-4 py-1 shadow-[inset_0_0_0_1px_#212121] active:shadow-[inset_0_0_0_1px_#212121] rounded-[4px] hover:bg-[#1a1a1a] 
               focus:outline-none focus:ring-0 focus:ring-offset-0">
                <div className="size-8 overflow-hidden rounded-full">
                  <Image
                    src={"/assets/image 38.png"}
                    width={40}
                    height={40}
                    alt="User avatar"
                    className="size-full rounded-full"
                  />
                </div>
                <span className="max-w-20 truncate">jondoe54</span>
                <ChevronDown size={20} stroke="#DCDCDC" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 z-[101] bg-[#0E0E0E] border border-[#2B2B2B]">
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Track Order
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2B2B2B]" />
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Return and Refund
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2B2B2B]" />
                <DropdownMenuItem className="cursor-pointer text-[#F2F2F2] hover:!text-[#000] transition-colors duration-300 ease-in">
                  Help Centre
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-[#2B2B2B]" />
              <DropdownMenuItem className="cursor-pointer text-red-400">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* mobile action */}
      <div className="items-center gap-3 flex md:hidden mt-4">
        <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:transform hover:-translate-y-[1px] duration-300 ease-in-out">
          <Search stroke="#DCDCDC" className="size-4 md:size-6" />
        </button>
        <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:transform hover:-translate-y-[1px] duration-300 ease-in-out">
          <Bell stroke="#DCDCDC" className="size-4 md:size-6" />
        </button>
        <button className="cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:transform hover:-translate-y-[1px] duration-300 ease-in-out">
          <ShoppingCart stroke="#DCDCDC" className="size-4 md:size-6" />
        </button>
      </div>
    </nav>
  );
};

export default BuyerHeader;
