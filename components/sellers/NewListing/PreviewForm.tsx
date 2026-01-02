// PreviewForm.tsx
import React from 'react';
import { FormData } from '@/types/newListing';
import ImagePreview from '@/app/sellers/new-listing/image-preview';

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
          {/* Price */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Price</label>
            <p className="text-white">{formData.price || '₦14,500.00'}</p>
          </div>

          {/* Product Name */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Product name</label>
            <p className="text-white">{formData.name || 'Name of Product'}</p>
          </div>

          {/* Product Type */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Product type</label>
            <p className="text-white">{formData.category || 'Clothing'}</p>
          </div>

          {/* Product Description */}
          <div className="border-b border-[#333] pb-4">
            <label className="block text-sm text-gray-400 mb-1">Product description</label>
            <p className="text-white">
              {formData.description || 
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'}
            </p>
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
            <p className="text-white">{formData.releaseDate || '30-09-2024'}</p>
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
            <p className="text-white">{formData.quantity || '40'}</p>
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
              {formData.releaseDurationDays || '30'} Days, {formData.releaseDurationMinutes || '20'} Hours
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
            <p className="text-white">{formData.colors || 'Yellow, Black, Magenta, Titanium, Bleached'}</p>
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
              {formData.domesticDays || '2'} Days within country, {formData.internationalDays || '10'} Days international shipping
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-[#333] rounded-lg hover:border-gray-600 transition"
          >
            Cancel
          </button>
         

        
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium ${
              isSubmitting 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700'
            } text-white transition-colors`}
          >
            {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewForm;