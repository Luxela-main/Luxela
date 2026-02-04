'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ShoppingBag, Heart, Bell, Settings, LogOut, Menu, X, Package, HelpCircle, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  activeItem?: string;
}

export function Sidebar({ activeItem = 'my-account' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push('/signin');
    } catch (err) {
      console.error('Logout failed:', err);
      setShowLogoutConfirm(false);
    }
  }, [logout, router]);

  const derivedActive = useCallback(() => {
    if (!pathname) return activeItem;
    if (pathname === '/buyer/dashboard') return 'my-account';
    if (pathname.startsWith('/buyer/dashboard/orders')) return 'orders';
    if (pathname.startsWith('/buyer/dashboard/favorite-items')) return 'favorite-items';
    if (pathname.startsWith('/buyer/dashboard/notifications')) return 'notifications';
    if (pathname.startsWith('/buyer/dashboard/returns')) return 'returns';
    if (pathname.startsWith('/buyer/dashboard/help')) return 'help';
    if (pathname.startsWith('/buyer/dashboard/support-tickets')) return 'support-tickets';
    if (pathname.startsWith('/buyer/dashboard/settings')) return 'settings';
    return activeItem;
  }, [pathname, activeItem]);

  const activeItemValue = derivedActive();

  const menuItems = [
    { id: 'my-account', label: 'My Account', icon: User, href: '/buyer/dashboard' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, href: '/buyer/dashboard/orders' },
    { id: 'favorite-items', label: 'Favorite Items', icon: Heart, href: '/buyer/dashboard/favorite-items' },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/buyer/dashboard/notifications' },
    { id: 'returns', label: 'Returns & Refunds', icon: Package, href: '/buyer/dashboard/returns' },
    { id: 'support-tickets', label: 'Support Tickets', icon: Ticket, href: '/buyer/dashboard/support-tickets' },
    { id: 'help', label: 'Help Center', icon: HelpCircle, href: '/buyer/dashboard/help' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/buyer/dashboard/settings' },
  ];

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return (
    <>
      {/* Mobile Menu Button - Fixed in header area */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-[#1a1a1a] text-white hover:bg-[#222] rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-30 top-16"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Mobile drawer and desktop sidebar */}
      <aside
        className={cn(
          'bg-[#0e0e0e] border-r border-[#212121] min-h-screen flex flex-col',
          'fixed lg:relative left-0 top-16 lg:top-0 w-64 lg:w-[240px]',
          'transition-transform duration-300 ease-in-out z-40',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 lg:space-y-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeItemValue;

            return (
              <Link key={item.id} href={item.href} onClick={closeMobileMenu} className="block">
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    'text-[#acacac] hover:text-white hover:bg-[#1a1a1a]',
                    isActive && 'bg-[#8451E126] text-[#8451E1] hover:bg-[#8451e1] hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-[#212121] p-4">
          {showLogoutConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-3">Confirm logout?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-3 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm hover:bg-[#222] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#ff5e5e] hover:text-[#ff5e5e] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Log out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}