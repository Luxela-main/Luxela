import React from 'react';

export const dynamic = 'force-dynamic';

export default function CreateProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full bg-[#0E0E0E] text-[#F2F2F2] min-h-screen flex items-center justify-center py-10">
      {children}
    </div>
  );
}