import { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Check, Loader2, Images } from 'lucide-react';
import { toastSvc } from '@/services/toast';

interface ProductImage {
  id: string;
  image_url: string;
  position?: number;
  is_primary?: boolean;
}

interface ProductVariant {
  colorName: string;
  colorHex: string;
  sizeName?: string;
}

interface CollectionProductCardWithGalleryProps {
  productId: string;
  title: string;
  price: number;
  currency?: string;
  images?: ProductImage[] | string[];
  image?: string;
  colors?: ProductVariant[];
  sizes?: string[];
  material?: string;
  quantity: number;
  brandName?: string;
  itemNumber?: number;
  onAddToCart: (productId: string) => Promise<void>;
  onSelect?: (product: any) => void;
}

export function CollectionProductCardWithGallery({
  productId,
  title,
  price,
  currency = 'NGN',
  images = [],
  image,
  colors = [],
  sizes = [],
  material,
  quantity,
  brandName,
  itemNumber,
  onAddToCart,
  onSelect,
}: CollectionProductCardWithGalleryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages: ProductImage[] = images && images.length > 0
    ? (images as any[]).map((img, idx) => 
        typeof img === 'string'
          ? { id: idx.toString(), image_url: img }
          : img
      ).sort((a, b) => (a.position || 0) - (b.position || 0))
    : image
      ? [{ id: '0', image_url: image }]
      : [];

  const currentImage = allImages[currentImageIndex]?.image_url || image;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);
    try {
      await onAddToCart(productId);
      setAdded(true);
      const priceInNGN = price ? (price / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'Price unavailable';
      toastSvc.success(`✓ ${title} added to cart • ${priceInNGN}`);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to add to cart';
      console.error('Failed to add to cart:', { message: errorMessage, error: err });
      toastSvc.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const stockStatus =
    quantity === 0 ? 'Out of Stock' : quantity <= 5 ? `${quantity} left` : 'In Stock';

  const stockColor =
    quantity === 0 ? 'text-red-500' : quantity <= 5 ? 'text-orange-500' : 'text-green-500';

  const isValidImage = typeof currentImage === 'string' && currentImage.length > 0 && !currentImage.includes('placeholder.com');

  return (
    <div className="group">
      <div
        onClick={() => onSelect?.({ id: productId, title, price, currency, images: allImages, colors, sizes, material, quantity })}
        className="cursor-pointer bg-[#0f0f0f] rounded-xl overflow-hidden border border-[#222] hover:border-[#8451E1]/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(132,81,225,0.15)]"
      >
        {/* Image Gallery */}
        <div className="relative h-72 md:h-80 bg-[#1a1a1a] overflow-hidden">
          {isValidImage ? (
            <>
              <img
                src={currentImage}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Image Navigation - Only show if multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>

                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-white text-[11px] font-bold">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#1a1a1a]">
              <Images className="w-10 h-10 text-gray-700" />
              <span className="text-gray-600 text-xs">No Preview</span>
            </div>
          )}

          {/* Item Badge */}
          {itemNumber && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
              <span className="text-white text-[11px] font-bold tracking-tight">#{itemNumber}</span>
            </div>
          )}

          {/* Stock Status */}
          <div className={`absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg ${stockColor} bg-black/50 backdrop-blur-sm border border-white/10`}>
            {stockStatus}
          </div>

          {/* Thumbnail Strip - Show if multiple images */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-1.5 bg-black/70 backdrop-blur-md p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {allImages.slice(0, 3).map((img, idx) => (
                <button
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`w-8 h-8 rounded overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-[#8451E1]' : 'border-[#333]'}`}
                >
                  <img src={img.image_url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {allImages.length > 3 && (
                <div className="w-8 h-8 rounded bg-[#333] flex items-center justify-center text-white text-xs font-bold">
                  +{allImages.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-4 bg-black">
          <p className="text-[#999] text-[10px] font-bold uppercase tracking-widest mb-2">
            {brandName || 'Exclusive'}
          </p>

          <h3 className="text-[#f2f2f2] capitalize font-semibold text-sm line-clamp-2 leading-snug mb-3 h-10">
            {title}
          </h3>

          {/* Colors & Sizes Badge */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#222] text-[10px]">
            {colors.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {colors.slice(0, 2).map((color, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-[#333]"
                      style={{ backgroundColor: color.colorHex }}
                      title={color.colorName}
                    />
                  ))}
                  {colors.length > 2 && (
                    <span className="text-[#666] ml-1">+{colors.length - 2}</span>
                  )}
                </div>
              </div>
            )}
            {sizes.length > 0 && (
              <span className="text-[#666] ml-auto">{sizes.length} sizes</span>
            )}
          </div>

          {/* Material */}
          {material && (
            <p className="text-[#666] text-[9px] line-clamp-1 mb-3">{material}</p>
          )}

          {/* Price & Action */}
          <div className="flex items-center justify-between">
            <span className="text-[#f2f2f2] font-bold text-sm">
              {currency} {(price / 100).toLocaleString()}
            </span>

            <button
              onClick={handleAddToCart}
              disabled={isAdding || quantity === 0}
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${
                added
                  ? 'bg-green-500 scale-105 shadow-lg shadow-green-500/30'
                  : 'bg-[#8451E1] hover:bg-[#7240D0] active:scale-95'
              } disabled:opacity-50`}
            >
              {isAdding ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : added ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}