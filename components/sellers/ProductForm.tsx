'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductInfoForm from './NewListing/ProductInfoForm';
import CollectionForm from './NewListing/CollectionForm';
import AdditionalInfoForm from './NewListing/AdditionalInfoForm';
import PreviewForm from './NewListing/PreviewForm';
import { FormData } from '@/types/newListing';
import { getVanillaTRPCClient } from '@/lib/trpc';
import { uploadImage } from '@/lib/upload-image';

interface ProductFormProps {
  productType: 'single' | 'collection';
}

export function ProductForm({ productType }: ProductFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    category: '',
    description: '',
    sizes: [],
    releaseDate: '',
    supplyCapacity: 'no-max',
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
  const [images, setImages] = useState<File[]>([]);
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

  const handleFormChange = (data: Partial<FormData>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);
    const storageKey = `product_form_${productType}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  };

  const handleImagesChange = (newImages: File[]) => {
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
    const storageKey = `product_form_${productType}`;
    localStorage.removeItem(storageKey);
    router.push('/sellers/my-listings');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const trpc = getVanillaTRPCClient();
      
      if (productType === 'single') {
        // Upload images first
        const uploadedImageUrls: string[] = [];
        if (images && images.length > 0) {
          for (const image of images) {
            try {
              const uploaded = await uploadImage(image, 'store-assets', 'products');
              if (uploaded) {
                uploadedImageUrls.push(uploaded.url);
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
          colorsAvailable: formData.colors ? [{ colorName: formData.colors, colorHex: '#000000' }] : undefined,
          additionalTargetAudience: (formData.targetAudience as any) || null,
          shippingOption: (formData.shippingOption as any) || 'both',
          etaDomestic: formData.domesticDays ? `${parseInt(formData.domesticDays)}_days` : null,
          etaInternational: formData.internationalDays ? `${parseInt(formData.internationalDays)}_days` : null,
          refundPolicy: (formData.refundPolicy as any) || null,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
          sku: formData.sku || undefined,
          slug: formData.slug || undefined,
          metaDescription: formData.metaDescription || undefined,
          barcode: formData.barcode || undefined,
          videoUrl: formData.videoUrl || undefined,
          careInstructions: formData.careInstructions || undefined,
        };
        
        // Call createSingle mutation
        await trpc.listing.createSingle.mutate(singleListingInput as any);
      } else {
        // Collection submission - Upload images for each item first
        const itemsWithUploadedImages = await Promise.all(
          (formData.collectionItems || []).map(async (item) => {
            const uploadedImageUrls: string[] = [];
            
            // Upload item images if they exist and are File objects
            if (item.images && item.images.length > 0) {
              for (const imageFile of item.images) {
                try {
                  // Only upload if it's a File object (not already a URL string)
                  if (imageFile instanceof File) {
                    const uploaded = await uploadImage(imageFile, 'store-assets', 'collection-items');
                    if (uploaded) {
                      uploadedImageUrls.push(uploaded.url);
                    }
                  } else if (typeof imageFile === 'string') {
                    // Already a URL string
                    uploadedImageUrls.push(imageFile);
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
          etaDomestic: formData.domesticDays ? `${parseInt(formData.domesticDays)}_days` : null,
          etaInternational: formData.internationalDays ? `${parseInt(formData.internationalDays)}_days` : null,
          refundPolicy: (formData.refundPolicy as any) || null,
          sku: formData.collectionSku || undefined,
          slug: formData.collectionSlug || undefined,
          metaDescription: formData.collectionMetaDescription || undefined,
          barcode: formData.collectionBarcode || undefined,
          videoUrl: formData.collectionVideoUrl || undefined,
          careInstructions: formData.collectionCareInstructions || undefined,
        };
        
        // Call createCollection mutation
        await trpc.listing.createCollection.mutate(collectionInput as any);
      }
      
      // Clear localStorage after successful submission
      const storageKey = `product_form_${productType}`;
      localStorage.removeItem(storageKey);
      
      // Redirect to my-listings page
      router.push('/sellers/my-listings');
      router.refresh();
    } catch (err) {
      console.error('Submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create listing. Please try again.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {productType === 'single' ? (
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
      ) : (
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
          onItemsChange={(items) => handleFormChange({ collectionItems: items })}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}