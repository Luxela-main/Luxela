'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import ProductInfoForm from './NewListing/ProductInfoForm';
import CollectionForm from './NewListing/CollectionForm';
import AdditionalInfoForm from './NewListing/AdditionalInfoForm';
import PreviewForm from './NewListing/PreviewForm';
import SuccessModal from './NewListing/SuccessModal';
import { FormData } from '@/types/newListing';
import { trpc } from '@/app/_trpc/client';
import { uploadImage } from '@/lib/upload-image';

// Color palette matching AdditionalInfoForm
const AVAILABLE_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Crimson', hex: '#DC143C' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Navy Blue', hex: '#000080' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Green', hex: '#00AA00' },
  { name: 'Dark Green', hex: '#006400' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Dark Orange', hex: '#FF8C00' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Violet', hex: '#EE82EE' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Light Gray', hex: '#D3D3D3' },
  { name: 'Beige', hex: '#F5F5DC' },
];

// Helper function to parse colors from comma-separated string to array with hex values
const parseColorsWithHex = (colorsString: string | undefined) => {
  if (!colorsString || typeof colorsString !== 'string') return undefined;
  
  const colorNames = colorsString.split(',').map(c => c.trim()).filter(c => c);
  if (colorNames.length === 0) return undefined;
  
  const colorsWithHex = colorNames.map(colorName => {
    const colorObj = AVAILABLE_COLORS.find(c => c.name.toLowerCase() === colorName.toLowerCase());
    console.log(`[ProductForm] Color: "${colorName}" -> Hex: ${colorObj?.hex || 'NOT FOUND (defaulting to black)'}`);
    if (!colorObj) {
      console.warn(`[ProductForm] Color not found: \"${colorName}\". Available colors: ${AVAILABLE_COLORS.map(c => c.name).join(', ')}`);
    }
    return {
      colorName: colorObj?.name || colorName,
      colorHex: colorObj?.hex || '#000000'
    };
  });
  
  return colorsWithHex;
};

interface ProductFormProps {
  productType: 'single' | 'collection';
}

