import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {children}
    </Suspense>
  );
}