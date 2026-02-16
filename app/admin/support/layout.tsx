'use client';

// Parent admin layout already handles admin authorization
// No need for redundant checks here
export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 w-full">
      {children}
    </main>
  );
}