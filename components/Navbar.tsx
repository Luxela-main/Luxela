"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  route: string;
}

const navItems: NavItem[] = [
  { name: "About Us", route: "#about" },
  { name: "Featured Brands", route: "#brands" },
  { name: "How To?", route: "#how-to" },
];

export default function Navbar() {
  const [sticky, setSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`z-50 transition-all duration-300 text-white ${
        sticky
          ? "sticky top-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-md"
          : "relative bg-transparent"
      }`}>
      <div className="container z-10 mx-auto px-2 md:px-10 py-4 flex justify-between items-center">
        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center space-x-9">
          {navItems.map((item) => (
            <li key={item.name + item.route}>
              <Link
                href={item.route}
                className="text-xs lg:text-sm hover:text-purple-500 transition">
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          className="cursor-pointer md:hidden text-white"
          onClick={() => setMobileMenuOpen(true)}>
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center w-[132px] md:w-[200px] h-[32px]">
          <Image
            src={"/images/Luxela-white-logo-200x32.svg"}
            width={200}
            height={32}
            className="w-full h-full"
            alt="Luxela logo"
          />
        </Link>

        <div className="flex items-center space-x-2">
          {user ? (
            <Link
              href="/sellers/dashboard"
              className="h-[42px] flex items-center text-sm hover:text-purple-500 transition px-6">
              Sell
            </Link>
          ) : (
            <Link
              href="/signin"
              className="h-[42px] flex items-center text-sm hover:text-purple-500 transition px-6">
              Sell
            </Link>
          )}

          <Link
            href="#"
            className="h-[42px] flex items-center space-x-2 border border-[#FFFFFF66]/40 hover:border-purple-500 transition text-white rounded-[4px] px-6">
            <span className="hidden md:block">Shop now</span>
            <ShoppingCart className="h-4 w-4" />
          </Link>

          {user ? (
            <Link
              href="/account"
              className="h-[42px] w-[42px] rounded-full overflow-hidden border border-white/30 hover:border-purple-500 transition">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  width={42}
                  height={42}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/signup"
              className="h-[42px] flex items-center text-sm hover:text-purple-500 transition px-6">
              <User size={24} />
              <span className="ml-2">Account</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && <MobileNav setMobileMenuOpen={setMobileMenuOpen} />}
    </nav>
  );
}

const MobileNav = ({
  setMobileMenuOpen,
}: {
  setMobileMenuOpen: (open: boolean) => void;
}) => {
  return (
    <div className="md:hidden flex flex-col fixed top-0 w-screen h-screen bg-[#0E0E0E] z-40 px-6 py-4">
      {/* Decorative lights/images */}
      <Image
        src={"/images/Light-852x785.svg"}
        width={852}
        height={785}
        alt="light effect"
        className="-z-1 absolute top-0 right-0 "
      />
      {/* Close Button and Logo */}
      <div className="flex items-center mt-5 w-full">
        <Link href="/" className="w-[132px] h-[21px] mx-auto ">
          <Image
            src={"/images/Luxela-white-logo-200x32.svg"}
            width={132}
            height={32}
            className="w-full h-full"
            alt="Luxela logo"
          />
        </Link>
        <button
          className="size-9 text-white ml-auto cursor-pointer"
          onClick={() => setMobileMenuOpen(false)}>
          <X className="size-6" />
        </button>
      </div>

      {/* Menu Items */}
      <ul className="mt-10 flex flex-col space-y-6 text-sm">
        {navItems.map((item) => (
          <li key={item.name + item.route}>
            <Link
              href={item.route}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center hover:text-purple-500 transition text-[1.5rem]">
              <span>{item.name}</span>{" "}
              <ChevronRight className="ml-auto hover:text-[#8451E1] mr-10" />
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="#"
        className="mt-auto h-[42px] flex items-center justify-center space-x-2 bg-purple-500 transition text-white rounded-[10px] px-6">
        <span className="">Shop now</span>
        <ShoppingCart className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
};
