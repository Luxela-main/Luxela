export const dynamic = 'force-dynamic';

import { ReactNode } from 'react';
import { ProfileProvider } from '@/context/ProfileContext';

export default function CartLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <div className="min-h-screen bg-[#0e0e0e]">
        {children}
      </div>
    </ProfileProvider>
  );
}