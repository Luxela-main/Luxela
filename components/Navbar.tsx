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
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
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
      }`}
    >
      <div className="container mx-auto px-4 lg:px-10 py-4 flex justify-between items-center">
        {/* Left - Nav items (desktop only) */}
        <div className="flex items-center">
          <button
            aria-label="Open menu"
            className="lg:hidden text-white p-2 rounded-md hover:bg-white/10 transition"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <ul className="hidden lg:flex items-center space-x-10">
            {navItems.map((item) => (
              <li key={item.name + item.route}>
                <Link
                  href={item.route}
                  className="text-sm font-medium text-white hover:text-white transition-all duration-200 relative pb-1 group"
                  onMouseEnter={() => setActiveNavItem(item.name)}
                  onMouseLeave={() => setActiveNavItem(null)}
                >
                  {item.name}
                  <span
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#E5E7EB] to-[#6B7280] transition-all duration-300 group-hover:w-full"
                    style={{
                      width: activeNavItem === item.name ? "100%" : "0%",
                    }}
                  ></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Center - Logo */}
        <Link
          href="/"
          className="absolute left-1/2 transform -translate-x-1/2 flex items-center w-[120px] sm:w-[150px] md:w-[200px] h-auto hover:scale-105 transition-transform duration-300"
        >
          <Image
            src="/images/Luxela-white-logo-200x32.svg"
            width={200}
            height={32}
            className="w-full h-auto"
            alt="Luxela logo"
            priority
          />
        </Link>

        {/* Right - Actions */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          <Link
            href={user ? "/sellers/dashboard" : "/signin"}
            className="hidden sm:flex h-10 items-center text-sm text-white hover:text-white transition px-4 relative pb-1 group"
          >
            Sell
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E5E7EB] transition-all duration-300 w-0 group-hover:w-full"></span>
          </Link>

          <Link
            href="/buyer"
            className="h-10 flex items-center space-x-2 border-2 border-[#E5E7EB]/40 hover:border-[#E5E7EB]/80 transition-all duration-300 rounded-md px-4 text-sm text-white hover:shadow-[0_0_15px_#E5E7EB]/30"
          >
            <span className="hidden sm:block">Shop now</span>
            <ShoppingCart className="h-4 w-4" />
          </Link>

          {user && (
            <Link
              href={
                user.user_metadata?.role === "seller"
                  ? "/sellers/dashboard"
                  : user.user_metadata?.role === "admin"
                  ? "/admin/support"
                  : "/buyer/dashboard"
              }
              className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#E5E7EB]/40 hover:border-[#E5E7EB]/80 transition-all duration-300 hover:shadow-[0_0_15px_#E5E7EB]/30"
            >
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
            aria-modal="true"
          >
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
                className="ml-auto p-2 text-white hover:bg-white/10 rounded-md transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu items */}
            <ul className="mt-10 flex flex-col space-y-6 text-lg font-medium">
              {navItems.map((item, idx) => {
                const colors = ["#E5E7EB", "#6B7280", "#D1D5DB"];
                const color = colors[idx % colors.length];
                return (
                  <li key={item.name + item.route}>
                    <Link
                      href={item.route}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center text-white hover:text-white transition group relative pl-4"
                      style={{
                        borderLeft: `3px solid ${color}40`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderLeftColor =
                          color;
                        (e.currentTarget as HTMLElement).style.paddingLeft =
                          "20px";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderLeftColor =
                          color + "40";
                        (e.currentTarget as HTMLElement).style.paddingLeft =
                          "16px";
                      }}
                    >
                      {item.name}
                      <ChevronRight
                        className="ml-auto transition-transform duration-300 group-hover:translate-x-1"
                        style={{ color: color }}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Bottom CTA */}
            <Link
              href="/buyer"
              className="mt-auto h-12 flex items-center justify-center space-x-2 bg-gradient-to-b from-[#8451E1] via-[#8451E1] to-[#5C2EAF] hover:shadow-[0_0_20px_#8451E1]/40 transition text-white rounded-lg border border-[#E5E7EB]/30 hover:border-[#E5E7EB]/60"
            >
              <span>Shop now</span>
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}