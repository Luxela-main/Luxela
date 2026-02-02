'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, Home, Shield, Users, Zap, MessageSquare, ChevronDown } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface AdminNavbarProps {
  userEmail?: string | null;
  currentPath?: string;
}

export default function AdminNavbar({ userEmail, currentPath = '' }: AdminNavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/signin');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive = (path: string) => currentPath?.includes(path);

  const navLinks = [
    { href: '/admin/support', label: 'Dashboard', icon: Shield },
    { href: '/admin/support/tickets', label: 'Tickets', icon: MessageSquare },
    { href: '/admin/support/team', label: 'Team', icon: Users },
    { href: '/admin/members', label: 'Members', icon: Users },
  ];

  return (
    <nav className="bg-gradient-to-r from-[#1a1a1a] to-[#0E0E0E] border-b border-[#2B2B2B] text-white sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-[#8451E1]" />
            <h1 className="text-lg sm:text-xl font-bold text-white hidden sm:block">
              Admin
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all font-medium text-sm lg:text-base ${
                  isActive(href)
                    ? 'bg-[#8451E1] text-white'
                    : 'text-[#DCDCDC] hover:bg-[#2B2B2B] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            {userEmail && (
              <span className="text-xs lg:text-sm text-[#808080] px-3 py-1 bg-[#2B2B2B] rounded-lg">
                {userEmail.length > 20 ? `${userEmail.substring(0, 17)}...` : userEmail}
              </span>
            )}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 text-[#DCDCDC] hover:bg-[#2B2B2B] rounded-lg transition-colors text-sm lg:text-base"
              title="Back to Home"
            >
              <Home className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden lg:inline">Home</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm lg:text-base font-medium"
            >
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleMenu}
              className="p-2 hover:bg-[#2B2B2B] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-[#2B2B2B] pt-4">
            {/* User Email - Mobile */}
            {userEmail && (
              <div className="px-4 py-2 bg-[#2B2B2B] rounded-lg mb-3">
                <p className="text-xs text-[#808080]">Logged in as:</p>
                <p className="text-sm font-medium text-[#DCDCDC] truncate">{userEmail}</p>
              </div>
            )}

            {/* Navigation Links - Mobile */}
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(href)
                    ? 'bg-[#8451E1] text-white'
                    : 'text-[#DCDCDC] hover:bg-[#2B2B2B]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}

            {/* Home Button - Mobile */}
            <button
              onClick={() => {
                router.push('/');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[#DCDCDC] hover:bg-[#2B2B2B] rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </button>

            {/* Logout Button - Mobile */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}