export function ProductForm({ productType }: ProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [isLoadingExisting, setIsLoadingExisting] = useState(!!editId);

  // Initialize TRPC mutations
  const { mutateAsync: createSingleAsync } = (trpc.listing as any).createSingle.useMutation();
  const { mutateAsync: updateSingleAsync } = (trpc.listing as any).updateListing.useMutation();

  const { mutateAsync: createCollectionAsync } = (trpc.listing as any).createCollection.useMutation();
  const { mutateAsync: updateCollectionAsync } = (trpc.listing as any).updateCollection.useMutation();

  // Fetch existing listings
  const { data: listings = [] } = (trpc.listing as any).getMyListings.useQuery();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    category: '',
    description: '',
    sizes: [],
    releaseDate: '',
    supplyCapacity: 'no_max',
    quantity: '',
    showBadge: 'do_not_show',
    releaseDuration: '',
    material: '',
    colors: '',
    sku: '',
    barcode: '',
    slug: '',
    metaDescription: '',
    videoUrl: '',
    careInstructions: '',
    refundPolicy: '',
    targetAudience: '',
    shippingOption: '',
    domesticDays: '',
    domesticMinutes: '',
    internationalDays: '',
    internationalMinutes: '',
    images: [],
    videos: [],
  });
  const [images, setImages] = useState<(File | string)[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved form data from localStorage
  useEffect(() => {
    const storageKey = `product_form_${productType}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved form data:', error);
      }
    }
  }, [productType]);

  // Load existing listing data when editing
  useEffect(() => {
    if (!editId || listings.length === 0) {
      setIsLoadingExisting(false);
      return;
    }

    try {
      const existingListing = listings.find((l: any) => l.id === editId);
      if (!existingListing) {
        console.warn('[ProductForm] Listing not found for editId:', editId);
        setIsLoadingExisting(false);
        return;
      }

      console.log('[ProductForm] Loading existing listing for edit:', existingListing);

      // Convert colors array back to comma-separated string
      const colorsString = existingListing.colorsAvailable
        ? Array.isArray(existingListing.colorsAvailable)
          ? existingListing.colorsAvailable
              .map((c: any) => (typeof c === 'string' ? c : c.colorName))
              .join(', ')
          : existingListing.colorsAvailable
        : '';

      // Convert sizes array to comma-separated string
      const sizesString = existingListing.sizesJson
        ? Array.isArray(existingListing.sizesJson)
          ? existingListing.sizesJson.join(', ')
          : existingListing.sizesJson
        : '';

      // Parse itemsJson if it exists
      let collectionItems = [];
      if (existingListing.itemsJson) {
        collectionItems = Array.isArray(existingListing.itemsJson)
          ? existingListing.itemsJson
          : typeof existingListing.itemsJson === 'string'
          ? JSON.parse(existingListing.itemsJson)
          : [];
      }

      // Build the form data object
      const loadedFormData: Partial<FormData> = {
        name: existingListing.title || '',
        price: existingListing.priceCents ? (existingListing.priceCents / 100).toString() : '',
        category: existingListing.category || '',
        description: existingListing.description || '',
        sizes: existingListing.sizesJson || [],
        material: existingListing.materialComposition || '',
        colors: colorsString,
        targetAudience: existingListing.additionalTargetAudience || '',
        refundPolicy: existingListing.refundPolicy || '',
        shippingOption: existingListing.shippingOption || '',
        domesticDays: existingListing.etaDomestic || '',
        internationalDays: existingListing.etaInternational || '',
        supplyCapacity: existingListing.supplyCapacity || 'no_max',
        quantity: existingListing.quantityAvailable?.toString() || '',
        showBadge: existingListing.limitedEditionBadge ? 'show_badge' : 'do_not_show',
        releaseDuration: existingListing.releaseDuration || '',
      };

      // Add collection-specific fields if editing a collection
      if (productType === 'collection') {
        loadedFormData.collectionTitle = existingListing.title || '';
        loadedFormData.collectionDescription = existingListing.description || '';
        loadedFormData.collectionSku = existingListing.sku || '';
        loadedFormData.collectionSlug = existingListing.slug || '';
        loadedFormData.collectionMetaDescription = existingListing.metaDescription || '';
        loadedFormData.collectionBarcode = existingListing.barcode || '';
        loadedFormData.collectionVideoUrl = existingListing.videoUrl || '';
        loadedFormData.collectionCareInstructions = existingListing.careInstructions || '';
        
        // Load collection items with their images
        const itemsWithImages = collectionItems.map((item: any) => {
          const itemImages = item.imagesJson
            ? Array.isArray(item.imagesJson)
              ? item.imagesJson
              : typeof item.imagesJson === 'string'
              ? JSON.parse(item.imagesJson)
              : []
            : [];
          return {
            ...item,
            images: itemImages, // Set images as URLs for display and editing
          };
        });
        
        loadedFormData.collectionItems = itemsWithImages;
      }

      // Add single-specific fields if editing a single
      if (productType === 'single') {
        loadedFormData.sku = existingListing.sku || '';
        loadedFormData.barcode = existingListing.barcode || '';
        loadedFormData.slug = existingListing.slug || '';
        loadedFormData.metaDescription = existingListing.metaDescription || '';
        loadedFormData.videoUrl = existingListing.videoUrl || '';
        loadedFormData.careInstructions = existingListing.careInstructions || '';
      }

      // Load images from the listing's imagesJson
      if (existingListing.imagesJson) {
        try {
          const imageUrls = Array.isArray(existingListing.imagesJson)
            ? existingListing.imagesJson
            : typeof existingListing.imagesJson === 'string'
            ? JSON.parse(existingListing.imagesJson)
            : [];
          loadedFormData.imageUrls = imageUrls;
          // Also set images state so they display in ImageUpload component
          setImages(imageUrls as (File | string)[]);
        } catch (err) {
          console.error('[ProductForm] Failed to parse images:', err);
        }
      }

      console.log('[ProductForm] Loaded form data:', loadedFormData);
      setFormData((prev) => ({ ...prev, ...loadedFormData }));
      setIsLoadingExisting(false);
    } catch (err) {
      console.error('[ProductForm] Error loading existing listing:', err);
      setIsLoadingExisting(false);
    }
  }, [editId, listings, productType]);

  const handleFormChange = (data: Partial<FormData>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);
    const storageKey = `product_form_${productType}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  };

  const handleImagesChange = (newImages: (File | string)[]) => {
    setImages(newImages);
    handleFormChange({ images: newImages });
  };

  const handleVideosChange = (newVideos: File[]) => {
    setVideos(newVideos);
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCancel = () => {
    if (!editId) {
      const storageKey = `product_form_${productType}`;
      localStorage.removeItem(storageKey);
    }
    router.push('/sellers/my-listings');
  };

  const mapEtaValue = (value: string): string | null => {
    if (!value) return null;
    const days = parseInt(value);
    
    // Map days to shipping ETA enum values
    const etaMap: { [key: number]: string } = {
      0: 'same_day',
      1: 'next_day',
      2: '48hrs',
      3: '72hrs',
      5: '5_working_days',
    };
    
    // Check if exact day match exists
    if (etaMap[days]) {
      return etaMap[days];
    }
    
    // Otherwise map to appropriate range
    if (days === 1) return 'next_day';
    if (days === 2) return '48hrs';
    if (days === 3) return '72hrs';
    if (days === 4 || days === 5) return '5_working_days';
    if (days >= 6 && days <= 14) return '1_2_weeks';
    if (days >= 15 && days <= 21) return '2_3_weeks';
    
    return 'custom';
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Comprehensive validation before submission
      if (productType === 'single') {
        if (!formData.name || !formData.name.trim()) {
          throw new Error('Product name is required');
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
          throw new Error('Valid product price is required and must be greater than 0');
        }
      }
      
      let createdTitle = '';
      
      // Debug logging
      console.log('[ProductForm] Form colors value:', formData.colors);
      const parsedColors = parseColorsWithHex(formData.colors);
      console.log('[ProductForm] Parsed colors:', parsedColors);
      
      if (productType === 'single') {
        // Upload images first (only upload File objects, keep URL strings as-is)
        const uploadedImageUrls: string[] = [];
        if (images && images.length > 0) {
          for (const image of images) {
            try {
              // If it's already a string URL, keep it as-is
              if (typeof image === 'string') {
                uploadedImageUrls.push(image);
              } else if (image instanceof File) {
                // Only upload File objects
                const uploaded = await uploadImage(image, 'store-assets', 'products');
                if (uploaded) {
                  uploadedImageUrls.push(uploaded.url);
                }
              }
            } catch (imgErr) {
              console.error('Image upload error:', imgErr);
            }
          }
        }
        
        // Convert price string to cents (Solana)
        const priceCents = Math.round(parseFloat(formData.price || '0') * 100);
        
        // Prepare single listing input
        const singleListingInput = {
          title: formData.name,
          description: formData.description,
          category: (formData.category as any) || null,
          priceCents,
          currency: 'SOL',
          sizes: formData.sizes && formData.sizes.length > 0 ? formData.sizes : undefined,
          supplyCapacity: (formData.supplyCapacity as any) || 'no_max',
          quantityAvailable: formData.supplyCapacity === 'limited' ? parseInt(formData.quantity || '0') : undefined,
          limitedEditionBadge: (formData.showBadge as any) || 'do_not_show',
          releaseDuration: (formData.releaseDuration as any) || null,
          materialComposition: formData.material || null,
          colorsAvailable: parseColorsWithHex(formData.colors),
          additionalTargetAudience: (formData.targetAudience as any) || null,
          shippingOption: (formData.shippingOption as any) || 'both',
          etaDomestic: mapEtaValue(formData.domesticDays),
          etaInternational: mapEtaValue(formData.internationalDays),
          refundPolicy: (formData.refundPolicy as any) || null,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
          sku: formData.sku || undefined,
          slug: formData.slug || undefined,
          metaDescription: formData.metaDescription || undefined,
          barcode: formData.barcode || undefined,
          videoUrl: formData.videoUrl || undefined,
          careInstructions: formData.careInstructions || undefined,
        };
        
        // Call createSingle or updateSingle mutation with timeout safeguard
        if (editId) {
          await Promise.race([
            updateSingleAsync({ id: editId, ...singleListingInput } as any),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Product update request timed out after 30 seconds')), 30000)
            ),
          ]);
        } else {
          await Promise.race([
            createSingleAsync(singleListingInput as any),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Product creation request timed out after 30 seconds')), 30000)
            ),
          ]);
        }
        createdTitle = formData.name;
      } else {
        // Collection submission - Upload images for each item first
        const itemsWithUploadedImages = await Promise.all(
          (formData.collectionItems || []).map(async (item: any) => {
            const uploadedImageUrls: string[] = [];
            
            // Upload item images if they exist
            if (item.images && item.images.length > 0) {
              for (const imageFile of item.images) {
                try {
                  // If it's a string URL, keep it as-is
                  if (typeof imageFile === 'string') {
                    uploadedImageUrls.push(imageFile);
                  } else if (imageFile instanceof File) {
                    // Only upload File objects
                    const uploaded = await uploadImage(imageFile, 'store-assets', 'collection-items');
                    if (uploaded) {
                      uploadedImageUrls.push(uploaded.url);
                    }
                  }
                } catch (imgErr) {
                  console.error(`Image upload error for item "${item.title}":`, imgErr);
                }
              }
            }
            
            return {
              ...item,
              images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
            };
          })
        );
        
        const collectionInput = {
          title: formData.collectionTitle || '',
          description: formData.collectionDescription || '',
          items: itemsWithUploadedImages,
          supplyCapacity: (formData.supplyCapacity as any) || 'no_max',
          shippingOption: (formData.shippingOption as any) || 'both',
          etaDomestic: mapEtaValue(formData.domesticDays),
          etaInternational: mapEtaValue(formData.internationalDays),
          refundPolicy: (formData.refundPolicy as any) || null,
          sku: formData.collectionSku || undefined,
          slug: formData.collectionSlug || undefined,
          metaDescription: formData.collectionMetaDescription || undefined,
          barcode: formData.collectionBarcode || undefined,
          videoUrl: formData.collectionVideoUrl || undefined,
          careInstructions: formData.collectionCareInstructions || undefined,
        };
        
        // Call createCollection or updateCollection mutation with timeout safeguard
        if (editId) {
          await Promise.race([
            updateCollectionAsync({ id: editId, ...collectionInput } as any),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Collection update request timed out after 30 seconds')), 30000)
            ),
          ]);
        } else {
          await Promise.race([
            createCollectionAsync(collectionInput as any),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Collection creation request timed out after 30 seconds')), 30000)
            ),
          ]);
        }
        createdTitle = formData.collectionTitle || '';
      }
      
      // Clear localStorage after successful submission
      const storageKey = `product_form_${productType}`;
      localStorage.removeItem(storageKey);
      
      // Invalidate listings query cache to fetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['listing', 'getMyListings'] });
      
      // Also invalidate collections cache for collection types
      if (productType === 'collection') {
        await queryClient.invalidateQueries({ queryKey: ['listing', 'getMyCollections'] });
      }
      
      // Show success modal
      setSuccessTitle(createdTitle);
      setShowSuccessModal(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error('[ProductForm] Submission error:', err);
      let errorMessage = 'Failed to create listing. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          errorMessage = (err as any).message;
        } else if ('data' in err && (err as any).data && 'message' in (err as any).data) {
          errorMessage = (err as any).data.message;
        } else {
          errorMessage = JSON.stringify(err);
        }
      }
      
      console.error('[ProductForm] Error message:', errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        productTitle={successTitle}
      />
      <div>
      {isLoadingExisting && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-[#8451E1] border-opacity-30 rounded-full animate-spin" />
            <p className="mt-4 text-gray-400 text-sm">Loading listing details...</p>
          </div>
        </div>
      )}
      {(!isLoadingExisting && productType === 'single') ? (
        // Single Product Flow
        <div>
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {['Product Info', 'Additional Info', 'Preview'].map(
                (step, index) => (
                  <div key={step} className="flex-1 flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                        index <= currentStep
                          ? 'bg-[#8451E1] text-white'
                          : 'bg-[#333] text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < 2 && (
                      <div
                        className={`flex-1 h-1 mx-2 transition-all ${
                          index < currentStep
                            ? 'bg-[#8451E1]'
                            : 'bg-[#333]'
                        }`}
                      />
                    )}
                  </div>
                )
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Product Info</span>
              <span>Additional Info</span>
              <span>Preview</span>
            </div>
          </div>

          {/* Forms */}
          {currentStep === 0 && (
            <ProductInfoForm
              formData={formData}
              onFormChange={handleFormChange}
              onNext={handleNext}
              onCancel={handleCancel}
              images={images}
              onImagesChange={handleImagesChange}
              videos={videos}
              onVideosChange={handleVideosChange}
            />
          )}
          {currentStep === 1 && (
            <AdditionalInfoForm
              formData={formData}
              onFormChange={handleFormChange}
              images={images}
              onImagesChange={handleImagesChange}
              onNext={handleNext}
              onCancel={handleCancel}
            />
          )}
          {currentStep === 2 && (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <PreviewForm
                formData={formData}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                error={error}
              />
            </>
          )}
        </div>
      ) : (!isLoadingExisting && productType === 'collection') ? (
        // Collection Flow
        <CollectionForm
          title={formData.collectionTitle || ''}
          description={formData.collectionDescription || ''}
          sku={formData.collectionSku}
          slug={formData.collectionSlug}
          metaDescription={formData.collectionMetaDescription}
          barcode={formData.collectionBarcode}
          videoUrl={formData.collectionVideoUrl}
          careInstructions={formData.collectionCareInstructions}
          refundPolicy={formData.collectionRefundPolicy}
          supplyCapacity={formData.supplyCapacity}
          shippingOption={formData.shippingOption}
          etaDomestic={formData.domesticDays}
          etaInternational={formData.internationalDays}
          items={formData.collectionItems || []}
          onTitleChange={(title) => handleFormChange({ collectionTitle: title })}
          onDescriptionChange={(desc) => handleFormChange({ collectionDescription: desc })}
          onSkuChange={(sku) => handleFormChange({ collectionSku: sku })}
          onSlugChange={(slug) => handleFormChange({ collectionSlug: slug })}
          onMetaDescriptionChange={(meta) => handleFormChange({ collectionMetaDescription: meta })}
          onBarcodeChange={(barcode) => handleFormChange({ collectionBarcode: barcode })}
          onVideoUrlChange={(url) => handleFormChange({ collectionVideoUrl: url })}
          onCareInstructionsChange={(care) => handleFormChange({ collectionCareInstructions: care })}
          onRefundPolicyChange={(policy) => handleFormChange({ collectionRefundPolicy: policy })}
          onSupplyCapacityChange={(capacity) => handleFormChange({ supplyCapacity: capacity })}
          onShippingOptionChange={(option) => handleFormChange({ shippingOption: option })}
          onEtaDomesticChange={(eta) => handleFormChange({ domesticDays: eta })}
          onEtaInternationalChange={(eta) => handleFormChange({ internationalDays: eta })}
          onItemsChange={(items) => handleFormChange({ collectionItems: items })}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
      </>
  );
}