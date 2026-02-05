"use client";
import React, { useState, useRef, useEffect } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import CollectionForm from "@/components/sellers/NewListing/CollectionForm";
import type { CollectionItem } from "@/components/sellers/NewListing/CollectionForm";
import { createClient } from "@/utils/supabase/client";


export const dynamic = 'force-dynamic';

const NewListing: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");
  const lastValidationErrorsRef = useRef<string[]>([]);
  const lastValidationTimeRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);
  const STORAGE_KEY = 'luxela_listing_form_draft';

  // Fetch listings for edit mode
  // Type assertion needed because API returns string image URLs but form expects File[]
  const { data: listings = [] } = trpc.listing.getMyListings.useQuery()

  // Helper to get initial form data from localStorage or defaults
  const getInitialFormData = (): FormData => {
    if (typeof window !== 'undefined' && !editId) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Don't restore images as File objects (they can't be serialized)
          return { ...parsed, images: [] };
        }
      } catch (e) {
        console.error('Failed to load saved form data:', e);
      }
    }
    return {
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
      videos: [],
      collectionTitle: "",
      collectionDescription: "",
      collectionSku: "",
      collectionSlug: "",
      collectionMetaDescription: "",
      collectionBarcode: "",
      collectionVideoUrl: "",
      collectionCareInstructions: "",
      collectionRefundPolicy: "",
      collectionItems: [] as CollectionItem[],
      sku: "",
      slug: "",
      metaDescription: "",
      barcode: "",
      videoUrl: "",
      careInstructions: "",
      refundPolicy: "",
    };
  };

  const [view, setView] = useState<ViewType>(editId ? "single" : "empty");
  const [activeTab, setActiveTab] = useState<TabType>("product-info");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showListings, setShowListings] = useState(!editId);
  const [isLoadingExisting, setIsLoadingExisting] = useState(editId ? true : false);

  const [formData, setFormData] = useState<FormData>(getInitialFormData());


  // Auto-save form data to localStorage whenever it changes (but not images)
  useEffect(() => {
    if (!editId && isInitialLoadRef.current === false && view !== "empty") {
      try {
        const { images, ...dataWithoutImages } = formData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithoutImages));
      } catch (e) {
        console.error('Failed to save form data:', e);
      }
    }
  }, [formData, editId, view]);

  // Mark initial load as complete after first render
  useEffect(() => {
    isInitialLoadRef.current = false;
  }, []);

  // Load existing listing if editing
  useEffect(() => {
    const loadExistingListing = async () => {
      if (!editId || !listings || listings.length === 0) {
        setIsLoadingExisting(false);
        return;
      }

      try {
        
        const response = listings.find((l) => l.id === editId);
        if (response) {
          setFormData({
            type: response.type || "single",
            name: response.title || "",
            price: response.priceCents ? (response.priceCents / 100).toString() : "",
            category: response.category || "",
            description: response.description || "",
            sizes: response.sizesJson || [],
            releaseDate: "",
            supplyCapacity: response.supplyCapacity === "no_max" ? "no-max" : (response.supplyCapacity || "no-max"),
            quantity: response.quantityAvailable?.toString() || "",
            showBadge: (response.limitedEditionBadge === "show_badge" ? "show_badge" : "do_not_show"),
            releaseDuration: response.releaseDuration || "",
            releaseDurationDays: "",
            releaseDurationMinutes: "",
            material: response.materialComposition || "",
            colors: (response.colorsAvailable && Array.isArray(response.colorsAvailable)) ? ((response.colorsAvailable as { colorName: string; colorHex: string; }[]).map((c: any) => String(c.colorName)).join(", ")) : "",
            targetAudience: response.additionalTargetAudience || "",
            shippingOption: response.shippingOption || "",
            domesticDays: "",
            domesticMinutes: "",
            internationalDays: "",
            internationalMinutes: "",
            images: (response.imagesJson ? JSON.parse(response.imagesJson) : (response.image ? [response.image] : [])) as (File | string)[],
            collectionTitle: response.title || "",
            collectionDescription: response.description || "",
            collectionSku: response.sku || "",
            collectionSlug: response.slug || "",
            collectionMetaDescription: response.metaDescription || "",
            collectionBarcode: response.barcode || "",
            collectionVideoUrl: response.videoUrl || "",
            collectionCareInstructions: response.careInstructions || "",
            collectionRefundPolicy: response.refundPolicy || "",
            collectionItems: Array.isArray(response.itemsJson) ? (response.itemsJson as any).map((item: any) => ({
              ...item,
              images: item.image ? [item.image] : (item.images || [])
            })) : [],
            sku: response.sku || "",
            slug: response.slug || "",
            metaDescription: response.metaDescription || "",
            barcode: response.barcode || "",
            videoUrl: response.videoUrl || "",
            careInstructions: response.careInstructions || "",
            refundPolicy: response.refundPolicy || "",
          });
          setView(response.type || "single");
          setShowListings(false);
        }
      } catch (err) {
        toastSvc.error("Failed to load listing");
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadExistingListing();
  }, [editId, listings]);

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
  setShowListings(false);
  setActiveTab("product-info");

  setFormData((prev: any) => ({
    ...prev,
    type,
  }));
};

const handleBackToListings = () => {
  setShowListings(true);
};

  const handleFormChange = (data: Partial<FormData>): void => {
    setFormData((prev: any) => ({ ...prev, ...data }));
  };

  const handleImagesChange = (images: File[]) => {
    setFormData((prev: any) => ({ ...prev, images }));
  };

  const handleVideosChange = (videos: File[]) => {
    setFormData((prev: any) => ({ ...prev, videos }));
  };

  const handleNext = (): void => {
    if (activeTab === "product-info") {
      const validation = validateProductInfo();
      if (!validation.valid) {
        const now = Date.now();
        const errorsChanged = JSON.stringify(validation.errors) !== JSON.stringify(lastValidationErrorsRef.current);
        const debounceExpired = now - lastValidationTimeRef.current > 500;
        
        if (errorsChanged || debounceExpired) {
          lastValidationErrorsRef.current = validation.errors;
          lastValidationTimeRef.current = now;
          validation.errors.forEach((error) => toastSvc.error(error));
        }
        return;
      }
      setActiveTab("additional-info");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    } else if (activeTab === "additional-info") {
      const validation = validateAdditionalInfo();
      if (!validation.valid) {
        const now = Date.now();
        const errorsChanged = JSON.stringify(validation.errors) !== JSON.stringify(lastValidationErrorsRef.current);
        const debounceExpired = now - lastValidationTimeRef.current > 500;
        
        if (errorsChanged || debounceExpired) {
          lastValidationErrorsRef.current = validation.errors;
          lastValidationTimeRef.current = now;
          validation.errors.forEach((error) => toastSvc.error(error));
        }
        return;
      }
      setActiveTab("preview");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
  };

  const handleTabChange = (tab: TabType): void => {
    if (tab === "additional-info") {
      const validation = validateProductInfo();
      if (!validation.valid) {
        const now = Date.now();
        const errorsChanged = JSON.stringify(validation.errors) !== JSON.stringify(lastValidationErrorsRef.current);
        const debounceExpired = now - lastValidationTimeRef.current > 500;
        
        if (errorsChanged || debounceExpired) {
          lastValidationErrorsRef.current = validation.errors;
          lastValidationTimeRef.current = now;
          validation.errors.forEach((error) => toastSvc.error(error));
        }
        return;
      }
    } else if (tab === "preview") {
      const productValidation = validateProductInfo();
      const additionalValidation = validateAdditionalInfo();
      const allErrors = [...productValidation.errors, ...additionalValidation.errors];

      if (!productValidation.valid || !additionalValidation.valid) {
        const now = Date.now();
        const errorsChanged = JSON.stringify(allErrors) !== JSON.stringify(lastValidationErrorsRef.current);
        const debounceExpired = now - lastValidationTimeRef.current > 500;
        
        if (errorsChanged || debounceExpired) {
          lastValidationErrorsRef.current = allErrors;
          lastValidationTimeRef.current = now;
          allErrors.forEach((error) => toastSvc.error(error));
        }
        return;
      }
    }

    setActiveTab(tab);
  };

// Handler for single items
const handleSubmitSingle = async () => {
  setIsSubmitting(true);
  try {
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

    let category = formData.category || "";
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

    let colorsAvailable = undefined;
    if (formData.colors) {
      // Convert comma-separated color names to array of objects with colorName and colorHex
      // Color palette matching AdditionalInfoForm
      const COLOR_PALETTE: { [key: string]: string } = {
        Black: "#000000",
        White: "#FFFFFF",
        Red: "#FF0000",
        Crimson: "#DC143C",
        Blue: "#0000FF",
        "Navy Blue": "#000080",
        "Royal Blue": "#4169E1",
        "Sky Blue": "#87CEEB",
        Green: "#00AA00",
        "Dark Green": "#006400",
        Olive: "#808000",
        Yellow: "#FFFF00",
        Gold: "#FFD700",
        Orange: "#FFA500",
        "Dark Orange": "#FF8C00",
        Purple: "#800080",
        Violet: "#EE82EE",
        Magenta: "#FF00FF",
        Pink: "#FFC0CB",
        "Hot Pink": "#FF69B4",
        Brown: "#8B4513",
        Tan: "#D2B48C",
        Gray: "#808080",
        "Light Gray": "#D3D3D3",
        Beige: "#F5F5DC",
      };

      colorsAvailable = (formData.colors)
        .split(",")
        .map((c: string) => {
          const colorName = c.trim();
          return {
            colorName,
            colorHex: COLOR_PALETTE[colorName] || "#808080" // Default to gray if not found
          };
        });
    }

    let sizes =
      formData.sizes && formData.sizes.length > 0
        ? formData.sizes.map((s: string) => s.trim().toUpperCase())
        : undefined;

    const uploadedImageUrls: string[] = [];

    if (formData.images && formData.images.length > 0) {
      for (const imageFile of formData.images) {
        try {
          if (typeof imageFile === 'string') continue;
          const validation = validateImageFile(imageFile as File, 10);
          if (!validation.valid) {
            toastSvc.warning(`Skipping invalid image: ${validation.error}`);
            continue;
          }

          const uploadResult = await uploadImage(
            imageFile as File,
            "store-assets",
            "product-images",
            true
          );

          if (uploadResult) {
            uploadedImageUrls.push(uploadResult.url);
          }
        } catch (uploadError) {
          toastSvc.error("Failed to upload image");
        }
      }
    }
  const LUXELA_PLACEHOLDER = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";

    const mainImageUrl =
      uploadedImageUrls.length > 0
        ? uploadedImageUrls[0]
        : LUXELA_PLACEHOLDER;

    // Store all images as JSON
    const allImages = uploadedImageUrls.length > 0 ? uploadedImageUrls : [LUXELA_PLACEHOLDER];

    const supabase = createClient();
    const {
    data: { user },
    } = await supabase.auth.getUser();

    const sellerId = user?.id;

    if (!sellerId) {
      toastSvc.error("Cannot create listing: seller ID missing.");
      setIsSubmitting(false);
      return;
    }

    await createSingleMutation.mutateAsync({
      sellerId,
      title: formData.name,
      description: formData.description,
      category,
      priceCents: Math.round(parseFloat(formData.price) * 100),
      currency: "NGN",
      image: mainImageUrl,
      imagesJson: JSON.stringify(allImages),
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
      refundPolicy: formData.refundPolicy || undefined,
      videoUrl: formData.videoUrl || undefined,
      careInstructions: formData.careInstructions || undefined,
      sku: formData.sku || undefined,
      slug: formData.slug || undefined,
      metaDescription: formData.metaDescription || undefined,
      barcode: formData.barcode || undefined,
    });
    
    setIsSubmitting(false);
  } catch (error) {
    setIsSubmitting(false);
    toastSvc.error("Failed to create listing");
  }
};

// Helper to convert File objects to Base64 strings for serialization
const convertCollectionItemsForSubmission = async (items: CollectionItem[]): Promise<CollectionItem[]> => {
  return Promise.all(
    items.map(async (item) => {
      if (!item.images || item.images.length === 0) {
        return item;
      }

      const convertedImages = await Promise.all(
        item.images.map(async (image) => {
          // If it's already a string URL, return as-is
          if (typeof image === 'string') {
            return image;
          }
          // If it's a File object, convert to Base64
          if (image instanceof File) {
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result);
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(image);
            });
          }
          return undefined;
        })
      );

      return {
        ...item,
        images: convertedImages.filter((img): img is string => img !== undefined),
      };
    })
  );
};

