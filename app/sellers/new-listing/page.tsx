"use client";
import React, { useState } from "react";
import EmptyState from "@/components/sellers/NewListing/EmptyState";
import TabsNav from "@/components/sellers/NewListing/TabsNav";
import ProductInfoForm from "@/components/sellers/NewListing/ProductInfoForm";
import AdditionalInfoForm from "@/components/sellers/NewListing/AdditionalInfoForm";
import PreviewForm from "@/components/sellers/NewListing/PreviewForm";
import { FormData, ViewType, TabType, ListingType } from "@/types/newListing";
import { uploadImage, validateImageFile } from "@/lib/upload-image";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { useRouter } from "next/navigation";
// import helper from "@/helper";

const NewListing: React.FC = () => {
  const router = useRouter();

  const [view, setView] = useState<ViewType>("empty");
  const [activeTab, setActiveTab] = useState<TabType>("product-info");
  const [isUploading, setIsUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    type: "single",
    // Basic Information
    name: "",
    price: "",
    category: "",
    description: "",
    sizes: [],
    releaseDate: "",

    // Supply Information
    supplyCapacity: "no-max",
    quantity: "",
    showBadge: "do_not_show",
    releaseDuration: "",
    releaseDurationDays: "",
    releaseDurationMinutes: "",

    // Additional Information
    material: "",
    colors: "",
    targetAudience: "",
    shippingOption: "",
    domesticDays: "",
    domesticMinutes: "",
    internationalDays: "",
    internationalMinutes: "",

    // Images
    images: [],
  });

  const handleAddProduct = (type: ListingType): void => {
    setView(type);
    setActiveTab("product-info");
  };

  const handleFormChange = (data: Partial<FormData>): void => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleImagesChange = (images: File[]) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const handleNext = (): void => {
    if (activeTab === "product-info") {
      setActiveTab("additional-info");
    } else if (activeTab === "additional-info") {
      setActiveTab("preview");
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting form data:", formData);
    setIsSubmitting(true);
    try {
      if (formData.type === "single") {
        // Map enums and format fields to match backend
        const allowedCategories = [
          "men_clothing",
          "women_clothing",
          "men_shoes",
          "women_shoes",
          "accessories",
          "merch",
          "others",
        ];
        const allowedReleaseDurations = [
          "24hrs",
          "48hrs",
          "72hrs",
          "1week",
          "2weeks",
          "1month",
        ];
        const allowedSupplyCapacities = ["no_max", "limited"];
        const allowedBadges = ["show_badge", "do_not_show"];
        const allowedShippingOptions = ["local", "international", "both"];
        const allowedAudiences = ["male", "female", "unisex"];

        // Map category
        let category = formData.type === "single" ? formData.category : "";
        if (!allowedCategories.includes(category)) category = "others";

        // Map releaseDuration
        let releaseDuration = formData.releaseDuration || "";
        if (!allowedReleaseDurations.includes(releaseDuration))
          releaseDuration = "1week";

        // Map supplyCapacity
        let supplyCapacity = formData.supplyCapacity
          ?.toLowerCase()
          .includes("limit")
          ? "limited"
          : "no_max";
        if (!allowedSupplyCapacities.includes(supplyCapacity))
          supplyCapacity = "no_max";

        // Map limitedEditionBadge
        let limitedEditionBadge = formData.showBadge
          ?.toLowerCase()
          .includes("show")
          ? "show_badge"
          : "do_not_show";
        if (!allowedBadges.includes(limitedEditionBadge))
          limitedEditionBadge = "do_not_show";

        // Map shippingOption
        let shippingOption = formData.shippingOption || "local";
        if (!allowedShippingOptions.includes(shippingOption))
          shippingOption = "local";

        // Map additionalTargetAudience
        let additionalTargetAudience = formData.targetAudience || "unisex";
        if (!allowedAudiences.includes(additionalTargetAudience))
          additionalTargetAudience = "unisex";

        // Map colorsAvailable to array of objects
        let colorsAvailable =
          formData.colors || formData.colors
            ? (formData.colors || formData.colors)
                .split(",")
                .map((c: string) => ({ colorName: c.trim(), colorHex: "" }))
            : undefined;

        // Map sizes
        let sizes =
          formData.sizes && formData.sizes.length > 0
            ? formData.sizes.map((s: string) => s.trim().toUpperCase())
            : undefined;


             // Handle image uploads
    const uploadedImageUrls: string[] = [];
    
    if (formData.images && formData.images.length > 0) {
      for (const imageFile of formData.images) {
        try {
          const validation = validateImageFile(imageFile, 10); // 10MB max
          if (!validation.valid) {
            console.warn(`Skipping invalid image: ${validation.error}`);
            continue;
          }
          
          const uploadResult = await uploadImage(
            imageFile, 
            'store-assets', 
            'product-images', 
            true
          );
          
          if (uploadResult) {
            uploadedImageUrls.push(uploadResult.url);
          }
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          // Continue with other images
        }
      }
    }
    
    // Get main image URL with fallback
    const mainImageUrl = uploadedImageUrls.length > 0 
      ? uploadedImageUrls[0] 
      : "https://via.placeholder.com/400";

        await createSingleMutation.mutateAsync({
          title: formData.name,
          description: formData.description,
          category,
          priceCents: Math.round(parseFloat(formData.price) * 100),
          currency: "NGN",
          image:mainImageUrl,
          sizes,
          supplyCapacity,
          quantityAvailable: formData.quantity
            ? parseInt(formData.quantity)
            : undefined,
          limitedEditionBadge,
          releaseDuration,
          materialComposition: formData.material || formData.material,
          colorsAvailable,
          additionalTargetAudience,
          shippingOption,
          etaDomestic: formData.domesticDays,
          etaInternational: formData.internationalDays,
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
      setIsSubmitting(false);
      console.error("Error creating listing:", error);
    }
  };

  const handleCancel = (): void => {
    setView("empty");
    setActiveTab("product-info");
    setFormData({
      name: "",
      price: "",
      category: "",
      description: "",
      sizes: [],
      releaseDate: "",
      supplyCapacity: "no-max",
      quantity: "",
      showBadge: "do_not_show",
      releaseDuration: "",
      releaseDurationDays: "",
      releaseDurationMinutes: "",
      material: "",
      colors: "",
      targetAudience: "",
      shippingOption: "",
      domesticDays: "",
      domesticMinutes: "",
      internationalDays: "",
      internationalMinutes: "",
      images: [],
      type: "single",
    });
  };

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
            const fieldName = err.path?.[0] || "Field";
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

  const createCollectionMutation = (
    trpc.listing as any
  ).createCollection.useMutation({
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
            const fieldName = err.path?.[0] || "Field";
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

  // const handleSubmit = async () => {
  //   try {
  //     // 1. Upload images first
  //     const uploadedImageUrls: string[] = [];

  //     if (formData.images && formData.images.length > 0) {
  //       for (const imageFile of formData.images) {
  //         try {
  //           const uploadResult = await uploadImage(
  //             imageFile,
  //             'store-assets',
  //             'product-images',
  //             true
  //           );

  //           if (uploadResult) {
  //             uploadedImageUrls.push(uploadResult.url);
  //           }
  //         } catch (uploadError) {
  //           console.error('Failed to upload image:', uploadError);
  //         }
  //       }
  //     }

  //     // 2. Get main image URL
  //     const mainImageUrl = uploadedImageUrls.length > 0
  //       ? uploadedImageUrls[0]
  //       : "https://via.placeholder.com/400";

  //    // ... image upload code ...

  //     const productData = {
  //       // Your current data
  //       type: "single",
  //       title: formData.name.trim(),
  //       description: formData.description?.trim() || "",
  //       category: formData.category,
  //       image: mainImageUrl,
  //       priceCents: 1000,
  //       currency: "NGN",
  //       sizesJson: ["S", "M", "L"],
  //       supplyCapacity: "limited",
  //       quantityAvailable: 70,
  //       limitedEditionBadge: "do_not_show",
  //       releaseDuration: "6_months",
  //       materialComposition: "cotton",
  //       colorsAvailable: ["red", "blue", "yellow"],
  //       additionalTargetAudience: "female",
  //       shippingOption: "both",
  //       etaDomestic: "5_working_days",
  //       etaInternational: "1week",
  //     };

  //     console.log('Sending to API:', productData);

  //     await createSingleMutation.mutateAsync(productData);

  //     // ... success ...

  //   } catch (error) {
  //     console.error("Error creating listing:", error);
  //   }
  // };

  if (view === "empty") {
    return <EmptyState onAddProduct={handleAddProduct} />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6 text-gray-400">
        <span>New Listing</span>
        <span>›</span>
        <span className="text-white">
          {view === "single" ? "Single Items" : "Collection"}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">New Listing</h1>
        <p className="text-gray-400">
          List product and fill in your listing details
        </p>
      </div>

      {/* Tabs */}
      <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Form Content */}
      {activeTab === "product-info" && (
        <ProductInfoForm
          formData={formData}
          onFormChange={handleFormChange}
          images={formData.images}
          onImagesChange={handleImagesChange}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}

      {activeTab === "additional-info" && (
        <AdditionalInfoForm
          formData={formData}
          onFormChange={handleFormChange}
          images={formData.images}
          onImagesChange={handleImagesChange}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}

      {activeTab === "preview" && (
        <PreviewForm
          formData={formData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </div>
  );
};

export default NewListing;
