// ProductInfoForm.tsx
import React from "react";
import { FormData } from "@/types/newListing";
import ImageUpload from "@/app/sellers/new-listing/image-upload";
import { Button } from "@/components/ui/button";

interface ProductInfoFormProps {
  formData: FormData;
  onFormChange: (data: Partial<FormData>) => void;
  onNext: () => void;
  onCancel: () => void;
  images: File[];
  onImagesChange: (images: File[]) => void;
  videos: File[];
  onVideosChange: (videos: File[]) => void;
}

const ProductInfoForm: React.FC<ProductInfoFormProps> = ({
  formData,
  onFormChange,
  onNext,
  onCancel,
  images,
  onImagesChange,
  videos,
  onVideosChange,
}) => {
  const sizes = ["S", "M", "L", "XL", "XXL", "XXXL"];

  const toggleSize = (size: string): void => {
    const currentSizes = formData.sizes || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size];
    onFormChange({ sizes: newSizes });
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    onFormChange({ [field]: value });
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column - Image Upload */}
      <div className="col-span-12 lg:col-span-5">
        <ImageUpload images={images} onImagesChange={onImagesChange} videos={videos} onVideosChange={onVideosChange} />
      </div>

      {/* Right Column - Form Fields */}
      <div className="col-span-12 lg:col-span-7 space-y-6 text-sm">
        {/* Product Name */}
        <div>
          <label className="block text-sm mb-2">Product name</label>
          <input
            type="text"
            placeholder="Give your product a name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm mb-2">Price</label>
          <div className="flex gap-3">
            <select className="bg-[#1a1a1a] text-xs border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white cursor-pointer hover:border-purple-500 transition">
              <option>NGN</option>
            </select>
            <input
              type="text"
              placeholder="Enter product price"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
            />
          </div>
        </div>

        {/* Product Category */}
        <div>
          <label className="block text-sm mb-2">Product category</label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white cursor-pointer hover:border-purple-500 transition"
          >
            <option value="">
              Select a category that best suits this product
            </option>
            <option value="men_clothing">Men's Clothing</option>
            <option value="women_clothing">Women's Clothing</option>
            <option value="men_shoes">Men's Shoes</option>
            <option value="women_shoes">Women's Shoes</option>
            <option value="accessories">Accessories</option>
            <option value="merch">Merchandise</option>
            <option value="others">Others</option>
          </select>
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm mb-2">Product description</label>
          <textarea
            placeholder="Describe your product"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={4}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 resize-none text-white"
          />
        </div>

        {/* Sizes Available */}
        <div>
          <label className="block text-sm mb-3">Sizes available</label>
          <div className="flex gap-3">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-6 py-2 rounded-lg border transition cursor-pointer hover:border-purple-500 ${
                  formData.sizes?.includes(size)
                    ? "bg-purple-600 border-[#333] text-white"
                    : "bg-transparent border-[#333] text-gray-500"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Release Date */}
        <div>
          <label className="block text-sm mb-2">Release date</label>
          <div className="relative">
            <input
              type="date"
              placeholder="DD-MM-YY"
              value={formData.releaseDate}
              onChange={(e) => handleInputChange("releaseDate", e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-purple-600 text-white"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Supply Capacity */}
        <div>
          <label className="block text-sm mb-3">Supply capacity</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onFormChange({ supplyCapacity: "no-max" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-purple-500 ${
                formData.supplyCapacity === "no-max"
                  ? "bg-[#1a1a1a] border-purple-600"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.supplyCapacity === "no-max"
                      ? "border-purple-600"
                      : "border-[#333]"
                  }`}
                >
                  {formData.supplyCapacity === "no-max" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                  )}
                </div>
                <span>No Max</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ supplyCapacity: "limited" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-purple-500 ${
                formData.supplyCapacity === "limited"
                  ? "bg-[#1a1a1a] border-purple-600"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.supplyCapacity === "limited"
                      ? "border-purple-600"
                      : "border-[#333]"
                  }`}
                >
                  {formData.supplyCapacity === "limited" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                  )}
                </div>
                <span>Limited supply</span>
              </div>
            </button>
          </div>
        </div>

        {/* Quantity Available */}
        <div>
          <label className="block text-sm mb-2">Quantity available</label>
          <input
            type="text"
            placeholder="00000000"
            value={formData.quantity}
            onChange={(e) => handleInputChange("quantity", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
          />
        </div>

        {/* Show Limited Edition Badge */}
        <div>
          <label className="block text-sm mb-3">
            Show limited edition badge?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onFormChange({ showBadge: "show_badge" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-purple-500 ${
                formData.showBadge === "show_badge"
                  ? "bg-[#1a1a1a] border-purple-600"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.showBadge === "show_badge"
                      ? "border-purple-600"
                      : "border-[#333]"
                  }`}
                >
                  {formData.showBadge === "show_badge" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                  )}
                </div>
                <span>Show badge</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ showBadge: "do_not_show" })}
              className={`flex-1 px-6 py-3 rounded-lg border transition cursor-pointer hover:border-purple-500 ${
                formData.showBadge === "do_not_show"
                  ? "bg-[#1a1a1a] border-purple-600"
                  : "bg-transparent border-[#333]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.showBadge === "do_not_show"
                      ? "border-purple-600"
                      : "border-[#333]"
                  }`}
                >
                  {formData.showBadge === "do_not_show" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                  )}
                </div>
                <span>Do not Show badge</span>
              </div>
            </button>
          </div>
        </div>

        {/* Release Duration - FIXED ENUM VALUES */}
        <div>
          <label className="block text-sm mb-2">Release duration</label>
          <select
            value={formData.releaseDuration}
            onChange={(e) =>
              handleInputChange("releaseDuration", e.target.value)
            }
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white cursor-pointer hover:border-purple-500 transition"
          >
            <option value="">How long would this product be available</option>
            <option value="24hrs">24 Hours</option>
            <option value="48hrs">48 Hours</option>
            <option value="72hrs">72 Hours</option>
            <option value="1week">1 Week</option>
            <option value="2weeks">2 Weeks</option>
            <option value="1month">1 Month</option>
          </select>
        </div>

        {/* Release Duration Time */}
        <div>
          <label className="block text-sm mb-2">Release duration</label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="00 Days"
              value={formData.releaseDurationDays}
              onChange={(e) =>
                handleInputChange("releaseDurationDays", e.target.value)
              }
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
            />
            <input
              type="text"
              placeholder="00 Minutes"
              value={formData.releaseDurationMinutes}
              onChange={(e) =>
                handleInputChange("releaseDurationMinutes", e.target.value)
              }
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 text-white"
            />
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
            className="px-8 py-3 rounded-lg transition cursor-pointer hover:shadow-lg"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfoForm;