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
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 2;

    const checkAdminAccess = async () => {
      try {
        const supabase = createClient();
        // Refresh the session to ensure we have the latest user metadata
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.log('[Admin Layout] Session refresh error (non-blocking):', refreshError.message);
        }
        
        const delayMs = 1500 + (retryCount * 500);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        if (!isMounted) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Not authenticated - redirect only if not already on public page
          if (!isPublicAdminPage && isMounted) {
            router.push('/admin/');
          }
          if (isMounted) setIsLoading(false);
          return;
        }

        if (isMounted) setUserEmail(user?.email || null);

        // If on public pages (signin/setup), just show them
        if (isPublicAdminPage) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Check if user is admin (check auth metadata first, then database as fallback)
        let userIsAdmin = user.user_metadata?.admin === true;
        console.log('[Admin Layout] Checking user admin status - metadata.admin:', user.user_metadata?.admin);
        
        // If not found in metadata, check the database users table
        if (!userIsAdmin) {
          console.log('[Admin Layout] Not admin in metadata, checking database for user:', user.id);
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          console.log('[Admin Layout] Database query result - data:', userData, 'error:', userError);
          
          if (!userError && userData?.role === 'admin') {
            console.log('[Admin Layout] User found as admin in database');
            userIsAdmin = true;
          } else {
            console.log('[Admin Layout] Database check failed - error:', userError, 'role:', userData?.role);
          }
        } else {
          console.log('[Admin Layout] User is admin via metadata');
        }
        
        if (!isMounted) return;
        
        if (userIsAdmin) {
          // User is admin - allow access
          console.log('[Admin Layout] User verified as admin, allowing access');
          setIsAdmin(true);
          setIsLoading(false);
        } else {
          // User is not admin yet - retry a few times in case JWT is still syncing
          if (retryCount < MAX_RETRIES) {
            console.log(`[Admin Layout] Admin check failed, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            retryCount++;
            await checkAdminAccess();
          } else {
            // Max retries reached - user is definitely not admin
            console.log('[Admin Layout] Max admin verification retries reached, user is not admin');
            setIsAdmin(false);
            setIsLoading(false);
            if (isMounted) {
              router.push('/admin/signin');
            }
          }
        }
      } catch (error) {
        console.error('[Admin Layout] Failed to check admin access:', error);
        
        if (!isMounted) return;
        
        if (retryCount < MAX_RETRIES) {
          console.log(`[Admin Layout] Error during admin check, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          retryCount++;
          await checkAdminAccess();
        } else {
          // Max retries reached on error
          console.log('[Admin Layout] Max retries reached due to error, redirecting to signin');
          setIsLoading(false);
          if (!isPublicAdminPage && isMounted) {
            router.push('/admin/signin');
          }
        }
      }
    };

    checkAdminAccess();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
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