"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import helper from "@/helper";

interface CollectionItem {
  title: string;
  priceCents: number;
  currency: string;
}

interface CollectionFormProps {
  title: string;
  description: string;
  items: CollectionItem[];
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onItemsChange: (items: CollectionItem[]) => void;
  onNext: () => void;
  isSubmitting?: boolean;
}

const CollectionForm: React.FC<CollectionFormProps> = ({
  title,
  description,
  items,
  onTitleChange,
  onDescriptionChange,
  onItemsChange,
  onNext,
  isSubmitting = false,
}) => {
  const addItem = () => {
    onItemsChange([
      ...items,
      { title: "", priceCents: 0, currency: "NGN" },
    ]);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof CollectionItem,
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onItemsChange(updated);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333]">
      <h2 className="text-xl font-semibold mb-6">Collection Information</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Collection Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Summer Collection 2024"
            className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your collection..."
            rows={4}
            className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium">
              Items <span className="text-red-500">*</span>
            </label>
            <Button
              onClick={addItem}
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
                <div
                  key={index}
                  className="bg-[#0a0a0a] border border-[#333] rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-medium">Item {index + 1}</h3>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          updateItem(index, "title", e.target.value)
                        }
                        placeholder="e.g., White T-Shirt"
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
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
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {helper.toCurrency((item.priceCents || 0) / 100)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onNext}
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
