'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAdminStatus } from '@/app/actions/admin';
import { Shield } from 'lucide-react';
import AdminNavbar from '@/app/components/AdminNavbar';
import { createClient } from '@/utils/supabase/client';

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkAdminStatus();
        
        if (result.success && result.isAdmin) {
          setIsAdmin(true);
          setUserEmail(result.userEmail || null);
        } else {
          setIsAdmin(false);
          setTimeout(() => {
            router.push('/admin/signin');
          }, 1000);
        }
      } catch (error) {
        setIsAdmin(false);
        router.push('/admin/signin');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[#8451E1] mx-auto mb-4 animate-pulse" />
          <p className="text-[#DCDCDC]">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-[#DCDCDC] mb-6">You don't have admin privileges</p>
          <a href="/admin/signin" className="inline-block px-6 py-2 bg-[#8451E1] hover:bg-[#7040d1] text-white rounded-lg font-medium transition-colors">
            Sign In as Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col">
      <AdminNavbar userEmail={userEmail} currentPath={pathname} />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}