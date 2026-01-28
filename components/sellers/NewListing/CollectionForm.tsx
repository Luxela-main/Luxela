"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, Upload } from "lucide-react";
import helper from "@/helper";

export interface CollectionItem {
  title: string;
  priceCents: number;
  currency: string;
  productId?: string;
  image?: string;
  imagesJson?: string;
  images?: (File | string)[];
  sizes?: string[];
  colors?: string[];
}

interface CollectionFormProps {
  title: string;
  description: string;
  items: CollectionItem[];
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onItemsChange: (items: CollectionItem[]) => void;
  onSubmit: () => void;
  onNext?: () => void;
  isSubmitting: boolean;
}

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];
const AVAILABLE_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#00AA00" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Gray", hex: "#808080" },
];

const CollectionForm: React.FC<CollectionFormProps> = ({
  title,
  description,
  items,
  onTitleChange,
  onDescriptionChange,
  onItemsChange,
  onSubmit,
  onNext,
  isSubmitting = false,
}) => {
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  const addItem = () => {
    onItemsChange([
      ...items,
      {
        title: "",
        priceCents: 0,
        currency: "NGN",
        images: [],
        sizes: [],
        colors: [],
      },
    ]);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof CollectionItem,
    value: string | number | string[] | File[] | (string | File)[]
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onItemsChange(updated);
  };

  const handleImageUpload = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    const item = items[index];
    const currentImages = item.images || [];
    const updatedImages = [...currentImages, ...files].slice(0, 4);
    updateItem(index, "images", updatedImages);
  };

  const removeImage = (itemIndex: number, imageIndex: number) => {
    const item = items[itemIndex];
    const updatedImages = (item.images || []).filter(
      (_, i) => i !== imageIndex
    );
    updateItem(itemIndex, "images", updatedImages);
  };

  const getImagePreview = (file: File | string) => {
    if (typeof file === 'string') {
      return file; // Already a URL
    }
    return URL.createObjectURL(file); // Convert File to object URL
  };

  const toggleSize = (index: number, size: string) => {
    const item = items[index];
    const currentSizes = item.sizes || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size];
    updateItem(index, "sizes", newSizes);
  };

  const toggleColor = (index: number, colorName: string) => {
    const item = items[index];
    const currentColors = item.colors || [];
    const newColors = currentColors.includes(colorName)
      ? currentColors.filter((c) => c !== colorName)
      : [...currentColors, colorName];
    updateItem(index, "colors", newColors);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333]">
      <h2 className="text-lg font-semibold mb-6">Collection Information</h2>

      <div className="space-y-6">
        {/* Collection Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Collection Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Summer Collection 2024"
            className="w-full bg-[#0a0a0a] border placeholder:text-sm border-[#333] rounded-md px-4 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your collection..."
            rows={4}
            className="w-full bg-[#0a0a0a] border placeholder:text-sm border-[#333] rounded-md px-4 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Items Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium">
              Items <span className="text-red-500">*</span>
            </label>
            <Button
              onClick={addItem}
              type="button"
              className="bg-purple-600 hover:bg-purple-700 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#333] rounded-lg">
              <p className="text-gray-400">No items added yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Click "Add Item" to start building your collection
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-[#0a0a0a] border border-[#333] rounded-lg overflow-hidden">
                  {/* Item Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a1a] transition"
                    onClick={() =>
                      setExpandedItemId(
                        expandedItemId === index ? null : index
                      )
                    }
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <h3 className="text-sm font-medium">
                        {item.title || `Item ${index + 1}`}
                      </h3>
                      {item.title && (
                        <span className="text-xs text-gray-400">
                          {helper.toCurrency((item.priceCents || 0) / 100)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Item Expanded Content */}
                  {expandedItemId === index && (
                    <div className="border-t border-[#333] p-4 space-y-4">
                      {/* Item Name */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">
                          Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            updateItem(index, "title", e.target.value)
                          }
                          placeholder="e.g., White T-Shirt"
                          className="w-full placeholder:text-sm bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Price */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">
                            Price (in cents)
                          </label>
                          <input
                            type="number"
                            value={item.priceCents || ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "priceCents",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="e.g., 5000"
                            className="w-full bg-[#1a1a1a] placeholder:text-sm border border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {helper.toCurrency(
                              (item.priceCents || 0) / 100
                            )}
                          </p>
                        </div>

                        {/* Currency */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">
                            Currency
                          </label>
                          <select
                            value={item.currency}
                            onChange={(e) =>
                              updateItem(index, "currency", e.target.value)
                            }
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                          >
                            <option value="NGN">NGN</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">
                          Item Images (Max 4)
                        </label>
                        <div className="grid grid-cols-4 gap-3 mb-3">
                          {[0, 1, 2, 3].map((imageIndex) => (
                            <div
                              key={imageIndex}
                              className="relative aspect-square border-2 border-dashed border-[#333] rounded-lg overflow-hidden group"
                            >
                              {item.images && item.images[imageIndex] ? (
                                <>
                                  <img
                                    src={getImagePreview(
                                      item.images[imageIndex]
                                    )}
                                    alt={`Item ${imageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() =>
                                      removeImage(index, imageIndex)
                                    }
                                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a1a1a] transition">
                                  <Upload className="h-4 w-4 text-gray-400 mb-1" />
                                  <span className="text-xs text-gray-400 text-center px-1">
                                    Click to upload
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const currentImages =
                                          item.images || [];
                                        const updatedImages = [
                                          ...currentImages,
                                          file,
                                        ].slice(0, 4);
                                        updateItem(
                                          index,
                                          "images",
                                          updatedImages
                                        );
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sizes Selector */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">
                          Available Sizes
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_SIZES.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleSize(index, size)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                                item.sizes?.includes(size)
                                  ? "bg-purple-600 text-white"
                                  : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-purple-500"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Colors Selector */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">
                          Available Colors
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_COLORS.map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => toggleColor(index, color.name)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-2 ${
                                item.colors?.includes(color.name)
                                  ? "bg-purple-600 text-white"
                                  : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-purple-500"
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-current"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-[#333]">
          <Button
            onClick={onSubmit}
            disabled={!title || items.length === 0 || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating Collection..." : "Create Collection"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollectionForm;