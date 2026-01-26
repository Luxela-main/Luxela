"use client";
import React, { useState } from "react";
import SellerSetupForm from "./setup";
import SellerPreview from "./preview";
import { SellerSetupFormData } from "@/types/seller";
import { toastSvc } from "@/services/toast";
import { trpc } from "../_trpc/client";
import { useRouter } from "next/navigation";

const SellerOnboarding = () => {
  const [currentPage, setCurrentPage] = useState<"setup" | "preview">("setup");
  const router = useRouter();

  // Corrected initial state with safe literal values
  const [formData, setFormData] = useState<SellerSetupFormData>({
    brandName: "",
    businessType: "individual",
    businessAddress: "",
    officialEmail: "",
    phoneNumber: "",
    countryCode: "+234",
    country: "",
    socialMedia: "",
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
    paymentMethod: "",
    preferredPayoutMethod: "fiat_currency",
    fiatPayoutMethod: "bank",
    bankCountry: "",
    accountHolderName: "",
    accountNumber: "",
    supportedBlockchain: "solana",
    walletType: "phantom",
    walletAddress: "",
    preferredPayoutToken: "solana",
    productCategory: "others",
    targetAudience: "unisex",
    localPricing: "fiat",
    bio: "",
  });

  const goToPreview = (data: SellerSetupFormData) => {
    setFormData(data);
    setCurrentPage("preview");
  };

  const goBackToSetup = () => setCurrentPage("setup");

  const handlePreviewUpdate = (updatedData: SellerSetupFormData) => {
    setFormData(updatedData);
  };

  // TRPC mutations
  const createSellerMutation = trpc.seller.createSellerProfile.useMutation();
  const updateBusinessMutation = trpc.seller.updateSellerBusiness.useMutation();
  const updateShippingMutation = trpc.seller.updateSellerShipping.useMutation();
  const updatePaymentMutation = trpc.seller.updateSellerPayment.useMutation();
  const updateAdditionalMutation = trpc.seller.updateSellerAdditional.useMutation();

  const handleFinalSubmit = async (data: SellerSetupFormData) => {
    try {
      // Ensure seller profile exists (creates if doesn't exist, succeeds if exists)
      await createSellerMutation.mutateAsync();

      await updateBusinessMutation.mutateAsync({
        brandName: data.brandName,
        businessType: data.businessType as "individual" | "business",
        businessAddress: data.businessAddress,
        officialEmail: data.officialEmail,
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode,
        country: data.country,
        socialMedia: data.socialMediaLinks
          ? JSON.stringify(data.socialMediaLinks)
          : undefined,
        fullName: data.fullName,
        idType: data.idType as "passport" | "drivers_license" | "voters_card" | "national_id",
        idNumber: data.idNumber,
        idVerified: data.idVerified,
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
        shippingType: "domestic",
        estimatedShippingTime: data.estimatedShippingTime as "48hrs" | "72hrs" | "5_working_days" | "1week",
        refundPolicy: (data.refundPolicy || data.periodUntilRefund || "no_refunds") as "no_refunds" | "48hrs" | "72hrs" | "5_working_days" | "1week" | "14days" | "30days" | "60days" | "store_credit",
        refundPeriod: data.periodUntilRefund as "48hrs" | "72hrs" | "5_working_days" | "1week",
      });

      await updatePaymentMutation.mutateAsync({
        preferredPayoutMethod: data.preferredPayoutMethod as "fiat_currency" | "cryptocurrency" | "both",
        fiatPayoutMethod: data.fiatPayoutMethod as "bank" | "paypal" | "stripe" | "flutterwave" | undefined,
        bankCountry: data.bankCountry,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        walletType: data.walletType as "phantom" | "solflare" | "backpack" | "wallet_connect" | undefined,
        walletAddress: data.walletAddress,
        preferredPayoutToken: data.preferredPayoutToken as "USDT" | "USDC" | "solana" | undefined,
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

      toastSvc.success("Seller account setup completed successfully!");
      setTimeout(() => router.push("/sellers/dashboard"), 1500);
    } catch (error: any) {
      console.error("Error during seller account setup:", error);
      const errorMsg = error?.message || error?.data?.message || "Failed to complete seller account setup";
      toastSvc.error(errorMsg);
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

export default SellerOnboarding;