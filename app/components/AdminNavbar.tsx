'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, Home, Shield, Users, Zap, MessageSquare, ChevronDown, Settings, FileCheck, TrendingUp, AlertCircle, Bell, LayoutDashboard, Package, AlertTriangle, BarChart3, Headphones } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useAdminNotificationsCount } from '@/modules/admin';

interface AdminNavbarProps {
  userEmail?: string | null;
  currentPath?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
}

export default function AdminNavbar({ userEmail: initialUserEmail, currentPath = '' }: AdminNavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(initialUserEmail || null);
  const notificationCount = useAdminNotificationsCount();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Listings Review',
      href: '/admin/listings',
      icon: <FileCheck className="w-5 h-5" />,
      badge: 'pending',
    },
    {
      label: 'Orders Management',
      href: '/admin/orders',
      icon: <Package className="w-5 h-5" />,
    },
    {
      label: 'Disputes & Returns',
      href: '/admin/disputes',
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: notificationCount > 0 ? (notificationCount > 99 ? '99+' : notificationCount) : undefined,
      badgeColor: notificationCount > 0 ? 'bg-red-600 text-white' : undefined,
    },
    {
      label: 'Members',
      href: '/admin/members',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: 'Support',
      href: '/admin/support',
      icon: <Headphones className="w-5 h-5" />,
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  // Fetch current user email from Supabase session
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch (error) {
        console.error('Failed to fetch user email:', error);
      }
    };

    if (!initialUserEmail) {
      fetchUserEmail();
    }
  }, [initialUserEmail]);

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



  return (
    <nav className="bg-gradient-to-r from-[#1a1a1a] via-[#0e0e0e] to-[#0E0E0E] border-b border-[#2B2B2B] text-white sticky top-0 z-50 backdrop-blur-sm">
      <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between min-h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-fit">
            <div className="p-2 bg-[#8451e1]/10 rounded-lg">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#8451E1]" />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white hidden sm:block">
              Admin
            </h1>
          </div>



          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            {userEmail && (
              <span className="text-xs lg:text-sm text-[#808080] px-3 py-1 bg-[#2B2B2B] rounded-lg">
                {userEmail.length > 20 ? `${userEmail.substring(0, 17)}...` : userEmail}
              </span>
            )}
            {/* Notification Bell */}
            <button
              onClick={() => router.push('/admin/notifications')}
              className="relative flex items-center justify-center w-10 h-10 text-[#DCDCDC] hover:bg-[#2B2B2B] rounded-lg transition-colors group"
              title="View all notifications"
            >
              <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[#2B2B2B]">Notifications</span>
            </button>
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
              className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm lg:text-base font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Notification Bell */}
            <button
              onClick={() => router.push('/admin/notifications')}
              className="relative flex items-center justify-center w-10 h-10 p-2 hover:bg-[#2B2B2B] rounded-lg transition-colors"
              title="View notifications"
            >
              <Bell className="w-5 h-5 text-[#DCDCDC]" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
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

            {/* Navigation Items - Mobile */}
            {navItems.map((item) => {
              const isActive = currentPath?.includes(item.href);
              // Don't show badge for Disputes & Returns on mobile
              const shouldShowBadge = item.badge && !item.href.includes('/disputes');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-[#8451e1] to-[#6d3fb8] text-white'
                        : 'text-[#DCDCDC] hover:bg-[#2B2B2B]'
                    }
                  `}
                >
                  {item.icon}
                  <span className="flex-1 font-medium">{item.label}</span>
                  {shouldShowBadge && (
                    <span
                      className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${
                          item.badgeColor || 'bg-yellow-500/20 text-yellow-400'
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

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
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium mt-4 cursor-pointer"
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