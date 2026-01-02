"use client";
import React, { useState } from "react";
import ProductListings from "@/components/sellers/NewListing/ProductListings";
import TabsNav from "@/components/sellers/NewListing/TabsNav";
import ProductInfoForm from "@/components/sellers/NewListing/ProductInfoForm";
import AdditionalInfoForm from "@/components/sellers/NewListing/AdditionalInfoForm";
import PreviewForm from "@/components/sellers/NewListing/PreviewForm";
import SuccessModal from "@/components/sellers/NewListing/SuccessModal";
import { FormData, ViewType, TabType, ListingType } from "@/types/newListing";
import { uploadImage, validateImageFile } from "@/lib/upload-image";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { useRouter } from "next/navigation";

const NewListing: React.FC = () => {
  const router = useRouter();

  const [view, setView] = useState<ViewType>("empty");
  const [activeTab, setActiveTab] = useState<TabType>("product-info");
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    type: "single",
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
  });

  // Validation functions
  const validateProductInfo = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("Product name is required");
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push("Valid price is required");
    }
    if (!formData.category) {
      errors.push("Category is required");
    }
    if (!formData.description.trim()) {
      errors.push("Description is required");
    }
    if (!formData.sizes || formData.sizes.length === 0) {
      errors.push("At least one size is required");
    }
    if (!formData.images || formData.images.length === 0) {
      errors.push("At least one product image is required");
    }
    if (
      formData.supplyCapacity === "limited" &&
      (!formData.quantity || parseInt(formData.quantity) <= 0)
    ) {
      errors.push("Quantity is required when supply capacity is limited");
    }
    if (!formData.releaseDuration) {
      errors.push("Release duration is required");
    }

    return { valid: errors.length === 0, errors };
  };

  const validateAdditionalInfo = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.material?.trim()) {
      errors.push("Material composition is required");
    }
    if (!formData.colors?.trim()) {
      errors.push("Colors available is required");
    }
    if (!formData.targetAudience) {
      errors.push("Target audience is required");
    }
    if (!formData.shippingOption) {
      errors.push("Shipping option is required");
    }
    if (!formData.domesticDays) {
      errors.push("Domestic shipping ETA is required");
    }
    if (
      (formData.shippingOption === "international" ||
        formData.shippingOption === "both") &&
      !formData.internationalDays
    ) {
      errors.push("International shipping ETA is required");
    }

    return { valid: errors.length === 0, errors };
  };

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
      const validation = validateProductInfo();
      if (!validation.valid) {
        validation.errors.forEach((error) => toastSvc.error(error));
        return;
      }
      setActiveTab("additional-info");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    } else if (activeTab === "additional-info") {
      const validation = validateAdditionalInfo();
      if (!validation.valid) {
        validation.errors.forEach((error) => toastSvc.error(error));
        return;
      }
      setActiveTab("preview");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
  };

  const handleTabChange = (tab: TabType): void => {
    // Validate before allowing manual tab navigation
    if (tab === "additional-info") {
      const validation = validateProductInfo();
      if (!validation.valid) {
        validation.errors.forEach((error) => toastSvc.error(error));
        return;
      }
    } else if (tab === "preview") {
      const productValidation = validateProductInfo();
      const additionalValidation = validateAdditionalInfo();

      if (!productValidation.valid) {
        productValidation.errors.forEach((error) => toastSvc.error(error));
        return;
      }
      if (!additionalValidation.valid) {
        additionalValidation.errors.forEach((error) => toastSvc.error(error));
        return;
      }
    }

    setActiveTab(tab);
  };

  const handleSubmit = async () => {
    console.log("Submitting form data:", formData);
    setIsSubmitting(true);
    try {
      if (formData.type === "single") {
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

        let category = formData.type === "single" ? formData.category : "";
        if (!allowedCategories.includes(category)) category = "others";

        let releaseDuration = formData.releaseDuration || "";
        if (!allowedReleaseDurations.includes(releaseDuration))
          releaseDuration = "1week";

        let supplyCapacity = formData.supplyCapacity
          ?.toLowerCase()
          .includes("limit")
          ? "limited"
          : "no_max";
        if (!allowedSupplyCapacities.includes(supplyCapacity))
          supplyCapacity = "no_max";

        let limitedEditionBadge = formData.showBadge
          ?.toLowerCase()
          .includes("show")
          ? "show_badge"
          : "do_not_show";
        if (!allowedBadges.includes(limitedEditionBadge))
          limitedEditionBadge = "do_not_show";

        let shippingOption = formData.shippingOption || "local";
        if (!allowedShippingOptions.includes(shippingOption))
          shippingOption = "local";

        let additionalTargetAudience = formData.targetAudience || "unisex";
        if (!allowedAudiences.includes(additionalTargetAudience))
          additionalTargetAudience = "unisex";

        let colorsAvailable =
          formData.colors || formData.colors
            ? (formData.colors || formData.colors)
                .split(",")
                .map((c: string) => ({ colorName: c.trim(), colorHex: "" }))
            : undefined;

        let sizes =
          formData.sizes && formData.sizes.length > 0
            ? formData.sizes.map((s: string) => s.trim().toUpperCase())
            : undefined;

        const uploadedImageUrls: string[] = [];

        if (formData.images && formData.images.length > 0) {
          for (const imageFile of formData.images) {
            try {
              const validation = validateImageFile(imageFile, 10);
              if (!validation.valid) {
                console.warn(`Skipping invalid image: ${validation.error}`);
                continue;
              }

              const uploadResult = await uploadImage(
                imageFile,
                "store-assets",
                "product-images",
                true
              );

              if (uploadResult) {
                uploadedImageUrls.push(uploadResult.url);
              }
            } catch (uploadError) {
              console.error("Failed to upload image:", uploadError);
            }
          }
        }

        const mainImageUrl =
          uploadedImageUrls.length > 0
            ? uploadedImageUrls[0]
            : "https://via.placeholder.com/400";

        await createSingleMutation.mutateAsync({
          title: formData.name,
          description: formData.description,
          category,
          priceCents: Math.round(parseFloat(formData.price) * 100),
          currency: "NGN",
          image: mainImageUrl,
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
        await createCollectionMutation.mutateAsync({
          title: formData.collectionTitle || "",
          description: formData.collectionDescription,
          items: formData.collectionItems || [],
        });
      }
      setIsSubmitting(false);
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

  const handleViewListings = () => {
    router.push("/sellers/my-listings");
  };

  const createSingleMutation = (trpc.listing as any).createSingle.useMutation({
    onSuccess: () => {
      toastSvc.success("Single listing created successfully!");
      setShowSuccessModal(true);
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
      setShowSuccessModal(true);
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

  if (view === "empty") {
    return <ProductListings onAddProduct={handleAddProduct} />;
  }

  return (
    <div className="min-h-screen bg-black text-white px-2 lg:px-6 pt-10">
      <div className="flex items-center gap-2 text-sm mb-6 text-gray-400">
        <span>New Listing</span>
        <span>›</span>
        <span className="text-white">
          {view === "single" ? "Single Items" : "Collection"}
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">New Listing</h1>
        <p className="text-gray-400">
          List product and fill in your listing details
        </p>
      </div>

      <TabsNav activeTab={activeTab} onTabChange={handleTabChange} />

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

      <SuccessModal isOpen={showSuccessModal} onView={handleViewListings} />
    </div>
  );
};

export default NewListing;