// Handler for collections
const handleSubmitCollection = async () => {
  setIsSubmitting(true);
  try {
    // Convert File objects to Base64 strings for submission
    const convertedItems = await convertCollectionItemsForSubmission(formData.collectionItems || []);
    
    // Generate slug from title if not provided
    let collectionSlug = formData.collectionSlug || "";
    if (!collectionSlug || collectionSlug.trim() === "") {
      collectionSlug = (formData.collectionTitle || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    
    await createCollectionMutation.mutateAsync({
      title: formData.collectionTitle || "",
      description: formData.collectionDescription,
      items: convertedItems,
      supplyCapacity: formData.supplyCapacity as any,
      shippingOption: formData.shippingOption as any,
      etaDomestic: formData.domesticDays ? (formData.domesticDays as any) : undefined,
      etaInternational: formData.internationalDays ? (formData.internationalDays as any) : undefined,
      refundPolicy: formData.collectionRefundPolicy as any,
      sku: formData.collectionSku,
      slug: collectionSlug,
      metaDescription: formData.collectionMetaDescription,
      barcode: formData.collectionBarcode,
      videoUrl: formData.collectionVideoUrl,
      careInstructions: formData.collectionCareInstructions,
    });
    
    setIsSubmitting(false);
  } catch (error) {
    setIsSubmitting(false);
    toastSvc.error("Failed to create collection");
  }
};

  const handleCancel = (): void => {
    setView("empty");
    setActiveTab("product-info");
    // Form data is preserved in localStorage - user will have it if they navigate back
  };

  const handleViewListings = () => {
    router.push("/sellers/listings");
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const createSingleMutation = (trpc.listing as any).createSingle.useMutation({
    onSuccess: () => {
      toastSvc.success("Single listing created successfully!");
      // Clear saved form data after successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
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
      // Clear saved form data after successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
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

  // If loading edit mode listing, show loading state
  if (isLoadingExisting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading listing...</p>
        </div>
      </div>
    );
  }

  // Show listings browser if no active view
  if (view === "empty" || showListings) {
    return <ProductListings onAddProduct={handleAddProduct} />;
  }

  // Show creation/editing form
  return (
    <div className="min-h-screen bg-black text-white px-2 lg:px-6 pt-10">
    <div className="flex items-center gap-2 text-sm mb-6 text-gray-400">
      <button 
        onClick={handleBackToListings}
        className="hover:text-white transition-colors cursor-pointer"
      >
        <span>New Listing</span>
      </button>
      <span>›</span>
      <span className="text-white">
        {view === "single" ? "Single Items" : "Collection"}
      </span>
    </div>

     <div className="mb-8 pb-4 border-b-2 border-[#ECBEE3]">
  <h1 className="text-xl font-semibold mb-2 text-white">
    {formData.type === "collection" ? "Add Collection" : "New Listing"}
  </h1>
  <p className="text-[#EA795B]">
    {formData.type === "collection" 
      ? "Create a collection and add items to it"
      : "List product and fill in your listing details"
    }
  </p>
</div>

{formData.type === "single" && (
  <TabsNav activeTab={activeTab} onTabChange={handleTabChange} />
)}
      {activeTab === "product-info" && formData.type === "single" && (
        <ProductInfoForm
          formData={formData}
          onFormChange={handleFormChange}
          images={formData.images.filter((img): img is File => img instanceof File)}
          onImagesChange={handleImagesChange}
          videos={(formData.videos ?? []).filter((vid): vid is File => vid instanceof File)}
          onVideosChange={handleVideosChange}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}

    {formData.type === "collection" && (
  <CollectionForm
    title={formData.collectionTitle || ""}
    description={formData.collectionDescription || ""}
    sku={formData.collectionSku || ""}
    slug={formData.collectionSlug || ""}
    metaDescription={formData.collectionMetaDescription || ""}
    barcode={formData.collectionBarcode || ""}
    videoUrl={formData.collectionVideoUrl || ""}
    careInstructions={formData.collectionCareInstructions || ""}
    refundPolicy={formData.collectionRefundPolicy || ""}
    items={formData.collectionItems || []}
    onTitleChange={(title) =>
      handleFormChange({ collectionTitle: title })
    }
    onDescriptionChange={(description) =>
      handleFormChange({ collectionDescription: description })
    }
    onSkuChange={(sku) => handleFormChange({ collectionSku: sku })}
    onSlugChange={(slug) => handleFormChange({ collectionSlug: slug })}
    onMetaDescriptionChange={(metaDescription) =>
      handleFormChange({ collectionMetaDescription: metaDescription })
    }
    onBarcodeChange={(barcode) => handleFormChange({ collectionBarcode: barcode })}
    onVideoUrlChange={(videoUrl) => handleFormChange({ collectionVideoUrl: videoUrl })}
    onCareInstructionsChange={(careInstructions) =>
      handleFormChange({ collectionCareInstructions: careInstructions })
    }
    onRefundPolicyChange={(refundPolicy) =>
      handleFormChange({ collectionRefundPolicy: refundPolicy })
    }
    onItemsChange={(items) =>
      handleFormChange({ collectionItems: items })
    }
    onSubmit={handleSubmitCollection} 
    onNext={handleNext}
    isSubmitting={isSubmitting}
  />
)}

      {activeTab === "additional-info" && (
        <AdditionalInfoForm
          formData={formData}
          onFormChange={handleFormChange}
          images={formData.images.filter((img): img is File => img instanceof File)}
          onImagesChange={handleImagesChange}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}

      {activeTab === "preview" && (
        <PreviewForm
          formData={formData}
          onSubmit={handleSubmitSingle}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}

      <SuccessModal isOpen={showSuccessModal} onClose={handleCloseSuccessModal} />
    </div>
  );
};

export default NewListing;