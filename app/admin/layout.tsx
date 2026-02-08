"use client";

import type React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/app/components/AdminNavbar';
import { createClient } from '@/utils/supabase/client';
import { Loader } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isSignInPage = pathname === '/admin/signin';
  const isSetupPage = pathname === '/admin/setup';
  const isPublicAdminPage = isSignInPage || isSetupPage;

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Not authenticated
          if (!isPublicAdminPage) {
            router.push('/admin/signin');
          }
          setIsLoading(false);
          return;
        }

        setUserEmail(user?.email || null);

        // If on public pages (signin/setup), just show them
        if (isPublicAdminPage) {
          setIsLoading(false);
          return;
        }

        // Check if user is admin
        const userIsAdmin = user.user_metadata?.admin === true;
        setIsAdmin(userIsAdmin);

        if (!userIsAdmin) {
          // Not an admin, redirect to setup
          router.push('/admin/setup');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to check admin access:', error);
        setIsLoading(false);
        if (!isPublicAdminPage) {
          router.push('/admin/signin');
        }
      }
    };

    checkAdminAccess();
  }, [pathname, isPublicAdminPage, router]);

  // Show loading state while checking admin status
  if (isLoading && !isPublicAdminPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#1a1a1a] to-[#0e0e0e] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white text-lg">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#1a1a1a] to-[#0e0e0e] text-white">
      {!isSignInPage && !isSetupPage && <AdminNavbar userEmail={userEmail} currentPath={pathname} />}
      <div className="flex flex-col lg:flex-row">
        {!isSignInPage && !isSetupPage && <AdminSidebar />}
        <main className="flex-1 w-full min-h-screen overflow-hidden">
          <div className={isSignInPage || isSetupPage ? '' : 'pt-16 sm:pt-20 lg:pt-8 px-3 sm:px-6 md:px-8 pb-8 lg:pb-6 max-w-7xl mx-auto w-full'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}