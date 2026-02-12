'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductForm } from '@/components/sellers/ProductForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

function CreateProductPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'single';

  const isCollection = type === 'collection';
  const title = isCollection ? 'Create Collection' : 'Create Product';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[#333333] bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/sellers/my-listings"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#222222] text-[#999999] hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </Link>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductForm productType={isCollection ? 'collection' : 'single'} />
      </div>
    </div>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]" />}>
      <CreateProductPageContent />
    </Suspense>
  );
}