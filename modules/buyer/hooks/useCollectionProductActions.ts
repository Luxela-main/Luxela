import { useState, useCallback } from 'react';
import { useCartState } from '@/modules/cart/context';
import { useAuth } from '@/context/AuthContext';
import { toastSvc } from '@/services/toast';

interface ProductActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface UseCollectionProductActionsResult {
  isAddingToCart: boolean;
  isFavorited: boolean;
  isSharing: boolean;
  addToCart: (productId: string, quantity: number) => Promise<ProductActionResult>;
  toggleFavorite: (productId: string) => Promise<ProductActionResult>;
  shareProduct: (product: any) => Promise<ProductActionResult>;
}

export function useCollectionProductActions(): UseCollectionProductActionsResult {
  const { addToCart: addToCartCart } = useCartState();
  const { user } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const addToCart = useCallback(
    async (productId: string, quantity: number = 1): Promise<ProductActionResult> => {
      if (!user) {
        return {
          success: false,
          error: 'Please sign in to add items to cart',
        };
      }

      setIsAddingToCart(true);
      try {
        await addToCartCart(productId, quantity);
        toastSvc.success('Added to cart');
        return { success: true, message: 'Added to cart' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart';
        toastSvc.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsAddingToCart(false);
      }
    },
    [user, addToCartCart]
  );

  const toggleFavorite = useCallback(
    async (productId: string): Promise<ProductActionResult> => {
      if (!user) {
        return {
          success: false,
          error: 'Please sign in to favorite items',
        };
      }

      try {
        // TODO: Implement favorite toggle logic
        setIsFavorited((prev) => !prev);
        toastSvc.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
        return {
          success: true,
          message: isFavorited ? 'Removed from favorites' : 'Added to favorites',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update favorite';
        toastSvc.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [user, isFavorited]
  );

  const shareProduct = useCallback(
    async (product: any): Promise<ProductActionResult> => {
      setIsSharing(true);
      try {
        const productUrl = `${window.location.origin}/buyer/product/${product.id}`;
        const title = product.title || product.name;
        const text = `Check out ${title} on Luxela`;

        if (navigator.share) {
          await navigator.share({
            title,
            text,
            url: productUrl,
          });
          return { success: true, message: 'Shared successfully' };
        } else {
          // Fallback: Copy to clipboard
          await navigator.clipboard.writeText(productUrl);
          toastSvc.success('Link copied to clipboard');
          return { success: true, message: 'Link copied to clipboard' };
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          const errorMessage = error.message || 'Failed to share product';
          toastSvc.error(errorMessage);
          return { success: false, error: errorMessage };
        }
        return { success: false };
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  return {
    isAddingToCart,
    isFavorited,
    isSharing,
    addToCart,
    toggleFavorite,
    shareProduct,
  };
}