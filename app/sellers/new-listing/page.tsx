"use client";

import React, { useState } from "react";
import { Tab, ListingForm, ProductData } from "@/types";
import { TabsNav } from "./TabsNav";
import ProductInfoForm from "./ProductInfoForm";
import AdditionalInfoForm from "./AdditionalInfoForm";
import Preview from "./Preview";

const NewListing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("Product Information");
  const [formData, setFormData] = useState<ListingForm>({
    images: [],
    product: {
      price: "",
      name: "",
      type: "",
      description: "",
      sizes: "",
      releaseDate: "",
      supplyText: "",
      supplyCount: "",
      badge: "",
      durationText: "",
      durationTime: "",
      material: "",
      colors: "",
      audience: "",
      shipping: "",
      shippingEstimate: "",
    },
  });

  const handleProductChange = (product: ProductData) => {
    setFormData((prev) => ({ ...prev, product }));
  };

  const handleImagesChange = (images: File[]) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const handleSubmit = () => {
    console.log("Submitting form data:", formData);
    // API call
  };

  const handleReset = () => {
    setActiveTab("Product Information");
    setFormData({
      images: [],
      product: {
        price: "",
        name: "",
        type: "",
        description: "",
        sizes: "",
        releaseDate: "",
        supplyText: "",
        supplyCount: "",
        badge: "",
        durationText: "",
        durationTime: "",
        material: "",
        colors: "",
        audience: "",
        shipping: "",
        shippingEstimate: "",
      },
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-2">
        <h1 className="text-2xl font-semibold">New Listing</h1>
      </div>
      <p className="text-gray-400 mb-6">
        List product and fill in your listing details
      </p>

      <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "Product Information" && (
        <ProductInfoForm
          product={formData.product}
          onProductChange={handleProductChange}
          images={formData.images}
          onImagesChange={handleImagesChange}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "Additional Information" && (
        <AdditionalInfoForm
          product={formData.product}
          onProductChange={handleProductChange}
          images={formData.images}
          onImagesChange={handleImagesChange}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "Preview" && (
        <Preview
          formData={formData}
          handleReset={handleReset}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default NewListing;
