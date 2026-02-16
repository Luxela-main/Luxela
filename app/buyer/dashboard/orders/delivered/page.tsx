'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeliveredOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified main orders page
    router.replace('/buyer/dashboard/orders');
  }, [router]);

  return null;
}