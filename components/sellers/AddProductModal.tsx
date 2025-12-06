"use client"

import React, { useState } from "react"
import { X, Upload, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateSingleListing } from "@/modules/sellers"
import { toastSvc } from "@/services/toast"

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CATEGORIES = [
  { value: "men_clothing", label: "Men's Clothing" },
  { value: "women_clothing", label: "Women's Clothing" },
  { value: "men_shoes", label: "Men's Shoes" },
  { value: "women_shoes", label: "Women's Shoes" },
  { value: "accessories", label: "Accessories" },
  { value: "merch", label: "Merchandise" },
  { value: "others", label: "Others" },
]

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"]

const SHIPPING_OPTIONS = [
  { value: "local", label: "Local Only" },
  { value: "international", label: "International Only" },
  { value: "both", label: "Both" },
]

const SHIPPING_ETA = [
  { value: "48hrs", label: "48 Hours" },
  { value: "72hrs", label: "72 Hours" },
  { value: "5_working_days", label: "5 Working Days" },
  { value: "1week", label: "1 Week" },
]

const TARGET_AUDIENCE = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unisex", label: "Unisex" },
]

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createListing = useCreateSingleListing()

  const [formData, setFormData] = useState({
    title: "",
    category: "men_clothing" as any,
    priceCents: "",
    currency: "NGN",
    description: "",
    image: "",
    sizes: [] as string[],
    supplyCapacity: "no_max" as "no_max" | "limited",
    quantityAvailable: "",
    limitedEditionBadge: "do_not_show" as "show_badge" | "do_not_show",
    releaseDuration: "",
    materialComposition: "",
    colorsAvailable: "",
    additionalTargetAudience: "" as any,
    shippingOption: "" as any,
    etaDomestic: "" as any,
    etaInternational: "" as any,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.priceCents) newErrors.priceCents = "Price is required"
    if (!formData.description.trim())
      newErrors.description = "Description is required"
    if (!formData.image.trim()) newErrors.image = "Image URL is required"
    if (formData.sizes.length === 0) newErrors.sizes = "Select at least one size"
    if (!formData.releaseDuration.trim())
      newErrors.releaseDuration = "Release duration is required"
    
    if (formData.supplyCapacity === "limited" && !formData.quantityAvailable) {
      newErrors.quantityAvailable = "Quantity is required for limited supply"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toastSvc.error("Please fill all required fields")
      return
    }

    try {
      const priceCents = Math.round(parseFloat(formData.priceCents) * 100)

      const payload: any = {
        title: formData.title,
        category: formData.category,
        priceCents,
        currency: formData.currency,
        description: formData.description,
        image: formData.image,
        sizes: formData.sizes,
        supplyCapacity: formData.supplyCapacity,
        limitedEditionBadge: formData.limitedEditionBadge,
        releaseDuration: formData.releaseDuration,
      }

      if (formData.supplyCapacity === "limited" && formData.quantityAvailable) {
        payload.quantityAvailable = parseInt(formData.quantityAvailable)
      }
      if (formData.materialComposition) {
        payload.materialComposition = formData.materialComposition
      }
      if (formData.colorsAvailable) {
        payload.colorsAvailable = formData.colorsAvailable.split(",").map((c) => c.trim())
      }
      if (formData.additionalTargetAudience) {
        payload.additionalTargetAudience = formData.additionalTargetAudience
      }
      if (formData.shippingOption) {
        payload.shippingOption = formData.shippingOption
      }
      if (formData.etaDomestic) {
        payload.etaDomestic = formData.etaDomestic
      }
      if (formData.etaInternational) {
        payload.etaInternational = formData.etaInternational
      }

      await createListing.mutateAsync(payload)
      
       setFormData({
        title: "",
        category: "men_clothing",
        priceCents: "",
        currency: "NGN",
        description: "",
        image: "",
        sizes: [],
        supplyCapacity: "no_max",
        quantityAvailable: "",
        limitedEditionBadge: "do_not_show",
        releaseDuration: "",
        materialComposition: "",
        colorsAvailable: "",
        additionalTargetAudience: "",
        shippingOption: "",
        etaDomestic: "",
        etaInternational: "",
      })
      
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error("Failed to create product:", error)
    }
  }

  if (!isOpen) return null

  const ErrorMessage = ({ message }: { message?: string }) => {
    return message ? (
      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="w-3 h-3" />
        <span>{message}</span>
      </div>
    ) : null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#0f0f0f] rounded-lg border border-[#333] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <h2 className="text-2xl font-semibold">Add New Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 ${
                      errors.title ? "border-red-500" : ""
                    }`}
                    placeholder="Enter product name"
                  />
                  <ErrorMessage message={errors.title} />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Price (NGN) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.priceCents}
                    onChange={(e) => handleChange("priceCents", e.target.value)}
                    className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 ${
                      errors.priceCents ? "border-red-500" : ""
                    }`}
                    placeholder="4500.00"
                  />
                  <ErrorMessage message={errors.priceCents} />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.image}
                    onChange={(e) => handleChange("image", e.target.value)}
                    className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 ${
                      errors.image ? "border-red-500" : ""
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                  <ErrorMessage message={errors.image} />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm mb-2 font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 min-h-[100px] ${
                    errors.description ? "border-red-500" : ""
                  }`}
                  placeholder="Product description..."
                />
                <ErrorMessage message={errors.description} />
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">
                Product Details
              </h3>
              
              <div>
                <label className="block text-sm mb-2 font-medium">
                  Sizes Available <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 rounded-md border transition ${
                        formData.sizes.includes(size)
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "bg-[#0f0f0f] border-[#333] text-gray-400 hover:border-purple-600"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <ErrorMessage message={errors.sizes} />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Colors (comma-separated)
                  </label>
                  <Input
                    value={formData.colorsAvailable}
                    onChange={(e) => handleChange("colorsAvailable", e.target.value)}
                    className="bg-[#0f0f0f] border-[#333] focus:border-purple-600"
                    placeholder="Red, Blue, Black"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Material Composition
                  </label>
                  <Input
                    value={formData.materialComposition}
                    onChange={(e) => handleChange("materialComposition", e.target.value)}
                    className="bg-[#0f0f0f] border-[#333] focus:border-purple-600"
                    placeholder="100% Cotton"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Target Audience
                  </label>
                  <select
                    value={formData.additionalTargetAudience}
                    onChange={(e) => handleChange("additionalTargetAudience", e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {TARGET_AUDIENCE.map((aud) => (
                      <option key={aud.value} value={aud.value}>
                        {aud.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">
                Inventory & Availability
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Supply Capacity
                  </label>
                  <select
                    value={formData.supplyCapacity}
                    onChange={(e) => handleChange("supplyCapacity", e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:outline-none"
                  >
                    <option value="no_max">Unlimited Supply</option>
                    <option value="limited">Limited Supply</option>
                  </select>
                </div>

                {formData.supplyCapacity === "limited" && (
                  <div>
                    <label className="block text-sm mb-2 font-medium">
                      Quantity Available <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={formData.quantityAvailable}
                      onChange={(e) => handleChange("quantityAvailable", e.target.value)}
                      className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 ${
                        errors.quantityAvailable ? "border-red-500" : ""
                      }`}
                      placeholder="100"
                    />
                    <ErrorMessage message={errors.quantityAvailable} />
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Release Duration <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.releaseDuration}
                    onChange={(e) => handleChange("releaseDuration", e.target.value)}
                    className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 ${
                      errors.releaseDuration ? "border-red-500" : ""
                    }`}
                    placeholder="30 days"
                  />
                  <ErrorMessage message={errors.releaseDuration} />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Limited Edition Badge
                  </label>
                  <select
                    value={formData.limitedEditionBadge}
                    onChange={(e) => handleChange("limitedEditionBadge", e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:outline-none"
                  >
                    <option value="do_not_show">Don't Show Badge</option>
                    <option value="show_badge">Show Badge</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">
                Shipping Information
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Shipping Option
                  </label>
                  <select
                    value={formData.shippingOption}
                    onChange={(e) => handleChange("shippingOption", e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {SHIPPING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    ETA (Domestic)
                  </label>
                  <select
                    value={formData.etaDomestic}
                    onChange={(e) => handleChange("etaDomestic", e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {SHIPPING_ETA.map((eta) => (
                      <option key={eta.value} value={eta.value}>
                        {eta.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    ETA (International)
                  </label>
                  <select
                    value={formData.etaInternational}
                    onChange={(e) => handleChange("etaInternational", e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {SHIPPING_ETA.map((eta) => (
                      <option key={eta.value} value={eta.value}>
                        {eta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-[#333]">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-[#333] bg-transparent hover:bg-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createListing.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createListing.isPending ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
