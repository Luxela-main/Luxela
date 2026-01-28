'use client';

// This is the base admin layout - doesn't require auth checks
// Each route (signin, setup, support, members) manages its own auth as needed

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}