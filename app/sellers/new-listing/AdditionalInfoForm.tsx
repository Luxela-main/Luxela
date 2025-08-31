import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ProductData } from '@/types';
import ImageUpload from './image-upload';

interface AdditionalInfoFormProps {
  product: ProductData;
  onProductChange: (product: ProductData) => void;
  images: File[];
  onImagesChange: (images: File[]) => void;
  setActiveTab: (tab: 'Product Information' | 'Additional Information' | 'Preview') => void;
}

const AdditionalInfoForm: React.FC<AdditionalInfoFormProps> = ({
  product,
  onProductChange,
  images,
  onImagesChange,
  setActiveTab
}) => {
  const handleInputChange = (field: keyof ProductData, value: string) => {
    onProductChange({ ...product, [field]: value });
  };

  const handleAudienceSelect = (audience: 'male' | 'female' | 'unisex') => {
    onProductChange({ ...product, targetAudience: audience });
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      <ImageUpload images={images} onImagesChange={onImagesChange} />

      <div className="col-span-7">
        <div className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Material/Composition</label>
            <Input
              value={product.materialComposition || ''}
              onChange={(e) => handleInputChange('materialComposition', e.target.value)}
              placeholder="What material is your product made from"
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Colors available</label>
            <Input
              value={product.colorsAvailable || ''}
              onChange={(e) => handleInputChange('colorsAvailable', e.target.value)}
              placeholder="Enter all product colours"
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Target audience</label>
            <div className="grid grid-cols-3 gap-4">
              {(['male', 'female', 'unisex'] as const).map((audience) => (
                <Button
                  key={audience}
                  variant="outline"
                  onClick={() => handleAudienceSelect(audience)}
                  className={`${product.targetAudience === audience
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-[#1a1a1a] border-[#333] hover:bg-[#222] hover:text-white'
                    }`}
                >
                  {audience.charAt(0).toUpperCase() + audience.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Shipping option</label>
            <RadioGroup
              value={product.shippingOption || 'local'}
              onValueChange={(value) => handleInputChange('shippingOption', value)}
              className="grid grid-cols-3 gap-4"
            >
              {(['local', 'international', 'both'] as const).map((option) => (
                <div key={option} className="flex items-center space-x-2 bg-[#1a1a1a] border border-[#333] rounded-md p-3">
                  <RadioGroupItem
                    value={option}
                    id={option}
                    className="text-purple-600"
                  />
                  <Label htmlFor={option} className="capitalize">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <label className="block text-sm mb-2">Estimated shipping time</label>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Within country</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={product.domesticDays || ''}
                  onChange={(e) => handleInputChange('domesticDays', e.target.value)}
                  placeholder="00 Days"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
                <Input
                  value={product.domesticMinutes || ''}
                  onChange={(e) => handleInputChange('domesticMinutes', e.target.value)}
                  placeholder="00 Minutes"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">International</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={product.internationalDays || ''}
                  onChange={(e) => handleInputChange('internationalDays', e.target.value)}
                  placeholder="00 Days"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
                <Input
                  value={product.internationalMinutes || ''}
                  onChange={(e) => handleInputChange('internationalMinutes', e.target.value)}
                  placeholder="00 Minutes"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-8 space-x-4">

          <Button
            onClick={() => setActiveTab("Preview")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Next
          </Button>
        </div>
      </div>
      
    </div>
  );
};
export default AdditionalInfoForm;