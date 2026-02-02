// AdditionalInfoForm.tsx
import React, { useState } from "react";
import { FormData } from "@/types/newListing";
import ImageUpload from "@/app/sellers/new-listing/image-upload";
import ImagePreview from "@/app/sellers/new-listing/image-preview";
import { Button } from "@/components/ui/button";

const AVAILABLE_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Crimson", hex: "#DC143C" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Royal Blue", hex: "#4169E1" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Green", hex: "#00AA00" },
  { name: "Dark Green", hex: "#006400" },
  { name: "Olive", hex: "#808000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Dark Orange", hex: "#FF8C00" },
  { name: "Purple", hex: "#800080" },
  { name: "Violet", hex: "#EE82EE" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Hot Pink", hex: "#FF69B4" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Gray", hex: "#808080" },
  { name: "Light Gray", hex: "#D3D3D3" },
  { name: "Beige", hex: "#F5F5DC" },
];

interface AdditionalInfoFormProps {
  formData: FormData;
  onFormChange: (data: Partial<FormData>) => void;
  images: File[];
  onImagesChange: (images: File[]) => void;
  onNext: () => void;
  onCancel: () => void;
}

const AdditionalInfoForm: React.FC<AdditionalInfoFormProps> = ({
  formData,
  onFormChange,
  images,
  onImagesChange,
  onNext,
  onCancel,
}) => {
  const handleInputChange = (field: keyof FormData, value: string): void => {
    onFormChange({ [field]: value });
  };

  const [imagesp, setImagesp] = useState<File[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const handleRemovePreviewImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImagesp(newImages);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column - Image Upload (Same as Product Info) */}
      <div className="col-span-12 lg:col-span-5 max-md:mb-4">
        <ImagePreview images={formData.images} />
      </div>

      {/* Right Column - Additional Info Fields */}
      <div className="col-span-12 lg:col-span-7 text-sm space-y-6">
        {/* Material/Composition */}
        <div>
          <label className="block text-sm mb-2">Material/Composition</label>
          <input
            type="text"
            placeholder="What material is your product made from"
            value={formData.material}
            onChange={(e) => handleInputChange("material", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] text-white"
          />
        </div>

        {/* Colors Available */}
        <div>
          <label className="block text-sm mb-3">
            Available Colors
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_COLORS.map((color) => {
              const selectedColors = formData.colors 
                ? formData.colors.split(",").map(c => c.trim()).filter(c => c)
                : [];
              const isSelected = selectedColors.includes(color.name);
              
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => {
                    const currentColors = formData.colors
                      ? formData.colors.split(",").map(c => c.trim()).filter(c => c)
                      : [];
                    
                    let newColors;
                    if (isSelected) {
                      newColors = currentColors.filter(c => c !== color.name);
                    } else {
                      newColors = [...currentColors, color.name];
                    }
                    
                    handleInputChange("colors", newColors.join(", "));
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#8451E1] text-white"
                      : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#8451E1]"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-current"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                </button>
              );
            })}
          </div>
          {formData.colors && (
            <div className="mt-3 p-2 bg-[#1a1a1a] border border-[#333] rounded text-xs text-gray-400">
              Selected: <span className="text-[#8451E1]">{formData.colors}</span>
            </div>
          )}
        </div>

        {/* SKU & Barcode */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">SKU (Product Code)</label>
            <input
              type="text"
              placeholder="e.g., LUX-WS-001"
              value={formData.sku}
              onChange={(e) => handleInputChange("sku", e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] text-white"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Barcode</label>
            <input
              type="text"
              placeholder="e.g., 123456789"
              value={formData.barcode}
              onChange={(e) => handleInputChange("barcode", e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] text-white"
            />
          </div>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm mb-2">Product URL Slug</label>
          <input
            type="text"
            placeholder="e.g., luxury-designer-shirt"
            value={formData.slug}
            onChange={(e) => handleInputChange("slug", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] text-white"
          />
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm mb-2">Meta Description (SEO)</label>
          <textarea
            placeholder="Brief description for search engines (max 160 characters)"
            value={formData.metaDescription}
            onChange={(e) => handleInputChange("metaDescription", e.target.value.slice(0, 160))}
            rows={2}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] resize-none text-white"
            maxLength={160}
          />
          <p className="text-xs text-gray-400 mt-1">{formData.metaDescription?.length || 0}/160</p>
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm mb-2">Product Video URL (Optional)</label>
          <input
            type="url"
            placeholder="e.g., https://youtube.com/watch?v=..."
            value={formData.videoUrl}
            onChange={(e) => handleInputChange("videoUrl", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] text-white"
          />
        </div>

        {/* Care Instructions */}
        <div>
          <label className="block text-sm mb-2">Care Instructions</label>
          <textarea
            placeholder="e.g., Hand wash cold water, Do not bleach, Iron on low heat"
            value={formData.careInstructions}
            onChange={(e) => handleInputChange("careInstructions", e.target.value)}
            rows={3}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] resize-none text-white"
          />
        </div>

        {/* Refund Policy */}
        <div>
          <label className="block text-sm mb-3">Refund Policy</label>
          <select
            value={formData.refundPolicy}
            onChange={(e) => handleInputChange("refundPolicy", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] text-white cursor-pointer hover:border-[#8451E1] transition"
          >
            <option value="">Select a refund policy</option>
            <option value="no_refunds">No Refunds</option>
            <option value="48hrs">48 Hours</option>
            <option value="72hrs">72 Hours</option>
            <option value="5_working_days">5 Working Days</option>
            <option value="1week">1 Week</option>
            <option value="14days">14 Days</option>
            <option value="30days">30 Days</option>
            <option value="60days">60 Days</option>
            <option value="store_credit">Store Credit Only</option>
          </select>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm mb-3">Target audience</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onFormChange({ targetAudience: "male" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-[#8451E1] ${
                formData.targetAudience === "male"
                  ? "bg-[#8451E1] border-[#8451E1] text-white"
                  : "bg-transparent border-[#333] text-gray-500"
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ targetAudience: "female" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-[#8451E1] ${
                formData.targetAudience === "female"
                  ? "bg-[#8451E1] border-[#8451E1] text-white"
                  : "bg-transparent border-[#333] text-gray-500"
              }`}
            >
              Female
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ targetAudience: "unisex" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-[#8451E1] ${
                formData.targetAudience === "unisex"
                  ? "bg-[#8451E1] border-[#8451E1] text-white"
                  : "bg-transparent border-[#333] text-gray-500"
              }`}
            >
              Unisex
            </button>
          </div>
        </div>

        {/* Shipping Option */}
        <div>
          <label className="block text-sm mb-3">Shipping option</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onFormChange({ shippingOption: "local" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-[#8451E1] ${
                formData.shippingOption === "local"
                  ? "bg-[#8451E1] border-[#8451E1]"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.shippingOption === "local"
                      ? "border-[#8451E1]"
                      : "border-[#333]"
                  }`}
                >
                  {formData.shippingOption === "local" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#8451E1]"></div>
                  )}
                </div>
                <span>Local</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ shippingOption: "international" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-[#8451E1] ${
                formData.shippingOption === "international"
                  ? "bg-[#8451E1] border-[#8451E1]"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.shippingOption === "international"
                      ? "border-[#8451E1]"
                      : "border-[#333]"
                  }`}
                >
                  {formData.shippingOption === "international" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#8451E1]"></div>
                  )}
                </div>
                <span>International</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ shippingOption: "both" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-[#8451E1] ${
                formData.shippingOption === "both"
                  ? "bg-[#8451E1] border-[#8451E1]"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.shippingOption === "both"
                      ? "border-[#8451E1]"
                      : "border-[#333]"
                  }`}
                >
                  {formData.shippingOption === "both" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#8451E1]"></div>
                  )}
                </div>
                <span>Both</span>
              </div>
            </button>
          </div>
        </div>

        {/* Estimated Shipping Time */}
        <div>
          <label className="block text-sm font-medium mb-4">
            Estimated shipping time
          </label>

          {/* Within Country */}
          {/* Within country */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Within country
            </label>
            <select
              value={formData.domesticDays}
              onChange={(e) =>
                handleInputChange("domesticDays", e.target.value)
              }
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] text-white cursor-pointer hover:border-[#8451E1] transition"
            >
              <option value="">Select delivery time</option>
              <option value="same_day">Same Day</option>
              <option value="next_day">Next Day</option>
              <option value="48hrs">48 Hours</option>
              <option value="72hrs">72 Hours</option>
              <option value="5_working_days">5 Working Days</option>
              <option value="1_2_weeks">1-2 Weeks</option>
            </select>
          </div>

          {/* International */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              International
            </label>
            <select
              value={formData.internationalDays}
              onChange={(e) =>
                handleInputChange("internationalDays", e.target.value)
              }
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#8451E1] text-white cursor-pointer hover:border-[#8451E1] transition"
            >
              <option value="">Select delivery time</option>
              <option value="2_3_weeks">2-3 Weeks</option>
              <option value="1_2_weeks">1-2 Weeks</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <Button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 bg-transparent hover:bg-transparent border border-[#333] rounded-lg hover:border-gray-600 transition cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onNext}
            className="px-8 py-3 rounded-lg transition cursor-pointer bg-[#8451E1] hover:bg-[#7340D0] text-white"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoForm;