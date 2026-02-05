'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ShoppingBag, Heart, Bell, Settings, LogOut, Menu, X, Package, HelpCircle, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useNotificationsCount } from '@/modules/buyer';

interface SidebarProps {
  activeItem?: string;
  hideMobileMenu?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: number;
}

export function Sidebar({ activeItem = 'my-account', hideMobileMenu = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const { profile } = useProfile();
  const notificationCount = useNotificationsCount();

  const handleLogout = useCallback(async () => {
    try {
      closeMobileMenu();
      setShowLogoutConfirm(false);
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
      setShowLogoutConfirm(false);
    }
  }, [logout]);


  const handleProfileClick = useCallback(() => {
    router.push('/buyer/profile');
    closeMobileMenu();
  }, [router]);

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

  const menuItems: MenuItem[] = [
    { id: 'my-account', label: 'My Account', icon: User, href: '/buyer/dashboard' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, href: '/buyer/dashboard/orders' },
    { id: 'favorite-items', label: 'Favorite Items', icon: Heart, href: '/buyer/dashboard/favorite-items' },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/buyer/dashboard/notifications', badge: notificationCount },
    { id: 'returns', label: 'Returns & Refunds', icon: Package, href: '/buyer/dashboard/returns' },
    { id: 'support-tickets', label: 'Support Tickets', icon: Ticket, href: '/buyer/dashboard/support-tickets' },
    { id: 'help', label: 'Help Center', icon: HelpCircle, href: '/buyer/dashboard/help' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/buyer/dashboard/settings' },
  ];

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return (
    <>
      {/* Mobile Menu Button - Fixed in header area */}
      {!hideMobileMenu && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-[#1a1a1a] text-white hover:bg-[#222] rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-30"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Mobile drawer and desktop sidebar */}
      <aside
        className={cn(
          'bg-[#0e0e0e] border-r-2 border-[#E5E7EB] min-h-screen flex flex-col',
          'fixed lg:relative left-0 top-0 w-64 lg:w-[240px]',
          'transition-transform duration-300 ease-in-out z-40',
          'lg:translate-x-0 pt-16 lg:pt-0',
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
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all justify-between',
                    'text-[#acacac] hover:text-white hover:bg-[#1a1a1a]',
                    isActive && 'bg-[#8451E126] text-[#8451E1] hover:bg-[#8451e1] hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full flex-shrink-0">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Profile Button and Logout */}
        <div className="border-t border-[#212121] p-4 space-y-3">
          {/* Profile Button */}
          <button
            onClick={handleProfileClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-[#acacac] hover:text-white hover:bg-[#1a1a1a]"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
              {profile?.profilePicture ? (
                <img
                  key={profile.profilePicture}
                  src={`${profile.profilePicture}?v=${Date.now()}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                  {profile?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-white font-medium text-sm">
                {profile?.name || 'User'}
              </span>
              <span className="text-gray-400 text-xs">Profile</span>
            </div>
          </button>

          {/* Logout Button */}
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
              onClick={() => {
                closeMobileMenu();
                setShowLogoutConfirm(true);
              }}
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