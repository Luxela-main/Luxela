"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bell, ChevronDown, Search, ShoppingCart, Menu, X, ShoppingBag, Heart, Package, Ticket, Home, Users, FolderOpen, HelpCircle, User, FileText, Settings, LogOut, Bookmark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearch } from "@/context/SearchContext";
import { useNotificationsCount, useFavoritesCount } from "@/modules/buyer";
import { useRealtimeFavorites } from "@/hooks/useRealtimeFavorites";
import { NotificationBell } from "@/modules/buyer/components/NotificationBell";
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
import { Button } from "../ui/button";
import router from "next/router";

const NAVLINKS = [
  { name: "Home", href: "/buyer" },
  { name: "Browse", href: "/buyer/browse" },
  { name: "Brands", href: "/buyer/brands" },
  { name: "Collections", href: "/buyer/collections" },
];

const USER_DROPDOWN = [
  { name: "My Account", href: "/buyer/dashboard/account" },
  { name: "Profile", href: "/buyer/profile" },
  { name: "Settings", href: "/buyer/dashboard/settings" },
];

const BuyerHeader = () => {
  useRealtimeFavorites(); // Enable real-time favorites syncing
  const { user, logout } = useAuth();
  const toast = useToast();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileLogoutOpen, setMobileLogoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { profile, loading } = useProfile();
  const { itemCount } = useCartState();
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const notificationCount = useNotificationsCount();
  const favoritesCount = useFavoritesCount();
  const isCreateProfileRoute = pathname?.includes('/buyer/profile/create');

  useEffect(() => {
    setMounted(true);
  }, []);

  const username = profile?.username || user?.email?.split("@")[0] || "User";
  const userPicture = profile?.profilePicture 
    ? `${profile.profilePicture}?t=${Date.now()}` 
    : "/images/seller/sparkles.svg";

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been successfully logged out.");
      router.push('/signin');
    } catch (err) {
      toast.error("Something went wrong while logging out.");
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <nav className="z-[999] bg-[#0E0E0E] px-3 lg:px-6 py-[18px] border-b border-[#2B2B2B] w-full">
        <div className="w-full flex items-center justify-between gap-4 max-w-[1400px] mx-auto">
          {/* Mobile: Hamburger Menu */}
          {!isCreateProfileRoute && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden cursor-pointer p-2 bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] flex-shrink-0"
            >
              {mobileMenuOpen ? (
                <X stroke="#DCDCDC" className="size-6" />
              ) : (
                <Menu strokeWidth={1} stroke="#DCDCDC" className="size-6" />
              )}
            </button>
          )}

          {/* Desktop: Left Links */}
          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            {NAVLINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[#DCDCDC] text-sm py-3 hover:transform hover:text-[#8451E1] hover:-translate-y-[1px] duration-300 ease-in-out whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="block w-[100px] md:w-[110px] lg:w-[132px] h-auto">
              <Image
                src={"/images/Luxela-white-logo-200x32.svg"}
                width={200}
                height={32}
                alt="Luxela logo"
                className="w-full h-auto"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Desktop Icons */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Search Bar - Responsive width */}
              <div className="relative w-[200px] xl:w-[280px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Item or brand..."
                  className="w-full px-4 py-2.5 pl-10 pr-10 bg-[#1A1A1A] border-none rounded-[6px] text-[#DCDCDC] text-sm placeholder:text-[#808080] focus:outline-none focus:ring-1 focus:ring-[#333333]"
                />
                <Search 
                  stroke="#808080" 
                  strokeWidth={1.5} 
                  className="size-5 absolute left-3 top-1/2 -translate-y-1/2 flex-shrink-0"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-[#DCDCDC] transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {mounted && user && <NotificationBell />}

              {mounted ? (
                <Link href={user ? "/buyer/favorites" : "/signin?redirect=/buyer/favorites"}>
                  <button className="relative cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out group flex-shrink-0">
                    <Heart stroke="#DCDCDC" strokeWidth={1} className="size-6" />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#0E0E0E]">
                        {favoritesCount > 99 ? '99+' : favoritesCount}
                      </span>
                    )}
                  </button>
                </Link>
              ) : (
                <button className="relative cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out group flex-shrink-0">
                  <Heart stroke="#DCDCDC" strokeWidth={1} className="size-6" />
                </button>
              )}

              {mounted ? (
                <Link href={user ? "/cart" : "/signin?redirect=/cart"}>
                  <button className="relative cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out group flex-shrink-0">
                    <ShoppingCart stroke="#DCDCDC" strokeWidth={1} className="size-6" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#0E0E0E]">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </Link>
              ) : (
                <button className="relative cursor-pointer p-[10px] bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] hover:-translate-y-[1px] duration-300 ease-in-out group flex-shrink-0">
                  <ShoppingCart stroke="#DCDCDC" strokeWidth={1} className="size-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#0E0E0E]">
                      {itemCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Mobile: Notification Bell */}
            {mounted && user && (
              <div className="lg:hidden">
                <NotificationBell />
              </div>
            )}

            {/* Mobile: Favorites Icon */}
            {mounted ? (
              <Link href={user ? "/buyer/favorites" : "/signin?redirect=/buyer/favorites"}>
                <button className="lg:hidden relative cursor-pointer p-2 bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] flex-shrink-0">
                  <Heart stroke="#DCDCDC" strokeWidth={1} className="size-6" />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  )}
                </button>
              </Link>
            ) : (
              <button className="lg:hidden relative cursor-pointer p-2 bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] flex-shrink-0">
                <Heart stroke="#DCDCDC" strokeWidth={1} className="size-6" />
              </button>
            )}

            {/* Mobile: Cart Icon */}
            {mounted ? (
              <Link href={user ? "/cart" : "/signin?redirect=/cart"}>
                <button className="lg:hidden relative cursor-pointer p-2 bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] flex-shrink-0">
                  <ShoppingCart stroke="#DCDCDC" strokeWidth={1} className="size-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                      {itemCount}
                    </span>
                  )}
                </button>
              </Link>
            ) : (
              <button className="lg:hidden relative cursor-pointer p-2 bg-[#141414] rounded-[4px] shadow-[inset_0_0_0_1px_#212121] flex-shrink-0">
                <ShoppingCart stroke="#DCDCDC" strokeWidth={1} className="size-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* User Dropdown or Sign In */}
            {mounted && user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex cursor-pointer items-center gap-2 text-xs lg:text-sm text-[#F2F2F2] px-2 lg:px-4 py-1 shadow-[inset_0_0_0_1px_#212121] rounded-[4px] hover:bg-[#1a1a1a] flex-shrink-0">
                    <div className="size-7 lg:size-8 overflow-hidden rounded-full flex-shrink-0">
                      <Image
                        src={userPicture}
                        width={40}
                        height={40}
                        alt="User avatar"
                        className="size-full rounded-full"
                      />
                    </div>
                    <span className="max-w-20 truncate hidden xl:block">
                      {username}
                    </span>
                    <ChevronDown
                      size={18}
                      stroke="#DCDCDC"
                      className="hidden xl:block flex-shrink-0"
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
                          className="cursor-pointer text-[#F2F2F2] hover:text-[#8451E1] transition-colors duration-300 ease-in"
                        >
                          <Link href={item.href}>{item.name}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2B2B2B]" />
                      </React.Fragment>
                    ))}
                  </DropdownMenuGroup>

                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer text-red-400 hover:bg-red-600! hover:text-white!"
                  >
                    <Link href="/signin">Log out</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : mounted ? (
              <Link href="/signin">
                <Button className="flex cursor-pointer px-4 items-center gap-2 text-xs lg:text-sm text-[#F2F2F2] lg:px-6 py-2 transition-colors duration-300 ease-in-out flex-shrink-0">
                  Sign In
                </Button>
              </Link>
            ) : (
              <div className="w-20 h-10 bg-[#141414] rounded-[4px] animate-pulse" />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && !isCreateProfileRoute && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[998] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-[70px] left-0 w-64 h-[calc(100vh-70px)] bg-[#0E0E0E] border-r border-[#2B2B2B] z-[999] lg:hidden overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Mobile Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-4 py-2 pl-10 bg-[#141414] border border-[#2B2B2B] rounded-[4px] text-[#DCDCDC] text-sm focus:outline-none focus:border-[#8451E1]"
                />
                <Search 
                  stroke="#DCDCDC" 
                  className="size-5 absolute left-3 top-1/2 -translate-y-1/2"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Main Navigation */}
              <div className="space-y-4">
                {NAVLINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Dashboard Links */}
              {user && !isCreateProfileRoute && (
                <div className="space-y-3 pt-4 border-t border-[#2B2B2B]">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider">
                    Dashboard
                  </h3>
                  <Link
                    href="/buyer/dashboard/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Orders
                  </Link>
                  <Link
                    href="/buyer/dashboard/favorite-items"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    Favorite Items
                  </Link>
                  <Link
                    href="/buyer/dashboard/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                  </Link>
                  <Link
                    href="/buyer/dashboard/returns"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    Returns & Refunds
                  </Link>
                </div>
              )}

              {/* Shopping & Support */}
              {!isCreateProfileRoute && (
                <div className="space-y-3 pt-4 border-t border-[#2B2B2B]">
                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Shopping Cart
                  </Link>
                  <Link
                    href="/buyer/dashboard/support-tickets"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                  >
                    <Ticket className="w-4 h-4" />
                    Support Tickets
                  </Link>
                  <Link
                    href="/buyer/dashboard/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help & Support
                  </Link>
                </div>
              )}

              {user && !isCreateProfileRoute && (
                <div className="space-y-3 pt-4 border-t border-[#2B2B2B]">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider">
                    Account
                  </h3>
                  {USER_DROPDOWN.map((item) => {
                    let icon;
                    switch(item.name) {
                      case 'My Account':
                        icon = <User className="w-4 h-4" />;
                        break;
                      case 'Profile':
                        icon = <FileText className="w-4 h-4" />;
                        break;
                      case 'Settings':
                        icon = <Settings className="w-4 h-4" />;
                        break;
                      default:
                        icon = null;
                    }
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-[#DCDCDC] text-sm py-2 hover:text-[#8451E1] transition-colors"
                      >
                        {icon}
                        {item.name}
                      </Link>
                    );
                  })}
                  <Link href="/signin" className="flex items-center gap-2 w-full text-left text-red-400 text-sm py-2 hover:text-red-300 transition-colors cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    Log out
                  </Link>
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