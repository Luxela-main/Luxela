'use client';

import { Listing } from '@/types/listing';
import { X, ShoppingCart } from 'lucide-react';
import { Button } from '../../ui/button';

interface ProductQuickPreviewProps {
  product: Listing;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: () => void;
}

export default function ProductQuickPreview({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductQuickPreviewProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#333] bg-[#1a1a1a]">
          <h2 className="text-xl font-semibold text-white">{product.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#acacac]" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {product.image && (
            <div className="bg-[#222] rounded-lg overflow-hidden h-96 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-[#acacac] text-sm mb-1">Price</p>
              <p className="text-2xl font-bold text-[#8451E1]">
                {product.currency}{' '}
                {((product.price_cents || 0) / 100).toLocaleString()}
              </p>
            </div>

            {product.description && (
              <div>
                <p className="text-[#acacac] text-sm mb-2">Description</p>
                <p className="text-[#dcdcdc] text-sm">{product.description}</p>
              </div>
            )}

            <div>
              <p className="text-[#acacac] text-sm mb-2">Stock</p>
              <p className="text-sm text-white">
                {product.quantity_available && product.quantity_available > 0
                  ? `${product.quantity_available} Available`
                  : 'Out of Stock'}
              </p>
            </div>

            <Button
              onClick={onAddToCart}
              className="w-full text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-[#8451E1] to-[#5C2EAF] hover:shadow-lg hover:shadow-[#8451E1]/50 transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}