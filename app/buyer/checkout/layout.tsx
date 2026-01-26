import Header from '@/components/buyer/dashboard/header';
import { Sidebar } from '@/components/buyer/dashboard/sidebar';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}