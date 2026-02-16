'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProcessingOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/buyer/dashboard/orders');
  }, [router]);

  return null;
}