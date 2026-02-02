// PreviewForm.tsx
import React from 'react';
import { FormData } from '@/types/newListing';
import ImagePreview from '@/app/sellers/new-listing/image-preview';
import { Button } from "@/components/ui/button";

interface PreviewFormProps {
  formData: FormData;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean
  error:string | null
}

const PreviewForm: React.FC<PreviewFormProps> = ({
  formData,
  onSubmit,
  onCancel,
  isSubmitting,
  error
}) => {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column - Images */}
      <div className="col-span-12 lg:col-span-5">
    <ImagePreview images={formData.images} />

      </div>

      {/* Right Column - Preview Details */}
      <div className="col-span-12 lg:col-span-7 text-sm">
        <div className="space-y-6">
         

          {/* Product Name */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Product name</label>
            <p className="text-white">{formData.name || 'Name of Product'}</p>
          </div>

           {/* Price */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Price</label>
            <p className="text-white">{formData.price || ''}</p>
          </div>

          {/* Product Type */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Product type</label>
            <p className="text-white">{formData.category || 'others'}</p>
          </div>

          {/* Product Description */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Product description</label>
            <p className="text-white">
              {formData.description || ''}            </p>
          </div>

          {/* Sizes Available */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Sizes available</label>
            <p className="text-white">
              {formData.sizes?.length > 0 ? formData.sizes.join(', ') : 'S, L, XL, XXL, XXXL'}
            </p>
          </div>

          {/* Release Date */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Release date</label>
            <p className="text-white">{formData.releaseDate || ''}</p>
          </div>

          {/* Supply Capacity */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Supply capacity</label>
            <p className="text-white">
              {formData.supplyCapacity === 'limited' ? 'Limited supply' : 'No maximum supply'}
            </p>
          </div>

          {/* Quantity */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Quantity</label>
            <p className="text-white">{formData.quantity || ''}</p>
          </div>

          {/* Show Limited Edition Badge */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Show limited edition badge?</label>
            <p className="text-white">{formData.showBadge === 'do_not_show' ? 'show_badge' : 'do_not_show'}</p>
          </div>

          {/* Release Duration */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Release duration</label>
            <p className="text-white">{formData.releaseDuration || 'Limited time'}</p>
          </div>

          {/* Release Duration Time */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Release duration</label>
            <p className="text-white">
              {formData.releaseDurationDays || ''} Days, {formData.releaseDurationMinutes || ''} Hours
            </p>
          </div>

          {/* Material/Composition */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Material/Composition</label>
            <p className="text-white">{formData.material || 'Cotton, Polyester'}</p>
          </div>

          {/* Colour Options */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Colour options</label>
            <p className="text-white">{formData.colors || ''}</p>
          </div>

          {/* Target Audience */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Target audience</label>
            <p className="text-white capitalize">{formData.targetAudience || 'Unisex'}</p>
          </div>

          {/* Shipping Options */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Shipping options</label>
            <p className="text-white">
              {formData.shippingOption === 'both' 
                ? 'Domestic and international shipping' 
                : formData.shippingOption === 'local'
                ? 'Domestic shipping only'
                : formData.shippingOption === 'international'
                ? 'International shipping only'
                : 'Domestic and international shipping'}
            </p>
          </div>

          {/* Estimated Shipping Time */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Estimated shipping time</label>
            <p className="text-white">
              {formData.domesticDays || ''} Days within country, {formData.internationalDays || ''} Days international shipping
            </p>
          </div>

          {/* SKU */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">SKU (Stock Keeping Unit)</label>
            <p className="text-white">{formData.sku || 'Auto-generated'}</p>
          </div>

          {/* Slug */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">URL Slug</label>
            <p className="text-white">{formData.slug || 'Auto-generated'}</p>
          </div>

          {/* Meta Description */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Meta Description (SEO)</label>
            <p className="text-white text-xs">{formData.metaDescription || 'Not specified'}</p>
          </div>

          {/* Barcode */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Barcode</label>
            <p className="text-white">{formData.barcode || 'Not specified'}</p>
          </div>

          {/* Video URL */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Product Video URL</label>
            <p className="text-white text-xs break-all">{formData.videoUrl || 'Not specified'}</p>
          </div>

          {/* Care Instructions */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Care Instructions</label>
            <p className="text-white">{formData.careInstructions || 'Not specified'}</p>
          </div>

          {/* Refund Policy */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Refund Policy</label>
            <p className="text-white capitalize">
              {formData.refundPolicy ? formData.refundPolicy.replace(/_/g, ' ') : 'Not specified'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-8">
          <Button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 bg-transparent hover:bg-transparent border border-[#333] rounded-lg hover:border-gray-600 transition"
          >
            Cancel
          </Button>
         

        <Button
  onClick={onSubmit}
  disabled={isSubmitting}
  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
    isSubmitting 
      ? 'bg-[#8451E1]/50 cursor-not-allowed' 
      : 'bg-[#8451E1] hover:bg-[#7340D0]'
  } text-white transition-colors`}
>
  {isSubmitting && (
    <svg 
      className="animate-spin h-5 w-5 text-white" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )}
  {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
</Button>
        </div>
      </div>
    </div>
  );
};

export default PreviewForm;