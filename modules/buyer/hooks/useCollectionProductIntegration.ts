import { useState, useMemo, useCallback } from 'react';
import { useCollectionProducts } from '@/modules/buyer/queries/useCollectionProducts';
import { useCollectionProductActions } from './useCollectionProductActions';

export interface CollectionProductIntegrationState {
  collectionId: string;
  sortBy: 'newest' | 'price-low' | 'price-high';
  filterColor: string | null;
  selectedProduct: any | null;
  showProductDetail: boolean;
}

export interface CollectionProductIntegrationResult {
  // Data
  collection: any;
  products: any[];
  sortedAndFilteredProducts: any[];
  selectedProduct: any | null;
  allColors: Array<{ colorName: string; colorHex: string }>;
  allSizes: string[];

  // UI State
  sortBy: 'newest' | 'price-low' | 'price-high';
  filterColor: string | null;
  showProductDetail: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSortBy: (sort: 'newest' | 'price-low' | 'price-high') => void;
  setFilterColor: (color: string | null) => void;
  selectProduct: (product: any) => void;
  closeProductDetail: () => void;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  toggleFavorite: (productId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  shareProduct: (product: any) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Computed
  filteredCount: number;
  averagePrice: number;
}

export function useCollectionProductIntegration(
  collectionId: string
): CollectionProductIntegrationResult {
  const { data, products = [], isLoading, error } = useCollectionProducts({ collectionId });
  const { addToCart: addToCartAction, toggleFavorite, shareProduct } = useCollectionProductActions();

  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  // Extract all colors from products
  const allColors = useMemo(() => {
    const colorMap = new Map<string, { colorName: string; colorHex: string }>();

    products?.forEach((product) => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant: any) => {
          const key = variant.colorHex || variant.color_hex;
          if (key && !colorMap.has(key)) {
            colorMap.set(key, {
              colorName: variant.colorName || variant.color_name,
              colorHex: key,
            });
          }
        });
      }
    });

    return Array.from(colorMap.values());
  }, [products]);

  // Extract all sizes from products
  const allSizes = useMemo(() => {
    const sizeSet = new Set<string>();

    products?.forEach((product) => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant: any) => {
          sizeSet.add(variant.size);
        });
      }
    });

    return Array.from(sizeSet);
  }, [products]);

  // Filter and sort products
  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) return [];

    // Apply color filter
    let filtered = products.filter((product) => {
      if (!filterColor) return true;

      if (product.variants && Array.isArray(product.variants)) {
        return product.variants.some((v: any) => (v.colorHex || v.color_hex) === filterColor);
      }

      return true;
    });

    // Apply sorting
    let sorted = [...filtered];

    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => ((a as any).price_cents || a.price * 100 || 0) - ((b as any).price_cents || b.price * 100 || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => ((b as any).price_cents || b.price * 100 || 0) - ((a as any).price_cents || a.price * 100 || 0));
        break;
      case 'newest':
      default:
        // Keep original order
        break;
    }

    return sorted;
  }, [products, sortBy, filterColor]);

  // Calculate average price
  const averagePrice = useMemo(() => {
    if (!products || products.length === 0) return 0;
    const total = products.reduce((sum, p) => sum + ((p as any).price_cents || p.price * 100 || 0), 0);
    return total / products.length / 100;
  }, [products]);

  // Handlers
  const selectProduct = useCallback((product: any) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  }, []);

  const closeProductDetail = useCallback(() => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  }, []);

  const addToCart = useCallback(
    async (productId: string, quantity: number = 1) => {
      return addToCartAction(productId, quantity);
    },
    [addToCartAction]
  );

  return {
    // Data
    collection: data,
    products: products || [],
    sortedAndFilteredProducts,
    selectedProduct,
    allColors,
    allSizes,

    // UI State
    sortBy,
    filterColor,
    showProductDetail,
    isLoading,
    error: error || null,

    // Actions
    setSortBy,
    setFilterColor,
    selectProduct,
    closeProductDetail,
    addToCart,
    toggleFavorite,
    shareProduct,

    // Computed
    filteredCount: sortedAndFilteredProducts.length,
    averagePrice,
  };
}