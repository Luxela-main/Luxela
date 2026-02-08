'use client';

interface ProductPriceBadgeProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
}

export default function ProductPriceBadge({
  price,
  originalPrice,
  currency = '₦',
  size = 'md',
  showDiscount = true,
}: ProductPriceBadgeProps) {
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} font-bold text-[#8451E1]`}>
        {currency} {(price / 100).toLocaleString()}
      </div>

      {originalPrice && originalPrice > price && (
        <>
          <div className={`${sizeClasses[size]} text-[#666] line-through`}>
            {currency} {(originalPrice / 100).toLocaleString()}
          </div>

          {showDiscount && discountPercent > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="text-xs font-medium text-red-400">
                -{discountPercent}%
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}