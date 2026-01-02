// AdditionalInfoForm.tsx
import React, { useState } from "react";
import { FormData } from "@/types/newListing";
import ImageUpload from "@/app/sellers/new-listing/image-upload";
import ImagePreview from "@/app/sellers/new-listing/image-preview";

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
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
          />
        </div>

        {/* Colors Available */}
        <div>
          <label className="block text-sm mb-2">Colors available(Comma-Separated)</label>
          <input
            type="text"
            placeholder="Enter all product colours"
            value={formData.colors}
            onChange={(e) => handleInputChange("colors", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm mb-3">Target audience</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onFormChange({ targetAudience: "male" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition ${
                formData.targetAudience === "male"
                  ? "bg-purple-700 border-[#333] text-white"
                  : "bg-transparent border-[#333] text-gray-500"
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ targetAudience: "female" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition ${
                formData.targetAudience === "female"
                  ? "bg-purple-700 border-[#333] text-white"
                  : "bg-transparent border-[#333] text-gray-500"
              }`}
            >
              Female
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ targetAudience: "unisex" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition ${
                formData.targetAudience === "unisex"
                  ? "bg-purple-700 border-[#333] text-white"
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
              className={`flex-1 px-6 py-3 rounded-lg border transition ${
                formData.shippingOption === "local"
                  ? "bg-purple-700border-purple-600"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.shippingOption === "local"
                      ? "border-purple-600"
                      : "border-[#333]"
                  }`}
                >
                  {formData.shippingOption === "local" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                  )}
                </div>
                <span>Local</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ shippingOption: "international" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition ${
                formData.shippingOption === "international"
                  ? "bg-purple-700border-purple-600"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.shippingOption === "international"
                      ? "border-purple-600"
                      : "border-[#333]"
                  }`}
                >
                  {formData.shippingOption === "international" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                  )}
                </div>
                <span>International</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ shippingOption: "both" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition ${
                formData.shippingOption === "both"
                  ? "bg-purple-700border-purple-600"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.shippingOption === "both"
                      ? "border-purple-600"
                      : "border-[#333]"
                  }`}
                >
                  {formData.shippingOption === "both" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
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
    onChange={(e) => handleInputChange("domesticDays", e.target.value)}
    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
  >
    <option value="">Select delivery time</option>
    <option value="48hrs">48 Hours</option>
    <option value="72hrs">72 Hours</option>
    <option value="5_working_days">5 Working Days</option>
    <option value="1week">1 Week</option>
  </select>
</div>

{/* International */}
<div>
  <label className="block text-sm text-gray-400 mb-2">
    International
  </label>
  <select
    value={formData.internationalDays}
    onChange={(e) => handleInputChange("internationalDays", e.target.value)}
    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
  >
    <option value="">Select delivery time</option>
    <option value="48hrs">48 Hours</option>
    <option value="72hrs">72 Hours</option>
    <option value="5_working_days">5 Working Days</option>
    <option value="1week">1 Week</option>
  </select>
</div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-[#333] rounded-lg hover:border-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoForm;
