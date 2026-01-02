"use client";

import React, { useState } from "react";
import { Tab, ListingForm, ProductData, CollectionItem } from "@/types";
import { TabsNav } from "./TabsNav";
import ProductInfoForm from "./ProductInfoForm";
import AdditionalInfoForm from "./AdditionalInfoForm";
import Preview from "./Preview";
import CollectionForm from "./CollectionForm";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { useRouter } from "next/navigation";
import helper from "@/helper";

const NewListing: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Product Information");
  const [formData, setFormData] = useState<ListingForm>({
    listingType: "single",
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
    collectionTitle: "",
    collectionDescription: "",
    collectionItems: [],
  });

  const [isProductInfoValid, setIsProductInfoValid] = useState(false);
  const [isAdditionalInfoValid, setIsAdditionalInfoValid] = useState(false);

  const createSingleMutation = (trpc.listing as any).createSingle.useMutation({
    onSuccess: () => {
      toastSvc.success("Single listing created successfully!");
      setTimeout(() => {
        router.push("/sellers/my-listings");
      }, 1500);
    },
    onError: (error: any) => {
      try {
        const errorData = JSON.parse(error.message);
        if (Array.isArray(errorData)) {
          errorData.forEach((err: any) => {
            const fieldName = err.path?.[0] || 'Field';
            toastSvc.error(`${fieldName}: ${err.message}`);
          });
        } else {
          toastSvc.error(error.message || "Failed to create listing");
        }
      } catch {
        toastSvc.error(error.message || "Failed to create listing");
      }
    },
  });

  const createCollectionMutation = (trpc.listing as any).createCollection.useMutation({
    onSuccess: () => {
      toastSvc.success("Collection created successfully!");
      setTimeout(() => {
        router.push("/sellers/my-listings");
      }, 1500);
    },
    onError: (error: any) => {
      try {
        const errorData = JSON.parse(error.message);
        if (Array.isArray(errorData)) {
          errorData.forEach((err: any) => {
            const fieldName = err.path?.[0] || 'Field';
            toastSvc.error(`${fieldName}: ${err.message}`);
          });
        } else {
          toastSvc.error(error.message || "Failed to create collection");
        }
      } catch {
        toastSvc.error(error.message || "Failed to create collection");
      }
    },
  });

  const handleProductChange = (product: ProductData) => {
    setFormData((prev) => ({ ...prev, product }));
  };

  const handleImagesChange = (images: File[]) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const handleSubmit = async () => {
    try {
      if (formData.listingType === "single") {
        // Map enums and format fields to match backend
        const allowedCategories = [
          "men_clothing", "women_clothing", "men_shoes", "women_shoes", "accessories", "merch", "others"
        ];
        const allowedReleaseDurations = [
          "24hrs", "48hrs", "72hrs", "1week", "2weeks", "1month"
        ];
        const allowedSupplyCapacities = ["no_max", "limited"];
        const allowedBadges = ["show_badge", "do_not_show"];
        const allowedShippingOptions = ["local", "international", "both"];
        const allowedAudiences = ["male", "female", "unisex"];

        // Map category
        let category = formData.product.type;
        if (!allowedCategories.includes(category)) category = "others";

        // Map releaseDuration
        let releaseDuration = formData.product.durationTime || "";
        if (!allowedReleaseDurations.includes(releaseDuration)) releaseDuration = "1week";

        // Map supplyCapacity
        let supplyCapacity = formData.product.supplyText?.toLowerCase().includes("limit") ? "limited" : "no_max";
        if (!allowedSupplyCapacities.includes(supplyCapacity)) supplyCapacity = "no_max";

        // Map limitedEditionBadge
        let limitedEditionBadge = formData.product.badge?.toLowerCase().includes("show") ? "show_badge" : "do_not_show";
        if (!allowedBadges.includes(limitedEditionBadge)) limitedEditionBadge = "do_not_show";

        // Map shippingOption
        let shippingOption = formData.product.shippingOption || "local";
        if (!allowedShippingOptions.includes(shippingOption)) shippingOption = "local";

        // Map additionalTargetAudience
        let additionalTargetAudience = formData.product.targetAudience || "unisex";
        if (!allowedAudiences.includes(additionalTargetAudience)) additionalTargetAudience = "unisex";

        // Map colorsAvailable to array of objects
        let colorsAvailable = (formData.product.colorsAvailable || formData.product.colors)
          ? (formData.product.colorsAvailable || formData.product.colors).split(",").map((c: string) => ({ colorName: c.trim(), colorHex: "" }))
          : undefined;

        // Map sizes
        let sizes = formData.product.sizes
          ? formData.product.sizes.split(",").map((s: string) => s.trim().toUpperCase())
          : undefined;

        await createSingleMutation.mutateAsync({
          title: formData.product.name,
          description: formData.product.description,
          category,
          priceCents: Math.round(parseFloat(formData.product.price) * 100),
          currency: "NGN",
          image: formData.images.length > 0 
            ? "https://via.placeholder.com/400" 
            : "https://via.placeholder.com/400",
          sizes,
          supplyCapacity,
          quantityAvailable: formData.product.supplyCount ? parseInt(formData.product.supplyCount) : undefined,
          limitedEditionBadge,
          releaseDuration,
          materialComposition: formData.product.materialComposition || formData.product.material,
          colorsAvailable,
          additionalTargetAudience,
          shippingOption,
          etaDomestic: helper.mapDaysToEtaEnum(formData.product.domesticDays, formData.product.domesticMinutes),
          etaInternational: helper.mapDaysToEtaEnum(formData.product.internationalDays, formData.product.internationalMinutes),
        });
      } else {
        // Collection
        await createCollectionMutation.mutateAsync({
          title: formData.collectionTitle || "",
          description: formData.collectionDescription,
          items: formData.collectionItems || [],
        });
      }

      setTimeout(() => {
        router.push("/sellers/my-listings");
      }, 1500);
    } catch (error) {
      console.error("Error creating listing:", error);
    }
  };

  const handleReset = () => {
    setActiveTab("Product Information");
    setFormData({
      listingType: "single",
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
      collectionTitle: "",
      collectionDescription: "",
      collectionItems: [],
    });
  };

  return (
    <div className="p-6 pt-16 lg:pt-0">
      <div className="flex items-center mb-2">
        <h1 className="text-2xl font-semibold">New Listing</h1>
      </div>
      <p className="text-gray-400 mb-6">
        List product and fill in your listing details
      </p>

      <div className="mb-6 bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
        <label className="block text-sm font-medium mb-3">Listing Type</label>
        <div className="flex space-x-4">
          <button
            onClick={() => setFormData(prev => ({ ...prev, listingType: "single" }))}
            className={`px-6 py-3 rounded-md transition ${
              formData.listingType === "single"
                ? "bg-purple-600 text-white"
                : "bg-[#0a0a0a] border border-[#333] text-gray-400 hover:text-white"
            }`}
          >
            Single Product
          </button>
          <button
            onClick={() => setFormData(prev => ({ ...prev, listingType: "collection" }))}
            className={`px-6 py-3 rounded-md transition ${
              formData.listingType === "collection"
                ? "bg-purple-600 text-white"
                : "bg-[#0a0a0a] border border-[#333] text-gray-400 hover:text-white"
            }`}
          >
            Collection
          </button>
        </div>
      </div>

      {formData.listingType === "single" ? (
        <>
          <TabsNav 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            isProductInfoValid={isProductInfoValid}
            isAdditionalInfoValid={isAdditionalInfoValid}
          />

          {activeTab === "Product Information" && (
            <ProductInfoForm
              product={formData.product}
              onProductChange={handleProductChange}
              images={formData.images}
              onImagesChange={handleImagesChange}
              setActiveTab={setActiveTab}
              onValidationChange={setIsProductInfoValid}
            />
          )}

          {activeTab === "Additional Information" && (
            <AdditionalInfoForm
              product={formData.product}
              onProductChange={handleProductChange}
              images={formData.images}
              onImagesChange={handleImagesChange}
              setActiveTab={setActiveTab}
              onValidationChange={setIsAdditionalInfoValid}
            />
          )}

          {activeTab === "Preview" && (
            <Preview
              formData={formData}
              handleReset={handleReset}
              handleSubmit={handleSubmit}
              isSubmitting={createSingleMutation.isPending}
            />
          )}
        </>
      ) : (
        <CollectionForm
          title={formData.collectionTitle || ""}
          description={formData.collectionDescription || ""}
          items={formData.collectionItems || []}
          onTitleChange={(title) => setFormData(prev => ({ ...prev, collectionTitle: title }))}
          onDescriptionChange={(desc) => setFormData(prev => ({ ...prev, collectionDescription: desc }))}
          onItemsChange={(items) => setFormData(prev => ({ ...prev, collectionItems: items }))}
          onNext={handleSubmit}
          isSubmitting={createCollectionMutation.isPending}
        />
      )}
    </div>
  );
};

export default NewListing;

