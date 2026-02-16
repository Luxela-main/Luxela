'use client';

import { Sidebar } from '@/components/buyer/dashboard/sidebar';
import { usePathname } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCreateRoute = pathname.includes('/buyer/profile/create');

  // On create route, render only children without any layout wrapper
  if (isCreateRoute) {
    return children;
  }

  // On other routes, render with sidebar
  return (
    <div className="flex flex-col lg:flex-row">
      <div className="hidden lg:block w-60 bg-white border-r border-gray-200">
        <Sidebar hideMobileMenu={false} />
      </div>
      
      <main className="flex-1 pt-20 lg:pt-0">
        {children}
      </main>
    </div>
  );
}