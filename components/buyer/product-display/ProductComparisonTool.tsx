'use client';

import { Listing } from '@/types/listing';
import { X } from 'lucide-react';

interface ProductComparisonToolProps {
  selectedProducts: Listing[];
  onRemove: (productId: string) => void;
  maxProducts?: number;
}

export default function ProductComparisonTool({
  selectedProducts,
  onRemove,
  maxProducts = 4,
}: ProductComparisonToolProps) {
  if (selectedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-md max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">
          Compare Products ({selectedProducts.length}/{maxProducts})
        </h3>
      </div>

      <div className="space-y-3 mb-4">
        {selectedProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 bg-[#222] rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate font-medium">
                {product.title}
              </p>
              <p className="text-xs text-[#acacac]">
                {product.currency}{' '}
                {((product.price_cents || 0) / 100).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => onRemove(product.id)}
              className="ml-2 p-1.5 hover:bg-[#333] rounded transition-colors"
            >
              <X className="w-4 h-4 text-[#acacac] hover:text-white" />
            </button>
          </div>
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <button className="w-full py-2 bg-gradient-to-r from-[#8451E1] to-[#5C2EAF] text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-[#8451E1]/50 transition-all">
          Compare Now
        </button>
      )}
    </div>
  );
}