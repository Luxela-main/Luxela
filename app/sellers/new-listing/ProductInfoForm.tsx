import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProductData } from '@/types';
import ImageUpload from './image-upload';
import { Button } from '@/components/ui/button';

interface ProductInfoFormProps {
  product: ProductData;
  onProductChange: (product: ProductData) => void;
  images: File[];
  onImagesChange: (images: File[]) => void;
  setActiveTab: (tab: 'Product Information' | 'Additional Information' | 'Preview') => void;
}

const ProductInfoForm: React.FC<ProductInfoFormProps> = ({
  product,
  onProductChange,
  images,
  onImagesChange,
  setActiveTab
}) => {
  const handleInputChange = (field: keyof ProductData, value: string) => {
    onProductChange({ ...product, [field]: value });
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      <ImageUpload images={images} onImagesChange={onImagesChange} />

      <div className="col-span-7">
        <div className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Price</label>
            <Input
              value={product.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="₦4,500.00"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Product name</label>
            <Input
              value={product.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Name of Product"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Product type</label>
            <Input
              value={product.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Clothing"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Product description</label>
            <Textarea
              value={product.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[120px]"
              placeholder="Product description..."
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Sizes available</label>
            <Input
              value={product.sizes}
              onChange={(e) => handleInputChange('sizes', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="S, M, L, XL"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Release date</label>
            <Input
              value={product.releaseDate}
              onChange={(e) => handleInputChange('releaseDate', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              type="date"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Supply text</label>
            <Input
              value={product.supplyText}
              onChange={(e) => handleInputChange('supplyText', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Limited supply"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Supply count</label>
            <Input
              value={product.supplyCount}
              onChange={(e) => handleInputChange('supplyCount', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="40"
              type="number"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Show limited edition badge?</label>
            <Input
              value={product.badge}
              onChange={(e) => handleInputChange('badge', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Show badge"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Release duration text</label>
            <Input
              value={product.durationText}
              onChange={(e) => handleInputChange('durationText', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Limited time"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Release duration time</label>
            <Input
              value={product.durationTime}
              onChange={(e) => handleInputChange('durationTime', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="30 Days, 20 Hours"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Material/Composition</label>
            <Input
              value={product.material}
              onChange={(e) => handleInputChange('material', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Cotton, Polyester"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Colour options</label>
            <Input
              value={product.colors}
              onChange={(e) => handleInputChange('colors', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Yellow, Black, Magenta"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Target audience</label>
            <Input
              value={product.audience}
              onChange={(e) => handleInputChange('audience', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Unisex"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Shipping options</label>
            <Input
              value={product.shipping}
              onChange={(e) => handleInputChange('shipping', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="Domestic and international shipping"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Estimated shipping time</label>
            <Input
              value={product.shippingEstimate}
              onChange={(e) => handleInputChange('shippingEstimate', e.target.value)}
              className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              placeholder="2 Days within country, 10 Days international"
            />
          </div>
        </div>
        <div className="flex justify-end mt-8 space-x-4">

          <Button
            onClick={() => setActiveTab("Additional Information")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
  };

export default ProductInfoForm;