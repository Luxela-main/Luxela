"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu, ShoppingCart, X, User } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

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
      className={`z-50 transition-all duration-300 ${
        sticky
          ? "fixed top-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-md shadow-md"
          : "absolute top-0 left-0 right-0 bg-transparent"

      }`}>
      <div className="container mx-auto px-4 lg:px-10 py-4 flex justify-between items-center">
        {/* Left - Nav items (desktop only) */}
        <ul className="hidden lg:flex items-center space-x-10">
          {navItems.map((item) => (
            <li key={item.name + item.route}>
              <Link
                href={item.route}
                className="text-sm font-medium hover:text-purple-500 transition-colors duration-200">
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <button
          aria-label="Open menu"
          className="lg:hidden text-white p-2 rounded-md hover:bg-white/10 transition"
          onClick={() => setMobileMenuOpen(true)}>
          <Menu className="h-6 w-6" />
        </button>

        <Link
          href="/"
          className="flex items-center w-[120px] sm:w-[150px] md:w-[200px] h-auto">
          <Image
            src="/images/Luxela-white-logo-200x32.svg"
            width={200}
            height={32}
            className="w-full h-auto"
            alt="Luxela logo"
            priority
          />
        </Link>

        <div className="flex items-center space-x-3 sm:space-x-5">
          <Link
            href={user ? "/sellers/dashboard" : "/signin"}
            className="hidden sm:flex h-10 items-center text-sm hover:text-purple-500 transition px-4">
            Sell
          </Link>

          <Link
            href="/cart"
            className="h-10 flex items-center space-x-2 border border-white/40 hover:border-purple-500 transition rounded-md px-4 text-sm">
            <span className="hidden sm:block">Shop now</span>
            <ShoppingCart className="h-4 w-4" />
          </Link>

          {user ? (
            <Link
              href="/account"
              className="h-10 w-10 rounded-full overflow-hidden border border-white/30 hover:border-purple-500 transition">
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata?.avatar_url}
                  alt="Profile"
                  width={40}
                  height={40}
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
                href="/signin"
              className="flex items-center text-sm hover:text-purple-500 transition">
              <User size={22} />
              <span className="ml-2 hidden sm:inline">Account</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobileNav"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="lg:hidden fixed inset-0 bg-[#0E0E0E] z-50 flex flex-col px-6 py-6"
            role="dialog"
            aria-modal="true">
            {/* Top bar */}
            <div className="flex items-center">
              <Link href="/" className="w-[132px] h-auto">
                <Image
                  src="/images/Luxela-white-logo-200x32.svg"
                  width={132}
                  height={32}
                  alt="Luxela logo"
                />
              </Link>
              <button
                aria-label="Close menu"
                className="ml-auto p-2 text-white hover:bg-white/10 rounded-md"
                onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu items */}
            <ul className="mt-10 flex flex-col space-y-6 text-lg font-medium">
              {navItems.map((item) => (
                <li key={item.name + item.route}>
                  <Link
                    href={item.route}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center hover:text-purple-500 transition">
                    {item.name}
                    <ChevronRight className="ml-auto" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Bottom CTA */}
            <Link
              href="#"
              className="mt-auto h-12 flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 transition text-white rounded-lg">
              <span>Shop now</span>
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
