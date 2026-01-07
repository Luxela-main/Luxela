"use client";

import React, { useState, useEffect, useRef } from "react";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import {
  validateImageFile,
  deleteImage,
  uploadImage,
} from "@/lib/upload-image";

import { SellerSetupFormData } from "@/types/seller";
import { Camera } from "lucide-react";
import SearchBar from "@/components/search-bar";
import { CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("business");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // Fetch profile data
  const {
    data: profileData,
    isLoading,
    refetch,
    error,
  } = trpc.seller.getProfile.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Log errors
  useEffect(() => {
    if (error) {
      toastSvc.error("Failed to load profile data, Try again");
    }
  }, [error]);

  // Mutations
  const updateBusinessMutation = trpc.seller.updateSellerBusiness.useMutation();
  const updateShippingMutation = trpc.seller.updateSellerShipping.useMutation();
  const updatePaymentMutation = trpc.seller.updateSellerPayment.useMutation();
  const updateAdditionalMutation =
    trpc.seller.updateSellerAdditional.useMutation();

  const verifyMutation = trpc.seller.verifyId.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toastSvc.success("Verification Successful");
        setIsVerified(true);
        refetch();
      } else {
        toastSvc.error(data.message);
      }
    },
    onError: (err: any) => {
      toastSvc.error(err.message || "Failed to verify ID");
    },
  });



  const initialData: SellerSetupFormData = {
    // Business Information
    brandName: "",
    businessType: "",
    businessAddress: "",
    officialEmail: "",
    phoneNumber: "",
    countryCode: "",
    country: "",
    socialMedia: "",
    fullName: "",
    idType: "",
    bio: "",
    storeDescription: "",
    storeLogo: "",
    storeBanner: "",
    logoPath: "",
    bannerPath: "",

    // Shipping Information
    shippingZone: "",
    cityTown: "",
    shippingAddress: "",
    returnAddress: "",
    shippingType: "",
    estimatedShippingTime: "",
    refundPolicy: "",
    periodUntilRefund: "",

    // Payment Information
    paymentMethod: "",
    preferredPayoutMethod: "",
    fiatPayoutMethod: "",
    bankCountry: "",
    accountHolderName: "",
    accountNumber: "",
    supportedBlockchain: "",
    walletType: "",
    walletAddress: "",
    preferredPayoutToken: "",

    // Additional Information
    productCategory: "",
    targetAudience: "",
    localPricing: "",
  };

  const [data, setData] = useState<SellerSetupFormData>(initialData);
  const [tempData, setTempData] = useState<SellerSetupFormData>(initialData);

  // Load data from API
  useEffect(() => {
    if (profileData) {

      const newData: SellerSetupFormData = {
        // Business fields
        brandName: profileData.business?.brandName || "",
        businessType: profileData.business?.businessType || "",
        businessAddress: profileData.business?.businessAddress || "",
        officialEmail: profileData.business?.officialEmail || "",
        phoneNumber: profileData.business?.phoneNumber || "",
        countryCode: "",
        country: profileData.business?.country || "",
        socialMedia: profileData.business?.socialMedia || "",
        fullName: profileData.business?.fullName || "",
        idType: profileData.business?.idType || "",
        bio: profileData.business?.bio || "",
        storeDescription: profileData.business?.storeDescription || "",
        storeLogo: profileData.business?.storeLogo || "",
        storeBanner: profileData.business?.storeBanner || "",
        logoPath: "",
        bannerPath: "",

        // Shipping fields
        shippingZone: profileData.shipping?.shippingZone || "",
        cityTown: profileData.shipping?.city || "",
        shippingAddress: profileData.shipping?.shippingAddress || "",
        returnAddress: profileData.shipping?.returnAddress || "",
        shippingType: profileData.shipping?.shippingType || "",
        estimatedShippingTime:
          profileData.shipping?.estimatedShippingTime || "",
        refundPolicy: profileData.shipping?.refundPolicy || "",
        periodUntilRefund: profileData.shipping?.refundPeriod || "",

        // Payment fields
        paymentMethod: profileData.payment?.preferredPayoutMethod || "",
        preferredPayoutMethod: profileData.payment?.preferredPayoutMethod || "",
        fiatPayoutMethod: profileData.payment?.fiatPayoutMethod || "",
        bankCountry: profileData.payment?.bankCountry || "",
        accountHolderName: profileData.payment?.accountHolderName || "",
        accountNumber: profileData.payment?.accountNumber || "",
        supportedBlockchain: "solana",
        walletType: profileData.payment?.walletType || "",
        walletAddress: profileData.payment?.walletAddress || "",
        preferredPayoutToken: profileData.payment?.preferredPayoutToken || "",

        // Additional fields
        productCategory: profileData.additional?.productCategory || "",
        targetAudience: (profileData.additional?.targetAudience as any) || "",
        localPricing: profileData.additional?.localPricing || "",
      };

      setData(newData);
      setTempData(newData);
      setIdNumber(profileData.business?.idNumber || "");
      setIsVerified(profileData.business?.idVerified || false);
    }
  }, [profileData]);

  const tabs = [
    { id: "business", label: "Business Information" },
    { id: "shipping", label: "Shipping" },
    { id: "payment", label: "Payment" },
    { id: "additional", label: "Additional" },
    { id: "notification", label: "Notification" },
    { id: "security", label: "Security" },
  ];

  const productCategory = [
    { label: "Men Clothing", value: "men_clothing" as const },
    { label: "Women Clothing", value: "women_clothing" as const },
    { label: "Men Shoes", value: "men_shoes" as const },
    { label: "Women Shoes", value: "women_shoes" as const },
    { label: "Accessories", value: "accessories" as const },
    { label: "Merch", value: "merch" as const },
    { label: "Others", value: "others" as const },
  ];

  const audiences = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Unisex", value: "unisex" },
  ];
  const toggleCategory = (
    value:
      | "men_clothing"
      | "women_clothing"
      | "men_shoes"
      | "women_shoes"
      | "accessories"
      | "merch"
      | "others"
  ) => {
    if (editingSection !== "additional") return;

    setTempData((prev: any) => ({
      ...prev,
      productCategory: [value],
    }));
  };
  const selectAudience = (value: "male" | "female" | "unisex") => {
    if (editingSection !== "additional") return;

    setTempData((prev: any) => ({
      ...prev,
      targetAudience: value,
    }));
  };

  const selectClass =
    "w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm text-[#858585] focus:outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer";

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
  };

  const handleEdit = (section: string) => {
    setEditingSection(section);
    setTempData({ ...data });
  };

  const handleCancel = () => {
    setEditingSection(null);
    setTempData({ ...data });
  };

  const handleSave = async () => {
    if (!editingSection) return;

    try {
      switch (editingSection) {
        case "business":
          await updateBusinessMutation.mutateAsync({
            brandName: tempData.brandName,
            businessType: tempData.businessType as "individual" | "business",
            businessAddress: tempData.businessAddress,
            officialEmail: tempData.officialEmail,
            phoneNumber: tempData.phoneNumber,
            country: tempData.country,
            socialMedia: tempData.socialMedia,
            fullName: tempData.fullName,
            idType: tempData.idType as
              | "passport"
              | "drivers_license"
              | "voters_card"
              | "national_id",
            bio: tempData.bio,
            storeDescription: tempData.storeDescription,
            storeLogo: tempData.storeLogo,
            storeBanner: tempData.storeBanner,
            idNumber: idNumber,
            idVerified: isVerified,
          });
          break;

        case "shipping":
          await updateShippingMutation.mutateAsync({
            shippingZone: tempData.shippingZone,
            city: tempData.cityTown,
            shippingAddress: tempData.shippingAddress,
            returnAddress: tempData.returnAddress,
            shippingType: tempData.shippingType as "domestic",
            estimatedShippingTime: tempData.estimatedShippingTime as
              | "48hrs"
              | "72hrs"
              | "5_working_days"
              | "1week",
            refundPolicy: tempData.refundPolicy as
              | "no_refunds"
              | "accept_refunds",
            refundPeriod: tempData.periodUntilRefund as
              | "48hrs"
              | "72hrs"
              | "5_working_days"
              | "1week",
          });
          break;

        case "payment":
          await updatePaymentMutation.mutateAsync({
            preferredPayoutMethod: tempData.preferredPayoutMethod as
              | "fiat_currency"
              | "cryptocurrency"
              | "both",
            fiatPayoutMethod: tempData.fiatPayoutMethod
              ? (tempData.fiatPayoutMethod as
                | "bank"
                | "paypal"
                | "stripe"
                | "flutterwave")
              : undefined,
            bankCountry: tempData.bankCountry || undefined,
            accountHolderName: tempData.accountHolderName || undefined,
            accountNumber: tempData.accountNumber || undefined,
            walletType: tempData.walletType
              ? (tempData.walletType as
                | "phantom"
                | "solflare"
                | "backpack"
                | "wallet_connect")
              : undefined,
            walletAddress: tempData.walletAddress || undefined,
            preferredPayoutToken: tempData.preferredPayoutToken
              ? (tempData.preferredPayoutToken as "USDT" | "USDC" | "solana")
              : undefined,
          });
          break;

        case "additional":
        case "additional":
          await updateAdditionalMutation.mutateAsync({
            productCategory: tempData.productCategory[0] as
              | "men_clothing"
              | "women_clothing"
              | "men_shoes"
              | "women_shoes"
              | "accessories"
              | "merch"
              | "others",
            targetAudience: tempData.targetAudience as
              | "male"
              | "female"
              | "unisex",
            localPricing: tempData.localPricing as "fiat" | "cryptocurrency",
          });
          break;

          break;
      }

      setData({ ...tempData });
      await refetch();
      setEditingSection(null);

      toastSvc.success("Changes saved successfully!");
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to save changes");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setTempData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      toastSvc.error(validation.error!);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
      return;
    }

    setUploadingLogo(true);
    try {
      if (tempData.logoPath) {
        await deleteImage(tempData.logoPath);
      }

      const result = await uploadImage(file, "store-assets", "logos", false);

      if (result) {
        setTempData((prev: any) => ({
          ...prev,
          storeLogo: result.url,
          logoPath: result.path,
        }));
        toastSvc.success("Logo uploaded successfully");
      }
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      toastSvc.error(validation.error!);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }
      return;
    }

    setUploadingBanner(true);
    try {
      if (tempData.bannerPath) {
        await deleteImage(tempData.bannerPath);
      }

      const result = await uploadImage(file, "store-assets", "banners", false);

      if (result) {
        setTempData((prev: any) => ({
          ...prev,
          storeBanner: result.url,
          bannerPath: result.path,
        }));
        toastSvc.success("Banner uploaded successfully");
      }
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }
    }
  };

  const removeLogo = async () => {
    if (tempData.logoPath) {
      await deleteImage(tempData.logoPath);
    }
    setTempData((prev: any) => ({
      ...prev,
      storeLogo: "",
      logoPath: "",
    }));
  };

  const removeBanner = async () => {
    if (tempData.bannerPath) {
      await deleteImage(tempData.bannerPath);
    }
    setTempData((prev: any) => ({
      ...prev,
      storeBanner: "",
      bannerPath: "",
    }));
  };


  const isSubmitting =
    updateBusinessMutation.isPending ||
    updateShippingMutation.isPending ||
    updatePaymentMutation.isPending ||
    updateAdditionalMutation.isPending;

  const inputClass =
    "w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm text-[#f2f2f2] focus:outline-none focus:border-purple-500";
  const labelClass = "block text-sm text-[#858585] mb-2";

  const renderField = (
    label: string,
    name: keyof SellerSetupFormData,
    isEditing: boolean,
    type: string = "text",
    options?: { value: string; label: string }[]
  ) => (
    <div>
      <p className={labelClass}>{label}</p>
      {isEditing ? (
        options ? (
          <select
            name={name}
            value={tempData[name] as string}
            onChange={handleInputChange}
            className={inputClass}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={tempData[name] as string}
            onChange={handleInputChange}
            className={inputClass}
          />
        )
      ) : (
        <p className="text-[#f2f2f2] text-sm capitalize">
          {options
            ? options.find((opt) => opt.value === data[name])?.label ||
            "Not provided"
            : data[name] || "Not provided"}
        </p>
      )}
    </div>
  );

  const renderRow = (
    label1: string,
    name1: keyof SellerSetupFormData,
    label2: string,
    name2: keyof SellerSetupFormData,
    isEditing: boolean,
    options1?: { value: string; label: string }[],
    options2?: { value: string; label: string }[]
  ) => (
    <div className="grid grid-cols-2 gap-6 mb-6">
      {renderField(label1, name1, isEditing, "text", options1)}
      {renderField(label2, name2, isEditing, "text", options2)}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-16 px-4 md:pt-0 relative">
      <div className="mb-6">
        <div className="w-60 z-10 lg:w-80 max-lg:fixed max-md:right-10 max-lg:right-12 max-lg:top-4.5 lg:ml-auto">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>
      <div className="mb-6 md:max-lg:pt-10">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-gray-400 mt-1">
          Update your profile, payment methods, and preferences — all in one
          place
        </p>
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto bg-[#141414] pb-2 rounded-sm">
  <div className="flex flex-wrap gap-4 md:gap-8 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm transition-colors relative ${activeTab === tab.id
                  ? "text-purple-500"
                  : "text-[#858585] hover:text-[#f2f2f2]"
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="py-8 max-w-7xl mx-auto">
        {/* Business Information Tab */}
        {activeTab === "business" && (
          <div>
            <div className="mb-8">
              <h2 className="text-lg font-medium text-[#f2f2f2] mb-2">
                Business Information
              </h2>
              <p className="text-sm text-[#858585]">
                Update your business information here
              </p>
            </div>

            <div className="flex gap-6 mb-24">
              {/* Logo Upload */}
              <div className="shrink-0 relative">
                <div
                  onClick={() =>
                    editingSection === "business" &&
                    logoInputRef.current?.click()
                  }
                  className={`z-20 absolute left-16 md:left-20 top-24 w-36 h-36 bg-[#141414] rounded-full border border-[#212121] flex flex-col items-center justify-center transition-colors overflow-hidden ${editingSection === "business"
                      ? "cursor-pointer hover:bg-[#222]"
                      : ""
                    }`}
                >
                  {tempData.storeLogo ? (
                    <>
                      <img
                        src={tempData.storeLogo}
                        alt="Store Logo"
                        className="w-full h-full object-cover rounded-full"
                      />
                      {editingSection === "business" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLogo();
                          }}
                          className="absolute top-2 right-2 bg-red-500 rounded-full p-1.5 hover:bg-red-600 z-10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {uploadingLogo ? (
                        <div className="text-[#858585] text-sm">
                          Uploading...
                        </div>
                      ) : (
                        <Camera className="w-12 h-12 text-[#858585] mb-2" />
                      )}
                    </>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Banner Upload */}
              <div className="flex-1">
                <div
                  onClick={() =>
                    editingSection === "business" &&
                    bannerInputRef.current?.click()
                  }
                  className={`w-full h-48 bg-[#141414] rounded-lg flex flex-col items-center justify-center transition-colors relative overflow-hidden ${editingSection === "business"
                      ? "cursor-pointer hover:bg-[#222]"
                      : ""
                    }`}
                >
                  {tempData.storeBanner ? (
                    <>
                      <img
                        src={tempData.storeBanner}
                        alt="Store Banner"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {editingSection === "business" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBanner();
                          }}
                          className="absolute top-3 right-3 bg-red-500 rounded-full p-2 hover:bg-red-600 z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {uploadingBanner ? (
                        <div className="text-[#858585] text-sm">
                          Uploading...
                        </div>
                      ) : (
                        <>
                          <Camera className="w-12 h-12 text-[#858585] mb-1" />
                          <p className="text-xs text-[#acacac]">
                            Supported file formats are .png and .jpeg
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Business Information Card */}
            <div className="border border-[#333] rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-medium text-[#f2f2f2]">
                  Business Information
                </h3>
                {editingSection === "business" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-[#858585] hover:text-[#f2f2f2] transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {isSubmitting ? "Saving..." : "Save"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit("business")}
                    className="text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {renderField(
                  "Brand Name",
                  "brandName",
                  editingSection === "business"
                )}

                {renderField(
                  "Business Type",
                  "businessType",
                  editingSection === "business",
                  "text",
                  [
                    { value: "individual", label: "Individual" },
                    { value: "business", label: "Business" },
                  ]
                )}

                {renderField(
                  "Business Address",
                  "businessAddress",
                  editingSection === "business"
                )}

                {renderField(
                  "Official Email Address",
                  "officialEmail",
                  editingSection === "business",
                  "email"
                )}

                {renderRow(
                  "Phone Number",
                  "phoneNumber",
                  "Country",
                  "country",
                  editingSection === "business"
                )}

                {renderField(
                  "Social Media",
                  "socialMedia",
                  editingSection === "business"
                )}

                {renderField(
                  "Full Name",
                  "fullName",
                  editingSection === "business"
                )}

                <div className="border-t border-[#333] pt-6 mt-6">
                  <h3 className="text-base font-medium text-[#f2f2f2] mb-4">ID Verification</h3>

                  <div className="grid grid-cols-2 gap-6 mb-4">
                    {/* ID Type */}
                    <div>
                      <p className={labelClass}>ID Type</p>
                      {editingSection === "business" ? (
                        <select
                          name="idType"
                          value={tempData.idType}
                          onChange={handleInputChange}
                          className={inputClass}
                        >
                          <option value="">Select ID type</option>
                          <option value="national_id">National ID (NIN)</option>
                          <option value="passport">International Passport</option>
                          <option value="drivers_license">Driver's License</option>
                          <option value="voters_card">Voter's Card</option>
                        </select>
                      ) : (
                        <p className="text-[#f2f2f2] text-sm capitalize">
                          {tempData.idType === "national_id"
                            ? "National ID (NIN)"
                            : tempData.idType === "passport"
                              ? "International Passport"
                              : tempData.idType === "drivers_license"
                                ? "Driver's License"
                                : tempData.idType === "voters_card"
                                  ? "Voter's Card"
                                  : "Not provided"}
                        </p>
                      )}
                    </div>

                    {/* ID Number */}
                    <div>
                      <p className={labelClass}>ID Number</p>
                      {editingSection === "business" ? (
                        <input
                          type="text"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          className={inputClass}
                          placeholder="Enter your ID number"
                        />
                      ) : (
                        <p className="text-[#f2f2f2] text-sm">
                          {idNumber || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Verify Button */}
                  {editingSection === "business" && (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => verifyMutation.mutate({ idType: tempData.idType as any, idNumber })}
                        disabled={!idNumber || !tempData.idType || verifyMutation.isPending || isVerified}
                        className={`px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${isVerified
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                      >
                        {verifyMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : isVerified ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Verified
                          </>
                        ) : (
                          "Verify ID"
                        )}
                      </button>
                      {isVerified && (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Verification Successful
                        </span>
                      )}
                    </div>
                  )}

                  {editingSection !== "business" && isVerified && (
                    <div className="flex items-center gap-2 text-green-500 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>ID Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === "shipping" && (
          <div>
            <div className="mb-8">
              <h2 className="text-lg font-medium text-[#f2f2f2] mb-2">
                Shipping Information
              </h2>
              <p className="text-sm text-[#858585]">
                Manage your shipping details and policies
              </p>
            </div>

            <div className="border border-[#333] rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-medium text-[#f2f2f2]">
                  Shipping Details
                </h3>

                {editingSection === "shipping" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-[#858585] hover:text-[#f2f2f2]"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">Cancel</span>
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 text-purple-500 hover:text-purple-400 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {isSubmitting ? "Saving..." : "Save"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit("shipping")}
                    className="text-purple-500 hover:text-purple-400"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Shipping Zone + City */}
                {renderRow(
                  "Shipping Zone",
                  "shippingZone",
                  "City/Town",
                  "cityTown",
                  editingSection === "shipping",
                  [
                    { value: "lagos", label: "Lagos" },
                    { value: "abuja", label: "Abuja" },
                  ],
                  [
                    { value: "ikeja", label: "Ikeja" },
                    { value: "lekki", label: "Lekki" },
                  ]
                )}

                {/* Addresses (inputs) */}
                {renderField(
                  "Shipping Address",
                  "shippingAddress",
                  editingSection === "shipping"
                )}

                {renderField(
                  "Return Address",
                  "returnAddress",
                  editingSection === "shipping"
                )}

                {/* Shipping type + ETA */}
                {renderRow(
                  "Type of Shipping",
                  "shippingType",
                  "Estimated Shipping Time",
                  "estimatedShippingTime",
                  editingSection === "shipping",
                  [
                    { value: "domestic", label: "Domestic" },
                    { value: "international", label: "International" },
                  ],
                  [
                    { value: "48hrs", label: "48hrs" },
                    { value: "72hrs", label: "72hrs" },
                    { value: "5_working_days", label: "5 working days" },
                    { value: "1week", label: "1 week" },
                  ]
                )}

                {/* Refund policy + period */}
                {renderRow(
                  "Refund Policy",
                  "refundPolicy",
                  "Period Until Refund",
                  "periodUntilRefund",
                  editingSection === "shipping",
                  [
                    { value: "no_refunds", label: "No Refunds" },
                    { value: "accept_refunds", label: "Accept Refunds" },
                  ],
                  [
                    { value: "48hrs", label: "48hrs" },
                    { value: "72hrs", label: "72hrs" },
                    { value: "5_working_days", label: "5 working days" },
                    { value: "1week", label: "1 week" },
                  ]
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === "payment" && (
          <div>
            <div className="mb-8">
              <h2 className="text-lg font-medium text-[#f2f2f2] mb-2">
                Payment Information
              </h2>
              <p className="text-sm text-[#858585]">
                Manage your payout preferences
              </p>
            </div>

            <div className="border border-[#333] rounded-lg p-6">
              {/* Header with Edit / Save buttons */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-medium text-[#f2f2f2]">
                  Payment Details
                </h3>

                {editingSection === "payment" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-[#858585] hover:text-[#f2f2f2]"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">Cancel</span>
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 text-purple-500 hover:text-purple-400 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {isSubmitting ? "Saving..." : "Save"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit("payment")}
                    className="text-purple-500 hover:text-purple-400"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Payment Method */}
                <div>
                  <p className={labelClass}>Payment Method</p>

                  {editingSection === "payment" ? (
                    <div className="flex gap-6 text-[#858585]">
                      {[
                        { value: "fiat_currency", label: "Fiat Currency" },
                        { value: "cryptocurrency", label: "Cryptocurrency" },
                        { value: "both", label: "Both" },
                      ].map((method) => (
                        <label
                          key={method.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="preferredPayoutMethod"
                            value={method.value}
                            checked={
                              tempData.preferredPayoutMethod === method.value
                            }
                            onChange={handleInputChange}
                            className="accent-purple-600"
                          />
                          <span className="text-sm">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#f2f2f2] text-sm capitalize">
                      {data.preferredPayoutMethod === "fiat_currency"
                        ? "Fiat Currency"
                        : data.preferredPayoutMethod === "cryptocurrency"
                          ? "Cryptocurrency"
                          : "Both"}
                    </p>
                  )}
                </div>

                {/* Fiat Details */}
                {(tempData.preferredPayoutMethod === "fiat_currency" ||
                  tempData.preferredPayoutMethod === "both") && (
                    <>
                      <h4 className="text-sm font-medium text-[#f2f2f2] pt-4 border-t border-[#333]">
                        Bank Information
                      </h4>
                      {renderRow(
                        "Fiat Payout Method",
                        "fiatPayoutMethod",
                        "Bank Country",
                        "bankCountry",
                        editingSection === "payment",
                        [
                          { value: "bank", label: "Bank" },
                          { value: "paypal", label: "Paypal" },
                          { value: "stripe", label: "Stripe" },
                          { value: "flutterwave", label: "Flutterwave" },
                        ],
                        undefined
                      )}
                      {renderRow(
                        "Account Holder Name",
                        "accountHolderName",
                        "Account Number",
                        "accountNumber",
                        editingSection === "payment"
                      )}
                    </>
                  )}

                {/* Crypto Details */}
                {(tempData.preferredPayoutMethod === "cryptocurrency" ||
                  tempData.preferredPayoutMethod === "both") && (
                    <>
                      <h4 className="text-sm font-medium text-[#f2f2f2] pt-4 border-t border-[#333]">
                        Digital Wallet Information
                      </h4>

                      {renderRow(
                        "Wallet Type",
                        "walletType",
                        "Preferred Payout Token",
                        "preferredPayoutToken",
                        editingSection === "payment",
                        [
                          { value: "phantom", label: "Phantom" },
                          { value: "solflare", label: "Solflare" },
                          { value: "backpack", label: "Backpack" },
                        ],
                        [
                          { value: "USDT", label: "USDT" },
                          { value: "USDC", label: "USDC" },
                          { value: "solana", label: "Solana" },
                        ]
                      )}

                      {renderField(
                        "Wallet Address",
                        "walletAddress",
                        editingSection === "payment"
                      )}
                    </>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Tab - Placeholder */}
        {activeTab === "additional" && (
          <div>
            <div className="mb-8">
              <h2 className="text-lg font-medium text-[#f2f2f2] mb-2">
                Additional Information
              </h2>
              <p className="text-sm text-[#858585]">
                Provide extra details for your store
              </p>
            </div>

            <div className="border border-[#333] rounded-lg p-6 space-y-6">
              {/* Header with Edit / Save buttons */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-medium text-[#f2f2f2]">
                  Additional Details
                </h3>

                {editingSection === "additional" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-[#858585] hover:text-[#f2f2f2]"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">Cancel</span>
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 text-purple-500 hover:text-purple-400 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {isSubmitting ? "Saving..." : "Save"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit("additional")}
                    className="text-purple-500 hover:text-purple-400"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Product Categories */}
              <div>
                <p className={labelClass}>Select product category</p>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {productCategory.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleCategory(value)}
                      className={`px-6 py-3 rounded text-sm transition-colors ${tempData.productCategory.includes(value)
                          ? "bg-purple-600 text-white"
                          : "bg-[#1a1a1a] text-[#858585] hover:bg-[#222]"
                        }`}
                      disabled={editingSection !== "additional"}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <p className={labelClass}>Target audience</p>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {audiences.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        selectAudience(value as "male" | "female" | "unisex")
                      }
                      className={`px-6 py-3 rounded text-sm transition-colors ${tempData.targetAudience === value
                          ? "bg-purple-600 text-white"
                          : "bg-[#1a1a1a] text-[#858585] hover:bg-[#222]"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Local Pricing */}
              <div>
                <p className={labelClass}>Local pricing or currency</p>
                {editingSection === "additional" ? (
                  <select
                    name="localPricing"
                    value={tempData.localPricing}
                    onChange={handleInputChange}
                    className={selectClass}
                    style={selectStyle}
                  >
                    <option value="">
                      Select your local pricing or currency
                    </option>
                    <option value="fiat">Fiat</option>
                    <option value="cryptocurrency">Cryptocurrency</option>
                  </select>
                ) : (
                  <p className="text-[#f2f2f2] text-sm capitalize">
                    {tempData.localPricing || "-"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notification Tab - Placeholder */}
        {activeTab === "notification" && (
          <div>
            <div className="mb-8">
              <h2 className="text-lg font-medium text-[#f2f2f2] mb-2">
                Notification Preferences
              </h2>
              <p className="text-sm text-[#858585]">
                Manage how you receive notifications
              </p>
            </div>
            <div className="border border-[#333] rounded-lg p-6">
              <p className="text-[#858585]">
                Notification settings coming soon...
              </p>
            </div>
          </div>
        )}

        {/* Security Tab - Placeholder */}
        {activeTab === "security" && (
          <div>
            <div className="mb-8">
              <h2 className="text-lg font-medium text-[#f2f2f2] mb-2">
                Security Settings
              </h2>
              <p className="text-sm text-[#858585]">
                Manage your account security
              </p>
            </div>
            <div className="border border-[#333] rounded-lg p-6">
              <p className="text-[#858585]">Security settings coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
