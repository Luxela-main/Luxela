export const dynamic = 'force-dynamic';

import { Suspense } from 'react';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      {children}
    </Suspense>
  );
}