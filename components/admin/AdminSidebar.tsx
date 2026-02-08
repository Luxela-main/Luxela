"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileCheck,
  Users,
  Settings,
  BarChart3,
  AlertCircle,
  Package,
  AlertTriangle,
  Headphones,
  Bell,
  X,
} from 'lucide-react';
import { useAdminNotificationsCount } from '@/modules/admin';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const notificationCount = useAdminNotificationsCount();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg
          transition-all duration-200 relative group
          ${
            active
              ? 'bg-gradient-to-r from-[#8451e1] to-[#6d3fb8] text-white shadow-lg shadow-[#8451e1]/20'
              : 'text-[#9CA3AF] hover:bg-[#1a1a1a] hover:text-white'
          }
        `}
      >
        {item.icon}
        <span className="flex-1 font-medium text-sm">{item.label}</span>
        {item.badge && (
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
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col h-screen w-64 bg-gradient-to-b from-[#0e0e0e] to-[#1a1a1a] border-r border-[#2B2B2B] sticky top-0 z-20">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 py-6 border-b border-[#2B2B2B]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#8451e1]" />
              Admin
            </h2>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
            {navItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </nav>

          {/* Notification Button */}
          <div className="border-t border-[#2B2B2B] p-3">
            <button
              onClick={() => router.push('/admin/notifications')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[#9CA3AF] hover:bg-[#1a1a1a] hover:text-white relative group"
              title="View all notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="flex-1 font-medium text-sm">Notifications</span>
              {notificationCount > 0 && (
                <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-[#2B2B2B] p-4">
            <div className="text-xs text-[#6B7280] text-center">Enterprise Admin v1.0</div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <aside
          className={`
            fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-[#0e0e0e] to-[#1a1a1a]
            border-r border-[#2B2B2B] z-40 transform transition-transform duration-300 lg:hidden
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#2B2B2B]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#8451e1]" />
                Admin
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
              {navItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </nav>

            {/* Notification Button */}
            <div className="border-t border-[#2B2B2B] p-3">
              <button
                onClick={() => {
                  router.push('/admin/notifications');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[#9CA3AF] hover:bg-[#1a1a1a] hover:text-white relative group"
                title="View all notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="flex-1 font-medium text-sm">Notifications</span>
                {notificationCount > 0 && (
                  <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="border-t border-[#2B2B2B] p-4">
              <div className="text-xs text-[#6B7280] text-center">Enterprise Admin v1.0</div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}