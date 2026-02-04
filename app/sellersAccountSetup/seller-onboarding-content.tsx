"use client";

import React, { useState } from "react";
import SellerSetupForm from "./setup";
import SellerPreview from "./preview";
import { SellerSetupFormData } from "@/types/seller";
import { toastSvc } from "@/services/toast";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useTRPCReady } from "@/context/TRPCReadyContext";

// Inner component that uses tRPC hooks - only rendered when context is ready
const SellerOnboardingContentInner = () => {
  const [currentPage, setCurrentPage] = useState<"setup" | "preview">("setup");
  const router = useRouter();
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Initialize form data - always returns default on first render (SSR safe)
  const getInitialFormData = (): SellerSetupFormData => {
    return {
      brandName: "",
      businessType: "individual",
      businessAddress: "",
      officialEmail: "",
      phoneNumber: "",
      countryCode: "+234",
      country: "",
      state: "",
      city: "",
      socialMediaLinks: [],
      fullName: "",
      idType: "passport",
      storeDescription: "",
      storeLogo: "",
      storeBanner: "",
      logoPath: "",
      bannerPath: "",
      shippingZone: "",
      cityTown: "",
      shippingAddress: "",
      returnAddress: "",
      shippingType: "domestic",
      estimatedShippingTime: "48hrs",
      refundPolicy: "no_refunds",
      periodUntilRefund: "48hrs",
      productCategory: "others",
      targetAudience: "unisex",
      localPricing: "fiat",
      bio: "",
      otherCategoryName: "",
    };
  };

  // Initialize mutations at the top level (not in useState/useEffect)
  const createSellerMutation = trpc.seller.createSellerProfile.useMutation();
  const updateBusinessMutation = trpc.seller.updateSellerBusiness.useMutation();
  const updateShippingMutation = trpc.seller.updateSellerShipping.useMutation();
  const updateAdditionalMutation = trpc.seller.updateSellerAdditional.useMutation();

  // Corrected initial state with safe literal values
  const [formData, setFormData] = useState<SellerSetupFormData>(getInitialFormData());

  // Load from localStorage after hydration is complete
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('sellerOnboardingFormData');
      if (saved) {
        const parsedData = JSON.parse(saved);
        setFormData(parsedData);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save form data to localStorage whenever it changes (only after hydration)
  React.useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('sellerOnboardingFormData', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    }
  }, [formData, isHydrated]);

  const goToPreview = (data: SellerSetupFormData) => {
    setFormData(data);
    setCurrentPage("preview");
  };

  const goBackToSetup = () => setCurrentPage("setup");

  const handlePreviewUpdate = (updatedData: SellerSetupFormData) => {
    setFormData(updatedData);
  };



  const handleFinalSubmit = async (data: SellerSetupFormData) => {
    
    try {
      await createSellerMutation.mutateAsync();

      await updateBusinessMutation.mutateAsync({
        brandName: data.brandName,
        businessType: data.businessType,
        businessAddress: data.businessAddress,
        officialEmail: data.officialEmail,
        phoneNumber: data.phoneNumber,
        country: data.country,
        countryCode: data.countryCode,
        socialMediaPlatform: data.socialMediaLinks?.[0]?.platform,
        socialMedia: data.socialMediaLinks ? JSON.stringify(data.socialMediaLinks) : undefined,
        fullName: data.fullName,
        idType: data.idType as "passport" | "drivers_license" | "voters_card" | "national_id",
        bio: data.bio,
        storeDescription: data.storeDescription,
        storeLogo: data.storeLogo,
        storeBanner: data.storeBanner,
      });

      await updateShippingMutation.mutateAsync({
        shippingZone: data.shippingZone,
        city: data.cityTown,
        shippingAddress: data.shippingAddress,
        returnAddress: data.returnAddress,
        shippingType: data.shippingType as "domestic" | "international" | "both",
        estimatedShippingTime: data.estimatedShippingTime as
          | "same_day"
          | "next_day"
          | "48hrs"
          | "72hrs"
          | "5_working_days"
          | "1_2_weeks"
          | "2_3_weeks"
          | "custom",
        refundPolicy: data.refundPolicy as "no_refunds" | "48hrs" | "72hrs" | "5_working_days" | "1week" | "14days" | "30days" | "60days" | "store_credit",
        refundPeriod: data.periodUntilRefund as
          | "same_day"
          | "next_day"
          | "48hrs"
          | "72hrs"
          | "5_working_days"
          | "1_2_weeks"
          | "2_3_weeks"
          | "1week"
          | "14days"
          | "30days"
          | "60days"
          | "store_credit"
          | "custom",
      });

      await updateAdditionalMutation.mutateAsync({
        productCategory: Array.isArray(data.productCategory)
          ? data.productCategory[0]
          : (data.productCategory as
              | "men_clothing"
              | "women_clothing"
              | "men_shoes"
              | "women_shoes"
              | "accessories"
              | "merch"
              | "others"),
        targetAudience: data.targetAudience as "male" | "female" | "unisex",
        localPricing: data.localPricing as "fiat" | "cryptocurrency",
      });

      toastSvc.success("Seller account created successfully!");
      setTimeout(() => router.push("/sellers/dashboard"), 1500);
    } catch (error: any) {
      console.error("Error creating seller account:", error);
      toastSvc.error(error.message || "Failed to create seller account");
    }
  };



  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      {currentPage === "setup" ? (
        <SellerSetupForm initialData={formData} onPreview={goToPreview} />
      ) : (
        <SellerPreview
          data={formData}
          onBack={goBackToSetup}
          onSubmit={handleFinalSubmit}
          onUpdate={handlePreviewUpdate}
        />
      )}
    </div>
  );
};

// Wrapper component that ensures tRPC context is ready before rendering inner component
const SellerOnboardingContent = () => {
  const { isReady: isTrpcReady } = useTRPCReady();

  if (!isTrpcReady) {
    // Show loading state while tRPC is initializing
    return <div className="min-h-screen bg-[#0E0E0E]"></div>;
  }

  // tRPC is ready, safe to render component with hooks
  return <SellerOnboardingContentInner />;
};

export default SellerOnboardingContent;