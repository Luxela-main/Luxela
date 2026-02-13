"use client";

import { use, useMemo, useState, useEffect, useCallback } from "react";
import { useListings } from "@/context/ListingsContext";
import { useCartState } from "@/modules/cart/context";
import { useAuth } from "@/context/AuthContext";
import { trpc } from "@/app/_trpc/client";
import { addToFavorites, removeFromFavorites, isFavorite } from "@/server/actions/favorites";
import { toastSvc } from "@/services/toast";

import Link from "next/link";
import {
  ArrowLeft,
  Images,
  ShoppingCart,
  Package,
  Check,
  Loader2,
  LogIn,
  Truck,
  Palette,
  Heart,
  Share2,
  Star,
  Filter,
  ArrowUpDown,
  Zap,
  AlertCircle,
  Shield,
  AlertTriangle,
  Globe,
  RotateCcw,
  Shirt,
  Barcode,
  Film,
  Info,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo/structured-data";
import { SITE } from "@/lib/seo/config";


const formatRefundPolicy = (policy: string) => {
  const policies: Record<string, string> = {
    no_refunds: "No Refunds",
    "48hrs": "48 Hours",
    "72hrs": "72 Hours",
    "5_working_days": "5 Working Days",
    "1week": "1 Week",
    "14days": "14 Days",
    "30days": "30 Days",
    "60days": "60 Days",
    store_credit: "Store Credit",
  };
  return policies[policy] || policy;
};


const formatShippingEta = (eta: string) => {
  const etas: Record<string, string> = {
    same_day: "Same Day",
    next_day: "Next Day",
    "48hrs": "48 Hours",
    "72hrs": "72 Hours",
    "5_working_days": "5 Working Days",
    "1_2_weeks": "1-2 Weeks",
    "2_3_weeks": "2-3 Weeks",
    custom: "Custom",
  };
  return etas[eta] || eta;
};


const formatShippingOption = (option: string) => {
  const options: Record<string, string> = {
    local: "Local Only",
    international: "International Only",
    both: "Both Local & International",
  };
  return options[option] || option;
};

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getListingById, loading } = useListings();
  const { user } = useAuth();
  const { addToCart: addToCartCtx } = useCartState();
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest">("newest");
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [resolvedCollectionId, setResolvedCollectionId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [collectionAddedCount, setCollectionAddedCount] = useState(0);
  const [collectionListingId, setCollectionListingId] = useState<string | null>(null);

  
  useEffect(() => {
    if (!id) return;
    setCollectionId(id);
  }, [id]);

  
  const { data: collectionData, isLoading: isLoadingCollectionData } = trpc.collection.getApprovedCollections.useQuery(
    {
      limit: 100,
      offset: 0,
    },
    {
      staleTime: 5 * 60 * 1000, 
      gcTime: 10 * 60 * 1000, 
    }
  );

  
  useEffect(() => {
    if (!collectionId) return;
    
    
    if (collectionData?.collections) {
      const matchedCollection = collectionData.collections.find((c: any) => c.id === collectionId);
      if (matchedCollection?.collectionId) {
        
        setResolvedCollectionId(matchedCollection.collectionId);
        return;
      }
    }
    
    
    setResolvedCollectionId(collectionId);
  }, [collectionData?.collections, collectionId]);

  const { data: detailedCollectionData, isLoading: isLoadingDetailedData } = trpc.collection.getBuyerCollectionWithProducts.useQuery(
    { collectionId: resolvedCollectionId! },
    {
      enabled: !!resolvedCollectionId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );

  // Track collection listing ID and check favorite status
  useEffect(() => {
    if (!detailedCollectionData?.listing?.id) return;
    
    setCollectionListingId(detailedCollectionData.listing.id);
    
    // Check if collection is favorited
    if (user) {
      const checkFavorite = async () => {
        const result = await isFavorite(detailedCollectionData.listing.id);
        setIsFavorited(result.isFavorite);
      };
      checkFavorite();
    }
  }, [detailedCollectionData?.listing?.id, user]);

  const isLoadingPage = loading || isLoadingCollectionData || isLoadingDetailedData;
  const collectionProductsData = useMemo(() => {
    if (!collectionData?.collections || !collectionId) return null;
    
    const byListingId = collectionData.collections.find((c: any) => c.id === collectionId);
    if (byListingId) return byListingId;
    
    const byCollectionId = collectionData.collections.find((c: any) => c.collectionId === collectionId);
    return byCollectionId || null;
  }, [collectionData?.collections, collectionId]);
  
  const collection = collectionProductsData || detailedCollectionData;
  const products = collectionProductsData?.items || detailedCollectionData?.items || [];

  // Log the raw data structure to verify all fields are present
  useEffect(() => {
    if (collectionProductsData?.items && collectionProductsData.items.length > 0) {
      const firstItem = collectionProductsData.items[0];
      console.log('[Collection] First item from backend (raw):', {
        material: firstItem.material,
        careInstructions: firstItem.careInstructions,
        videoUrl: firstItem.videoUrl,
        etaDomestic: firstItem.etaDomestic,
        etaInternational: firstItem.etaInternational,
        shippingOption: firstItem.shippingOption,
        refundPolicy: firstItem.refundPolicy,
        sku: firstItem.sku,
        barcode: firstItem.barcode,
        colorsAvailable: firstItem.colorsAvailable,
        sizesJson: firstItem.sizesJson,
        metaDescription: firstItem.metaDescription,
        allKeys: Object.keys(firstItem).sort(),
      });
    }
  }, [collectionProductsData?.items]);

  const items = useMemo(() => {
    const sourceItems = collectionProductsData?.items || detailedCollectionData?.items || [];
    
    if (!sourceItems || sourceItems.length === 0) return [];

    
    const collectionListingId = detailedCollectionData?.listing?.id || collection?.id;
    console.log('[Collection items] collectionListingId:', collectionListingId);

    return sourceItems.map((item: any, idx: number) => {
      
      
      const hasEmbeddedListing = !item.listing; 
      const listingData = item.listing || item;
      const product = item.product;
      
      // Use the individual product's listing ID from the backend response
      // Backend now returns listingId at the root level for each collection item
      const itemListingId = item.listingId || item.listing?.id || collectionListingId;
      
      console.log(`[Collection items] Item ${idx} listingId check:`, {
        backendListingId: item.listingId,
        hasListing: !!item.listing,
        itemListingId: item.listing?.id,
        collectionListingId,
        finalListingId: itemListingId,
      });
      
      let colors_available: any[] = [];
      
      const colorSource = listingData?.colorsAvailable || listingData?.colors_available || listingData?.colors || item.listing?.colorsAvailable || item.listing?.colors_available;
      if (colorSource) {
        try {
          colors_available = typeof colorSource === 'string' 
            ? JSON.parse(colorSource) 
            : Array.isArray(colorSource) ? colorSource : [];
          console.log('[Collection] Color source for item', idx, ':', {colorSource, parsed: colors_available});
        } catch (e) {
          console.error('[Collection] Color parse error for item', idx, ':', e);
          colors_available = [];
        }
      }
      
      let sizes: any[] = [];
      const sizeSource = listingData?.sizesJson || listingData?.sizes || item.listing?.sizesJson || item.listing?.sizes;
      if (sizeSource) {
        try {
          sizes = typeof sizeSource === 'string' 
            ? JSON.parse(sizeSource) 
            : Array.isArray(sizeSource) ? sizeSource : [];
        } catch (e) {
          sizes = [];
        }
      }
      
      const materialSource = listingData?.material;
      const itemTitle = item.title || item.productName || product?.name || `Item ${idx + 1}`;
      
      // Prepare shipping details for easy access
      const shippingDetails = {
        option: listingData?.shippingOption,
        etaDomestic: listingData?.etaDomestic,
        etaInternational: listingData?.etaInternational
      };
      
      let itemImages: Array<{ imageUrl: string; position?: number }> = [];
      if (hasEmbeddedListing && item.images) {
        itemImages = item.images.map((img: any) => ({ imageUrl: img.image || img.imageUrl, position: img.position }));
      } else if (item.images) {
        itemImages = item.images as Array<{ imageUrl: string; position?: number }>;
      }
      
      // Backend returns 'listingImage' for collection items (from getApprovedCollections query)
      const listingImage = item.listingImage || item.image;
      const mainImage = itemImages?.[0]?.imageUrl || 
                        (listingImage && hasEmbeddedListing ? listingImage : null) ||
                        product?.images?.[0]?.imageUrl || 
                        null;
      
      const mappedItem = {
        id: product?.id || item.productId || item.id, 
        productId: product?.id || item.productId || item.id, 
        listingId: itemListingId,
        collectionItemListingId: itemListingId, 
        title: itemTitle,
        name: itemTitle,
        priceCents: listingData?.priceCents || item?.priceCents || 0,
        price_cents: listingData?.priceCents || item?.priceCents || 0,
        currency: listingData?.currency || item?.currency || 'NGN',
        image: mainImage,
        colors_available: colors_available,
        colors: colors_available,
        sizes: sizes,
        description: listingData?.description || product?.description,
        material_composition: materialSource || product?.description,
        quantity_available: listingData?.quantityAvailable || 0,
        inStock: (listingData?.quantityAvailable || 0) > 0,
        images: itemImages,
        careInstructions: listingData?.careInstructions,
        refundPolicy: listingData?.refundPolicy,
        videoUrl: listingData?.videoUrl,
        shippingOption: listingData?.shippingOption,
        etaDomestic: listingData?.etaDomestic,
        etaInternational: listingData?.etaInternational,
        sku: listingData?.sku,
        barcode: listingData?.barcode,
        metaDescription: listingData?.metaDescription,
        category: listingData?.category,
        shippingDetails: shippingDetails,
        rating: 4.5,
        reviewCount: 12,
      };
      if (idx === 0) {
        console.log(`[Collection] ✅ First item FINAL mapped fields:`, {
          title: mappedItem.title,
          material_composition: mappedItem.material_composition,
          careInstructions: mappedItem.careInstructions,
          videoUrl: mappedItem.videoUrl,
          etaDomestic: mappedItem.etaDomestic,
          etaInternational: mappedItem.etaInternational,
          shippingOption: mappedItem.shippingOption,
          refundPolicy: mappedItem.refundPolicy,
          sku: mappedItem.sku,
          barcode: mappedItem.barcode,
          colors: mappedItem.colors?.length || 0,
          sizes: mappedItem.sizes?.length || 0,
        });
      }
      
      return mappedItem;
    });
  }, [collectionProductsData?.items, detailedCollectionData?.items, collection, products]);

  const avgRating = useMemo(() => {
    if (items.length === 0) return 0;
    const totalRating = items.reduce((sum: number, item: any) => sum + (item.rating || 0), 0);
    return totalRating / items.length;
  }, [items]);

  const totalReviews = useMemo(() => {
    return items.reduce((sum: number, item: any) => sum + (item.reviewCount || 0), 0);
  }, [items]);

  const allColors = useMemo(() => {
    const colorMap = new Map<string, { colorName: string; colorHex: string }>();
    items.forEach((item) => {
      try {
        let colors = item.colors_available
          ? Array.isArray(item.colors_available)
            ? item.colors_available
            : typeof item.colors_available === 'string' ? JSON.parse(item.colors_available) : []
          : [];
        
        // Normalize color format
        colors = colors.map((color: any) => ({
          colorName: color.colorName || color.name || '',
          colorHex: color.colorHex || color.hex || '#000000',
        })).filter((c: any) => c.colorName && c.colorHex);
        
        console.log('[allColors] Item colors:', {  itemTitle: item.title, colorCount: colors.length, colorsData: item.colors_available });
        colors.forEach((color: any) => {
          if (!colorMap.has(color.colorHex)) {
            colorMap.set(color.colorHex, color);
          }
        });
      } catch (e) {
        console.error('[allColors] Error processing:', e);
      }
    });
    return Array.from(colorMap.values());
  }, [items]);

  const sortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      if (!filterColor) return true;
      try {
        const colors = item.colors_available
          ? Array.isArray(item.colors_available)
            ? item.colors_available
            : JSON.parse(item.colors_available)
          : [];
        return colors.some((c: any) => (c.colorHex || c.hex) === filterColor);
      } catch (e) {
        return true;
      }
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price_cents || 0) - (b.price_cents || 0);
        case "price-high":
          return (b.price_cents || 0) - (a.price_cents || 0);
        case "newest":
        default:
          return 0;
      }
    });
  }, [items, sortBy, filterColor]);

  const totalPriceCents = items.reduce((sum, item) => sum + (item.priceCents || item.price_cents || 0), 0);
  const totalPrice = totalPriceCents > 0 ? totalPriceCents / 100 : 0;

  const handleAddCollectionToCart = useCallback(async () => {
    if (!user) {
      toastSvc.warning('Please sign in to add items to cart');
      return;
    }

    if (items.length === 0) {
      toastSvc.warning('No items in this collection');
      return;
    }

    setIsAddingCollection(true);
    setCollectionAddedCount(0);

    try {
      let addedCount = 0;
      const skippedItems: string[] = [];

      
      // Add each item in the collection individually to the cart
      for (const item of items) {
        if (!item.listingId) {
          console.warn('Item missing listingId, skipping:', {
            itemId: item.id,
            itemTitle: item.title,
            itemProductId: item.productId,
          });
          skippedItems.push(item.title || 'Unknown item');
          continue;
        }
        
        try {
          await addToCartCtx(item.listingId, 1);
          addedCount++;
          // Update progress in real-time
          setCollectionAddedCount(addedCount);
        } catch (itemErr: any) {
          const errorMsg = itemErr?.data?.message || itemErr?.message || itemErr?.toString() || 'Unknown error';
          console.error(`Failed to add item ${item.listingId}:`, {
            listingId: item.listingId,
            itemTitle: item.title,
            message: errorMsg,
            code: itemErr?.data?.code,
            error: itemErr,
          });
          // Continue with other items even if one fails
          toastSvc.error(`Could not add "${item.title || 'item'}" to cart: ${errorMsg}`);
        }
      }
      
      if (skippedItems.length > 0) {
        console.warn('[handleAddCollectionToCart] Skipped items without listings:', skippedItems);
      }
      
      setCollectionAddedCount(addedCount);
      if (addedCount > 0) {
        toastSvc.success(`🎉 Added ${addedCount} item${addedCount !== 1 ? 's' : ''} to cart!`);
      } else {
        toastSvc.error('Failed to add any items from this collection to cart.');
      }
    } catch (err: any) {
      console.error('Failed to add collection to cart:', err);
      toastSvc.error(err?.message || 'Failed to add collection to cart. Please try again.');
    } finally {
      setIsAddingCollection(false);
    }
  }, [items, user, addToCartCtx]);

  if (isLoadingPage)
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading collection...</p>
        </div>
      </div>
    );

  if (!collection)
    return (
      <div className="bg-black min-h-screen text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Collection not found</p>
          <Link
            href="/buyer/collections"
            className="inline-flex items-center gap-2 text-[#8451E1] mt-4 hover:text-purple-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
        </div>
      </div>
    );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE.url },
    { name: "Collections", url: `${SITE.url}/buyer/collections` },
    { name: collectionProductsData?.collectionName ?? collectionProductsData?.title ?? "Collection", url: `${SITE.url}/buyer/collection/${id}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbSchema} id="collection-breadcrumb" />
      <div className="bg-gradient-to-br from-black via-[#0a0a0a] to-[#0f0a1a] min-h-screen overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#8451E1]/15 rounded-full blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-[#5C2EAF]/10 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2s"></div>
        </div>
        <div className="relative z-10">
          <div className="px-6 py-6 border-b border-[#8451E1]/10 sticky top-0 bg-gradient-to-b from-black/98 via-black/95 to-black/80 backdrop-blur-xl z-40 shadow-lg shadow-[#8451E1]/10">
            <div className="max-w-7xl mx-auto">
              <Link
                href="/buyer/collections"
                className="inline-flex items-center gap-2 text-[#acacac] hover:text-[#8451E1] transition-all duration-300 mb-6 hover:gap-3 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Collections
              </Link>
            </div>
          </div>

          <div className="px-6 py-12">
            <div className="max-w-7xl mx-auto">
              {collectionProductsData?.image && (
                <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-12 border border-[#8451E1]/30 shadow-2xl shadow-[#8451E1]/20 hover:shadow-[0_0_50px_rgba(132,81,225,0.35)] transition-all duration-500 group">
                  <img
                    src={collectionProductsData.image}
                    alt={collectionProductsData?.collectionName ?? "Collection"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[#8451E1] text-sm font-bold uppercase tracking-wider mb-2">
                          {collectionProductsData?.sellerName ?? "Luxela"}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-[#d0d0d0] bg-clip-text text-transparent capitalize mb-3 drop-shadow-lg">
                          {collectionProductsData?.collectionName ?? collectionProductsData?.title}
                        </h1>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={async () => {
                            if (!user) {
                              toastSvc.warning('Please sign in to favorite');
                              return;
                            }
                            
                            if (!collectionListingId) {
                              toastSvc.error('Collection listing not found');
                              return;
                            }
                            
                            setIsLoadingFavorite(true);
                            try {
                              if (isFavorited) {
                                const result = await removeFromFavorites(collectionListingId!);
                                if (result.success) {
                                  setIsFavorited(false);
                                  toastSvc.success('Removed from favorites');
                                } else {
                                  toastSvc.error(result.error || 'Failed to remove from favorites');
                                }
                              } else {
                                const result = await addToFavorites(collectionListingId!);
                                if (result.success) {
                                  setIsFavorited(true);
                                  toastSvc.success('Added to favorites!');
                                } else {
                                  toastSvc.error(result.error || 'Failed to add to favorites');
                                }
                              }
                            } catch (error) {
                              console.error('Error toggling favorite:', error);
                              toastSvc.error('Failed to update favorites');
                            } finally {
                              setIsLoadingFavorite(false);
                            }
                          }}
                          disabled={isLoadingFavorite}
                          className="p-3 bg-gradient-to-br from-[#8451E1]/30 to-[#5C2EAF]/30 hover:from-[#8451E1]/50 hover:to-[#5C2EAF]/50 rounded-lg transition-all duration-300 backdrop-blur-sm border border-[#8451E1]/40 hover:border-[#8451E1]/70 hover:shadow-lg hover:shadow-[#8451E1]/30 hover:scale-110 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingFavorite ? (
                            <Loader2 className="w-5 h-5 text-[#8451E1] animate-spin" />
                          ) : (
                            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: collectionProductsData?.collectionName ?? 'Collection',
                                text: collectionProductsData?.collectionDescription ?? 'Check out this amazing collection!',
                                url: window.location.href,
                              });
                            } else {
                              navigator.clipboard.writeText(window.location.href);
                              toastSvc.success('Collection link copied to clipboard!');
                            }
                          }}
                          className="p-3 bg-gradient-to-br from-[#8451E1]/30 to-[#5C2EAF]/30 hover:from-[#8451E1]/50 hover:to-[#5C2EAF]/50 rounded-lg transition-all duration-300 backdrop-blur-sm border border-[#8451E1]/40 hover:border-[#8451E1]/70 hover:shadow-lg hover:shadow-[#8451E1]/30 hover:scale-110 cursor-pointer active:scale-95"
                        >
                          <Share2 className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in">
                <div className="md:col-span-2 bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl rounded-2xl border border-[#8451E1]/30 p-6 md:p-8 shadow-xl shadow-[#8451E1]/10 hover:border-[#8451E1]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(132,81,225,0.2)]">
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-[#d0d0d0] bg-clip-text text-transparent mb-3 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#8451E1] to-[#5C2EAF] rounded-full"></div>
                    About This Collection
                  </h2>
                  {(collectionProductsData?.collectionDescription ?? collectionProductsData?.description) && (
                    <p className="text-[#acacac] leading-relaxed text-sm group hover:text-[#d0d0d0] transition-colors duration-300">
                      {collectionProductsData?.collectionDescription ?? collectionProductsData?.description}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#0f0f1a]/90 backdrop-blur-xl rounded-2xl border border-[#8451E1]/40 p-6 md:p-8 shadow-xl shadow-[#8451E1]/20 hover:shadow-[0_0_40px_rgba(132,81,225,0.35)] transition-all duration-500 hover:border-[#8451E1]/70 hover:scale-105">
                  <h3 className="text-sm font-semibold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent mb-6 uppercase tracking-wide">
                    Collection Stats
                  </h3>
                  <div className="space-y-6">
                    <div className="pb-6 border-b border-[#8451E1]/10">
                      <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold">
                        Total Items
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                        {items.length}
                      </p>
                    </div>
                    <div className="pb-6 border-b border-[#8451E1]/10">
                      <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold">
                        Total Collection Price
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                        NGN {totalPrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold">
                        Average Rating
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-[#666]'}`}
                            />
                          ))}
                        </div>
                        <div>
                          <p className="text-lg font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                            {avgRating.toFixed(1)}
                          </p>
                          <p className="text-[#666] text-xs">
                            ({totalReviews} reviews)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-10 pb-8 border-b border-[#8451E1]/20">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-[#999] bg-clip-text text-transparent">
                  Items in Collection
                </h2>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {allColors.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 hover:border-[#8451E1]/70 transition-all duration-300 hover:shadow-lg hover:shadow-[#8451E1]/20">
                      <Palette className="w-4 h-4 text-[#8451E1]" />
                      <select
                        value={filterColor || ""}
                        onChange={(e) => setFilterColor(e.target.value || null)}
                        className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none"
                      >
                        <option value="">All Colors</option>
                        {allColors.map((color) => (
                          <option key={color.colorHex} value={color.colorHex}>
                            {color.colorName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 hover:border-[#8451E1]/70 transition-all duration-300 hover:shadow-lg hover:shadow-[#8451E1]/20">
                    <ArrowUpDown className="w-4 h-4 text-[#8451E1]" />
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as "price-low" | "price-high" | "newest"
                        )
                      }
                      className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="newest">Newest</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>

                  <div className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#8451E1]/20 to-[#5C2EAF]/20 border border-[#8451E1]/40 text-[#8451E1] text-sm font-semibold">
                    {sortedItems.length} items
                  </div>

                  {sortedItems.length > 0 && (
                    <button
                      onClick={handleAddCollectionToCart}
                      disabled={isAddingCollection}
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white text-sm font-semibold transition-all duration-300 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                      {isAddingCollection ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Adding ({collectionAddedCount}/{items.length})
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add All to Cart
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {sortedItems.length === 0 ? (
                <div className="text-center py-20 animate-fade-in">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8451E1]/30 to-[#5C2EAF]/20 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#8451E1]/20">
                    <Images className="w-10 h-10 text-[#8451E1]/60" />
                  </div>
                  <p className="text-[#acacac] text-lg font-medium mb-2">
                    No items found
                  </p>
                  <p className="text-[#666] text-sm">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-12">
                  {sortedItems.map((item: any, index: number) => (
                    <CollectionItemCard
                      key={item.id}
                      item={item}
                      collectionId={id}
                      productId={item.listingId} 
                      brandName={collectionProductsData?.sellerName ?? undefined}
                      index={index}
                      itemNumber={items.indexOf(item) + 1}
                      onSelect={setSelectedItem}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedItem && (
            <ItemDetailModal
              item={selectedItem}
              collection={collection}
              brandName={collectionProductsData?.sellerName ?? undefined}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      </div>
    </>
  );
}

function CollectionItemCard({
  item,
  collectionId,
  productId,
  brandName,
  index,
  itemNumber,
  onSelect,
}: {
  item: any;
  collectionId: string;
  productId?: string | null;
  brandName?: string;
  index: number;
  itemNumber: number;
  onSelect: (item: any) => void;
}) {
  const { addToCart } = useCartState();
  const { user } = useAuth();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isAdding || !productId) return;

    console.log('[CollectionItemCard.handleAddToCart] Attempting to add to cart:', {
      productId,
      itemId: item.id,
      itemTitle: item.title || item.name,
      itemListingId: item.listingId,
      itemData: item,
    });

    setIsAdding(true);
    try {
      if (!productId) {
        throw new Error('Product ID (listing ID) is missing. Cannot add to cart.');
      }
      await addToCart(productId, 1);
      setAdded(true);
      toastSvc.success(`${item.title || item.name} added to cart`);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || err?.toString() || "Failed to add to cart";
      console.error("[CollectionItemCard.handleAddToCart] Error:", {
        productId,
        itemId: item.id,
        itemListingId: item.listingId,
        message: errorMessage,
        code: err?.data?.code,
        fullError: err,
      });
      toastSvc.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const isValidImage =
    typeof item.image === "string" &&
    item.image.length > 0 &&
    !item.image.includes("placeholder.com");

  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    if (item.colors_available) {
      colors = Array.isArray(item.colors_available)
        ? item.colors_available
        : typeof item.colors_available === 'string' ? JSON.parse(item.colors_available) : [];
    }
  } catch (e) {
    console.error('[CollectionItemCard] Color parsing error:', e);
  }

  let sizes: string[] = [];
  try {
    if (item.sizes) {
      sizes = Array.isArray(item.sizes) ? item.sizes : JSON.parse(item.sizes);
    }
  } catch (e) {}

  const stockStatus =
    item.quantity_available === 0 || !item.inStock
      ? "Out of Stock"
      : item.quantity_available <= 5
        ? `${item.quantity_available} left`
        : "In Stock";

  const stockColor =
    item.quantity_available === 0
      ? "text-red-500"
      : item.quantity_available <= 5
        ? "text-orange-500"
        : "text-green-500";

  return (
    <>
      <div className="group h-full animate-fade-in">
        <div
          onClick={() => onSelect(item)}
          className="cursor-pointer h-full bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-[#8451E1]/30 hover:border-[#8451E1]/80 transition-all duration-500 shadow-xl hover:shadow-[0_0_40px_rgba(132,81,225,0.35)] hover:-translate-y-2 hover:scale-105 flex flex-col group"
        >
          <div className="h-72 md:h-80 bg-[#1a1a1a] relative overflow-hidden flex-shrink-0">
            {isValidImage ? (
              <img
                src={item.image}
                alt={item.title || item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#1a1a1a]">
                <Images className="w-10 h-10 text-gray-700" />
                <span className="text-gray-600 text-xs">No Preview</span>
              </div>
            )}

            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#8451E1]/70 to-[#5C2EAF]/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#8451E1]/50 shadow-lg shadow-[#8451E1]/30">
              <span className="text-white text-[11px] font-bold tracking-tight">
                #{itemNumber}
              </span>
            </div>

            <div className={`absolute bottom-3 left-3 text-xs font-semibold px-3 py-1.5 rounded-lg ${stockColor} backdrop-blur-md border transition-all duration-300 ${
              item.quantity_available === 0 ? 'bg-red-500/20 border-red-500/40' :
              item.quantity_available <= 5 ? 'bg-orange-500/20 border-orange-500/40' :
              'bg-green-500/20 border-green-500/40'
            }`}>
              {stockStatus}
            </div>
          </div>

          <div className="p-4 md:p-5 bg-black flex flex-col flex-grow">
            <p className="text-[#8451E1] text-[10px] font-bold uppercase tracking-widest mb-2.5">
              {brandName ?? "Exclusive"}
            </p>

            <h3 className="text-[#f2f2f2] capitalize font-semibold text-sm line-clamp-2 leading-snug mb-3 h-10 flex-grow">
              {item.title || item.name || `Item ${itemNumber}`}
            </h3>

            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#8451E1]/20 text-[10px]">
              {colors.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1">
                    {colors.slice(0, 2).map((color, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-[#8451E1]/30 shadow-lg"
                        style={{ backgroundColor: color.colorHex }}
                        title={color.colorName}
                      />
                    ))}
                    {colors.length > 2 && (
                      <span className="text-[#8451E1] ml-1 font-semibold">+{colors.length - 2}</span>
                    )}
                  </div>
                </div>
              )}
              {sizes.length > 0 && (
                <span className="text-[#8451E1] ml-auto font-semibold">{sizes.length} sizes</span>
              )}
            </div>

            <div className="space-y-1 mb-3 text-[9px]">
              {item.material_composition && (
                <p className="text-[#999] line-clamp-1">
                  <span className="text-[#8451E1] font-semibold">Material:</span> {item.material_composition}
                </p>
              )}
              {item.careInstructions && (
                <p className="text-[#999] line-clamp-1">
                  <span className="text-[#8451E1] font-semibold">Care:</span> {item.careInstructions}
                </p>
              )}
              {item.refundPolicy && (
                <p className="text-[#999] line-clamp-1">
                  <span className="text-[#8451E1] font-semibold">Return:</span> {formatRefundPolicy(item.refundPolicy)}
                </p>
              )}
              {(item.etaDomestic || item.etaInternational) && (
                <p className="text-[#999] line-clamp-1">
                  <span className="text-[#8451E1] font-semibold">Ship:</span> 
                  {item.etaDomestic ? formatShippingEta(item.etaDomestic) : ''}
                  {item.etaDomestic && item.etaInternational ? '/' : ''}
                  {item.etaInternational ? formatShippingEta(item.etaInternational) : ''}
                </p>
              )}
              {item.sku && (
                <p className="text-[#999] line-clamp-1">
                  <span className="text-[#8451E1] font-semibold">SKU:</span> {item.sku}
                </p>
              )}
            </div>

            {(item.videoUrl || item.metaDescription) && (
              <div className="flex gap-2 mb-3 flex-wrap items-center">
                {item.videoUrl && (
                  <div className="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center gap-1">
                    <Film className="w-3 h-3 text-cyan-400" />
                    <span className="text-[7px] text-cyan-400 font-semibold uppercase">Video</span>
                  </div>
                )}
                {item.metaDescription && (
                  <div className="text-[7px] text-[#666] italic line-clamp-1 flex-grow">
                    {item.metaDescription}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#8451E1]/20">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < Math.round(item.rating || 4.5) ? 'fill-yellow-400 text-yellow-400' : 'text-[#666]'}`}
                  />
                ))}
              </div>
              <span className="text-[#999] text-[9px]">({item.reviewCount || 0})</span>
            </div>

            <div className="flex items-center justify-between mt-auto pt-3">
              <span className="text-[#f2f2f2] font-bold text-sm bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                {item.currency ?? "NGN"}{" "}
                {((item.priceCents ?? item.price_cents ?? 0) / 100).toLocaleString()}
              </span>

              {productId && (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || added || item.quantity_available === 0}
                  className={`
                    flex items-center justify-center p-2 rounded-lg transition-all duration-300
                    ${
                      added
                        ? "bg-green-500 scale-105 shadow-lg shadow-green-500/30 cursor-default"
                        : item.quantity_available === 0
                          ? "bg-[#5C2EAF]/50 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 hover:scale-110 active:scale-95 cursor-pointer"
                    }
                    ${isAdding ? 'opacity-75' : ''}
                  `}
                  aria-label="Add to cart"
                  type="button"
                >
                  {isAdding ? (
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : added ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <ShoppingCart className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-gradient-to-br from-[#0e0e0e] to-[#1a0a2e] border-[#8451E1]/30 text-white rounded-2xl shadow-2xl shadow-[#8451E1]/20">
          <DialogHeader className="items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#8451E1]/30 to-[#5C2EAF]/30 rounded-2xl flex items-center justify-center mb-4 border border-[#8451E1]/50">
              <LogIn className="w-7 h-7 text-[#8451E1]" />
            </div>
            <DialogTitle className="text-xl">Join Luxela</DialogTitle>
            <DialogDescription className="text-[#acacac] text-sm pt-2">
              Sign in to add{" "}
              <span className="text-white font-medium">
                {item.title || item.name}
              </span>{" "}
              to your cart.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() =>
                router.push(
                  `/signin?redirect=/buyer/collection/${collectionId}`
                )
              }
              className="w-full bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold py-4 rounded-lg transition-all duration-300"
            >
              Log In
            </button>
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full text-[#999] text-sm font-medium hover:text-[#8451E1] transition-colors duration-300"
            >
              Browse more
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ItemDetailModal({
  item,
  collection,
  brandName,
  onClose,
}: {
  item: any;
  collection: any;
  brandName?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const { data: reviewsData, refetch: refetchReviews } = trpc.products.getProductReviews.useQuery(
    { productId: item.id, limit: 10, offset: 0 },
    { 
      enabled: !!item.id,
      staleTime: 1 * 60 * 1000, 
      gcTime: 5 * 60 * 1000, 
    }
  );

  const createReviewMutation = trpc.products.createProductReview.useMutation({
    onSuccess: () => {
      setReviewText("");
      setSelectedRating(5);
      setIsSubmittingReview(false);
      refetchReviews();
      toastSvc.success("Review submitted successfully!");
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to submit review");
      setIsSubmittingReview(false);
    },
  });

  useEffect(() => {
    if (reviewsData?.reviews) {
      setReviews(reviewsData.reviews);
    }
  }, [reviewsData?.reviews]);

  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    if (item.colors_available) {
      let parsedColors = Array.isArray(item.colors_available)
        ? item.colors_available
        : typeof item.colors_available === 'string' ? JSON.parse(item.colors_available) : [];
      
      // Normalize color format to { colorName, colorHex }
      colors = parsedColors.map((color: any) => ({
        colorName: color.colorName || color.name || '',
        colorHex: color.colorHex || color.hex || '#000000',
      })).filter((c: any) => c.colorName && c.colorHex);
    }
    console.log('[ItemDetailModal] Colors parsed:', { colors, itemTitle: item.title });
  } catch (e) {
    console.error('[ItemDetailModal] Color parsing error:', e);
  }

  let sizes: string[] = [];
  try {
    if (item.sizes) {
      sizes = Array.isArray(item.sizes) ? item.sizes : JSON.parse(item.sizes);
    }
  } catch (e) {}

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      toastSvc.error("Please enter a review");
      return;
    }

    if (!user) {
      toastSvc.error("Please log in to submit a review");
      return;
    }

    setIsSubmittingReview(true);
    await createReviewMutation.mutateAsync({
      productId: item.id,
      rating: selectedRating,
      review: reviewText,
    });
  };

  const imageGallery = item.images && item.images.length > 0 ? item.images : [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#0e0e0e] to-[#1a0a2e] border-[#8451E1]/30 text-white rounded-2xl max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl shadow-[#8451E1]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-white to-[#999] bg-clip-text text-transparent">{item.title || item.name}</DialogTitle>
          <DialogDescription className="text-[#8451E1] text-sm font-medium">
            {brandName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          <div className="space-y-4">
            {imageGallery.length > 0 ? (
              <>
                <div className="h-80 bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#8451E1]/20 shadow-lg relative group">
                  <img
                    src={imageGallery[currentImageIndex]?.imageUrl || item.image}
                    alt={`${item.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {imageGallery.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imageGallery.length) % imageGallery.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#8451E1]/70 hover:bg-[#8451E1] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imageGallery.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#8451E1]/70 hover:bg-[#8451E1] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-lg text-xs text-white">
                        {currentImageIndex + 1} / {imageGallery.length}
                      </div>
                    </>
                  )}
                </div>

                {imageGallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {imageGallery.map((img: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          currentImageIndex === idx ? 'border-[#8451E1]' : 'border-[#8451E1]/30'
                        }`}
                      >
                        <img
                          src={img.imageUrl || img.image}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-80 bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#8451E1]/20 shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <Images className="w-12 h-12 text-[#8451E1]/50 mx-auto mb-2" />
                  <p className="text-[#666]">No images available</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 text-sm overflow-y-auto max-h-[600px] pr-2">
            <div className="bg-[#1a1a2e]/50 rounded-lg p-3 border border-[#8451E1]/20">
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1 font-semibold">
                Price
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                {item.currency ?? "NGN"}{" "}
                {((item.priceCents ?? item.price_cents ?? 0) / 100).toLocaleString()}
              </p>
            </div>

            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
              <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold">
                Customer Rating
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(item.rating || 4.5) ? 'fill-yellow-400 text-yellow-400' : 'text-[#666]'}`}
                    />
                  ))}
                </div>
                <span className="text-blue-300 font-medium">
                  {(item.rating || 4.5).toFixed(1)} ({item.reviewCount || 0} reviews)
                </span>
              </div>
            </div>

            <div className={`rounded-lg p-3 border ${
              item.quantity_available > 0
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1 font-semibold">
                Stock Status
              </p>
              <p className={`font-semibold ${
                item.quantity_available > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {item.quantity_available > 0 ? `${item.quantity_available} units available` : 'Out of Stock'}
              </p>
            </div>

            {colors.length > 0 && (
              <div className="bg-[#1a1a2e]/50 rounded-lg p-3 border border-[#8451E1]/20">
                <p className="text-[#666] text-xs uppercase tracking-wider mb-3 font-semibold">
                  Available Colors ({colors.length} total, {selectedColors.length} selected)
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {colors.map((color, i) => {
                    const isSelected = selectedColors.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedColors(
                            isSelected
                              ? selectedColors.filter(idx => idx !== i)
                              : [...selectedColors, i]
                          );
                        }}
                        className="relative w-8 h-8 rounded-full border-2 hover:scale-110 transition-all duration-300 cursor-pointer"
                        style={{
                          backgroundColor: color.colorHex,
                          borderColor: isSelected ? '#8451E1' : 'rgba(132, 81, 225, 0.3)',
                          boxShadow: isSelected ? '0 0 12px rgba(132, 81, 225, 0.6)' : 'none',
                        }}
                        title={color.colorName}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedColors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedColors.map((colorIdx) => (
                      <div key={colorIdx} className="flex items-center gap-1.5 bg-[#8451E1]/20 border border-[#8451E1]/50 rounded-full pl-3 pr-2 py-1">
                        <div
                          className="w-3 h-3 rounded-full border border-[#8451E1]/70"
                          style={{ backgroundColor: colors[colorIdx].colorHex }}
                        />
                        <span className="text-xs text-[#8451E1] font-medium">{colors[colorIdx].colorName}</span>
                        <button
                          onClick={() => setSelectedColors(selectedColors.filter(idx => idx !== colorIdx))}
                          className="text-[#8451E1]/70 hover:text-[#8451E1] font-bold text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sizes.length > 0 && (
              <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#0f0f1a]/50 rounded-lg p-4 border border-[#8451E1]/30 shadow-lg shadow-[#8451E1]/10">
                <p className="text-[#8451E1] text-xs uppercase tracking-wider mb-4 font-bold flex items-center gap-2">
                  <Shirt className="w-4 h-4" />
                  Available Sizes ({sizes.length} Total)
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sizes.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSizes(
                            isSelected
                              ? selectedSizes.filter(s => s !== size)
                              : [...selectedSizes, size]
                          );
                        }}
                        className={`relative px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 cursor-pointer shadow-md ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#8451E1] to-[#7240D0] text-white shadow-lg shadow-[#8451E1]/50 border border-[#8451E1]/70 hover:scale-105'
                            : 'bg-[#0a0a0a] text-[#acacac] border border-[#8451E1]/40 hover:border-[#8451E1]/70 hover:text-[#8451E1]'
                        }`}
                      >
                        {size}
                        {isSelected && (
                          <Check className="w-4 h-4 inline-block ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedSizes.length > 0 && (
                  <div className="pt-3 border-t border-[#8451E1]/20">
                    <p className="text-xs text-[#666] mb-2 font-semibold">Selected ({selectedSizes.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSizes.map((size) => (
                        <div key={size} className="flex items-center gap-1.5 bg-[#8451E1]/20 border border-[#8451E1]/50 rounded-full px-3 py-1">
                          <span className="text-xs text-[#8451E1] font-medium">{size}</span>
                          <button
                            onClick={() => setSelectedSizes(selectedSizes.filter(s => s !== size))}
                            className="text-[#8451E1]/70 hover:text-[#8451E1] font-bold text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {item.material_composition && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider mb-1 font-semibold">
                  Material
                </p>
                <p className="text-[#acacac]">{item.material_composition}</p>
              </div>
            )}

            {item.careInstructions && (
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                <p className="text-[#666] text-xs uppercase tracking-wider mb-1 font-semibold flex items-center gap-2">
                  <Shirt className="w-4 h-4" /> Care Instructions
                </p>
                <p className="text-blue-300 text-sm">{item.careInstructions}</p>
              </div>
            )}

            {item.refundPolicy && (
              <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/30">
                <p className="text-[#666] text-xs uppercase tracking-wider mb-1 font-semibold flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Refund Policy
                </p>
                <p className="text-orange-300 text-sm">{formatRefundPolicy(item.refundPolicy)}</p>
              </div>
            )}

            {(item.etaDomestic || item.etaInternational) && (
              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Shipping
                </p>
                <div className="space-y-1 text-purple-300 text-sm">
                  {item.etaDomestic && (
                    <p><span className="font-semibold">Domestic:</span> {formatShippingEta(item.etaDomestic)}</p>
                  )}
                  {item.etaInternational && (
                    <p><span className="font-semibold">International:</span> {formatShippingEta(item.etaInternational)}</p>
                  )}
                  {item.shippingOption && (
                    <p><span className="font-semibold">Options:</span> {formatShippingOption(item.shippingOption)}</p>
                  )}
                </div>
              </div>
            )}

            {(item.sku || item.barcode) && (
              <div className="bg-gray-500/10 rounded-lg p-3 border border-gray-500/30">
                <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold">
                  Product IDs
                </p>
                <div className="space-y-1 text-gray-300 text-xs font-mono">
                  {item.sku && <p><span className="font-semibold">SKU:</span> {item.sku}</p>}
                  {item.barcode && <p><span className="font-semibold">Barcode:</span> {item.barcode}</p>}
                </div>
              </div>
            )}

            {item.videoUrl && (
              <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/30">
                <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold flex items-center gap-2">
                  <Film className="w-4 h-4" /> Product Video
                </p>
                <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-xs break-all">
                  {item.videoUrl}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#8451E1]/20">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-white to-[#d0d0d0] bg-clip-text text-transparent">
            Customer Reviews & Ratings
          </h3>

          {}
          {user ? (
            <div className="bg-[#1a1a2e]/50 rounded-lg p-4 border border-[#8451E1]/20 mb-6">
              <p className="text-sm text-[#999] mb-3">Share your experience with this product</p>
              
              <div className="mb-4">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-2 font-semibold">Your Rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= selectedRating ? 'fill-yellow-400 text-yellow-400' : 'text-[#666]'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-[#999]">{selectedRating}/5</span>
                </div>
              </div>

              <div className="mb-4">
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your review here..."
                  className="w-full bg-[#0a0a0a] border border-[#8451E1]/30 rounded-lg p-3 text-white placeholder-[#666] focus:border-[#8451E1]/70 focus:outline-none resize-none text-sm"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-[#666] mt-1">{reviewText.length}/1000</p>
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !reviewText.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-[#1a1a2e]/50 rounded-lg p-4 border border-[#8451E1]/20 mb-6 text-center">
              <p className="text-[#999] text-sm">
                <Link href="/signin" className="text-[#8451E1] hover:text-[#c084fc] font-semibold">
                  Sign in
                </Link>
                {" "}to leave a review
              </p>
            </div>
          )}

          {}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {reviews.length > 0 ? (
              reviews.map((review: any, idx: number) => (
                <div key={idx} className="bg-[#1a1a2e]/30 rounded-lg p-4 border border-[#8451E1]/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">Anonymous User</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-[#666]'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-[#999]">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#acacac]">{review.review}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[#666] text-sm">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

if (typeof document !== 'undefined') {
  const styleId = 'collection-page-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes blob {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        33% {
          transform: translate(30px, -50px) scale(1.1);
        }
        66% {
          transform: translate(-20px, 20px) scale(0.9);
        }
      }
      
      .animate-fade-in {
        animation: fadeIn 0.6s ease-out forwards;
        opacity: 0;
      }
      
      .animate-blob {
        animation: blob 7s infinite;
      }
      
      .animation-delay-2s {
        animation-delay: 2s;
      }
    `;
    document.head.appendChild(style);
  }
}