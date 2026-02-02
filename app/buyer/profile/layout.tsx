import Header from '@/components/buyer/dashboard/header';

export const dynamic = 'force-dynamic';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      <Header />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );

  // NOTE: The /create subroute has its own layout.tsx that overrides this
}

// NOTE: The /create subroute has its own layout.tsx that overrides this
// and provides a clean page without sidebar/header