import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  Heart,
  Share2,
  Loader2,
  Check,
} from 'lucide-react';

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

interface ProductDetailModalWithGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: ProductImage[] | string[];
    image?: string;
    colors: ProductVariant[];
    sizes: string[];
    material?: string;
    quantity: number;
    brandName?: string;
    items_json?: any;
    description?: string;
  };
  onAddToCart?: (productId: string) => Promise<void>;
}

export function ProductDetailModalWithGallery({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: ProductDetailModalWithGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Convert string array to ProductImage objects if needed
  const normalizedImages: ProductImage[] = (product.images || []).map((img, idx) => {
    if (typeof img === 'string') {
      return { id: `img-${idx}`, image_url: img };
    }
    return img as ProductImage;
  });

  const allImages = normalizedImages.length > 0
    ? normalizedImages.sort((a, b) => (a.position || 0) - (b.position || 0))
    : product.image
      ? [{ id: '0', image_url: product.image }]
      : [];

  const currentImage = allImages[currentImageIndex]?.image_url || product.image;

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product.id]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      if (onAddToCart) {
        await onAddToCart(product.id);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const itemsJsonData = product.items_json
    ? Array.isArray(product.items_json)
      ? product.items_json
      : typeof product.items_json === 'string'
        ? JSON.parse(product.items_json)
        : product.items_json
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0e0e0e] border-[#222] text-white rounded-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Image Gallery Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative w-full bg-[#1a1a1a] rounded-xl overflow-hidden">
              {currentImage && (
                <>
                  <img
                    src={currentImage}
                    alt={product.title}
                    className="w-full h-auto object-contain aspect-square"
                  />

                  {/* Navigation Buttons */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-all z-10"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>

                      <button
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-all z-10"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>

                      {/* Image Counter */}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
              </> 
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === idx
                        ? 'border-[#8451E1] scale-105'
                        : 'border-[#333] hover:border-[#555]'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* Header */}
            <div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-[#2B2B2B] rounded transition-colors"
              >
                <X className="w-5 h-5 text-[#acacac]" />
              </button>

              {product.brandName && (
                <p className="text-[#8451E1] text-xs font-bold uppercase tracking-wider mb-2">
                  {product.brandName}
                </p>
              )}

              <h2 className="text-2xl font-bold text-white mb-3">{product.title}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-3xl font-bold text-[#8451E1]">
                  {product.currency} {(product.price / 100).toLocaleString()}
                </p>
              </div>

              {product.description && (
                <p className="text-[#acacac] text-sm mb-4">{product.description}</p>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-2">Availability</p>
                <p
                  className={`text-sm font-semibold ${
                    product.quantity === 0
                      ? 'text-red-500'
                      : product.quantity <= 5
                        ? 'text-orange-500'
                        : 'text-green-500'
                  }`}
                >
                  {product.quantity === 0
                    ? 'Out of Stock'
                    : product.quantity <= 5
                      ? `${product.quantity} left in stock`
                      : 'In Stock'}
                </p>
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-4 border-t border-[#222] pt-4">
              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="text-xs text-[#666] uppercase tracking-wider mb-3">
                    Available Colors
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, idx) => (
                      <button
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] hover:border-[#8451E1] transition-colors group"
                        title={color.colorName}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-[#555]"
                          style={{ backgroundColor: color.colorHex }}
                        />
                        <span className="text-xs text-white group-hover:text-[#8451E1]">
                          {color.colorName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <p className="text-xs text-[#666] uppercase tracking-wider mb-3">
                    Available Sizes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, idx) => (
                      <button
                        key={idx}
                        className="px-4 py-2 rounded-lg border border-[#333] hover:border-[#8451E1] text-white hover:text-[#8451E1] transition-colors text-sm font-medium"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Material */}
              {product.material && (
                <div>
                  <p className="text-xs text-[#666] uppercase tracking-wider mb-2">Material</p>
                  <p className="text-sm text-white">{product.material}</p>
                </div>
              )}
            </div>

            {/* Items JSON Data */}
            {itemsJsonData && (
              <div className="border-t border-[#222] pt-4">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-3">Details</p>
                <div className="bg-[#1a1a1a] rounded-lg p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-[#acacac] overflow-auto">
                    {JSON.stringify(itemsJsonData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-[#222] pt-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.quantity === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-[#8451E1] hover:bg-[#7240D0] text-white'
                } disabled:opacity-50`}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : added ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className="p-3 rounded-lg border border-[#333] hover:border-[#8451E1] text-[#acacac] hover:text-[#8451E1] transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-[#8451E1]' : ''}`} />
              </button>

              <button className="p-3 rounded-lg border border-[#333] hover:border-[#8451E1] text-[#acacac] hover:text-[#8451E1] transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}