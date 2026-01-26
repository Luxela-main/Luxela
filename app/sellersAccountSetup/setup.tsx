import React, { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import BuyerFooter from "@/components/buyer/footer";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/luxela.svg";
import { SellerSetupFormData } from "@/types/seller";
import {
  validateImageFile,
  deleteImage,
  uploadImage,
} from "@/lib/upload-image";
import { toastSvc } from "@/services/toast";
import { X } from "lucide-react";
import { CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "../_trpc/client";
import {
  BUSINESS_TYPES,
  ID_TYPES,
  SHIPPING_ETA_OPTIONS,
  REFUND_POLICIES,
  FIAT_PAYOUT_METHODS,
  WALLET_TYPES,
  PAYOUT_TOKENS,
  SOCIAL_MEDIA_PLATFORMS,
} from "./constants/formOptions";
import {
  COUNTRIES,
  NIGERIAN_STATES,
  NIGERIAN_CITIES,
  SOCIAL_MEDIA_PLATFORMS as LOCATION_SOCIAL_PLATFORMS,
  getCountryCode,
  getStatesByCountry,
  getCitiesByState,
  getCountryPhoneCode,
  COUNTRY_PHONE_CODES,
} from "@/lib/constants/locations";

interface SellerSetupFormProps {
  initialData: SellerSetupFormData;
  onPreview: (data: SellerSetupFormData) => void;
}

const SellerSetupForm: React.FC<SellerSetupFormProps> = ({
  initialData,
  onPreview,
}) => {
  const [activeTab, setActiveTab] = useState("business");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [idNumber, setIdNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  const [availableStates, setAvailableStates] = useState<typeof NIGERIAN_STATES>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [socialMediaLinks, setSocialMediaLinks] = useState<Array<{ platform: string; username: string; url: string }>>([]);
  const isInitialLoadRef = useRef(true);

  const validationSchema = Yup.object({
    brandName: Yup.string().required("Brand name is required"),
    businessType: Yup.string().required("Business type is required"),
    businessAddress: Yup.string().required("Business address is required"),
    officialEmail: Yup.string()
      .email("Invalid email")
      .required("Email is required"),
    phoneNumber: Yup.string()
      .required("Phone number is required")
      .min(10, "Min 10 digits"),
    country: Yup.string().required("Country is required"),
    fullName: Yup.string().required("Full name is required"),
    idType: Yup.string().required("ID type is required"),
    shippingZone: Yup.string().required("Shipping zone is required"),
    cityTown: Yup.string().required("City/Town is required"),
    shippingAddress: Yup.string().required("Shipping address is required"),
    returnAddress: Yup.string().required("Return address is required"),
    preferredPayoutMethod: Yup.string().required("Payment method is required"),
    productCategory: Yup.string()
      .required("Please select a category"),
    targetAudience: Yup.string().required("Target audience is required"),
    localPricing: Yup.string().required("Local pricing is required"),
    refundPolicy: Yup.string().required('Refund policy is required when shipping type is selected'),
    periodUntilRefund: Yup.string().required('Period until refund is required when shipping type is selected'),
    otherCategoryName: Yup.string().when('productCategory', {
      is: 'others',
      then: (schema) => schema.required('Please specify your product category'),
      otherwise: (schema) => schema.optional(),
    }),
  });

  const verifyMutation = trpc.seller.verifyId.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsVerified(true);
        toastSvc.success("ID Verified Successfully");
      } else {
        setIsVerified(false);
        toastSvc.error(data.message || "Verification failed");
      }
    },
    onError: (err: any) => {
      setIsVerified(false);
      toastSvc.error(err.message || "Failed to verify ID");
    },
  });

  // Load saved form data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('sellerSetupFormData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Update formik with saved data
          Object.keys(parsedData).forEach((key) => {
            formik.setFieldValue(key, parsedData[key]);
          });
          
          // Also populate available states and cities based on saved country/state
          if (parsedData.country) {
            const states = getStatesByCountry(parsedData.country);
            setAvailableStates(states);
            
            // Populate cities if state is also saved
            if (parsedData.shippingZone) {
              const cities = getCitiesByState(parsedData.shippingZone, parsedData.country);
              setAvailableCities(cities);
            }
          }
        } catch (error) {
          console.error('Failed to load saved form data:', error);
        }
      }
      isInitialLoadRef.current = false;
    }
  }, []);

  // Initialize formik BEFORE useEffect hooks
  const formik = useFormik({
    initialValues: initialData,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    validateOnMount: false,
    onSubmit: (values) => {
      const submissionData = {
        ...values,
        idNumber: idNumber,
        idVerified: isVerified
      };
      clearSavedData();
      onPreview(submissionData);
    },
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialLoadRef.current) {
      const timerId = setTimeout(() => {
        localStorage.setItem('sellerSetupFormData', JSON.stringify(formik.values));
      }, 500); // Debounce saves by 500ms
      return () => clearTimeout(timerId);
    }
  }, [formik.values]);

  // Auto-populate country code when country changes
  useEffect(() => {
    if (formik.values.country) {
      const phoneCode = getCountryPhoneCode(formik.values.country);
      formik.setFieldValue('countryCode', phoneCode);
    }
  }, [formik.values.country]);

  // Update available states when country changes
  useEffect(() => {
    const states = getStatesByCountry(formik.values.country);
    setAvailableStates(states);
    // Only reset cities/state if country actually changed and it's not the initial load
    if (!isInitialLoadRef.current) {
      setAvailableCities([]);
      // Keep the saved shippingZone if it exists, only clear if country changed to empty
      if (!formik.values.country) {
        formik.setFieldValue('shippingZone', '');
        formik.setFieldValue('cityTown', '');
      }
    }
  }, [formik.values.country]);

  // Update available cities when state changes
  useEffect(() => {
    const cities = getCitiesByState(formik.values.shippingZone, formik.values.country);
    setAvailableCities(cities);
    // Only reset cityTown if state changed and it's not the initial load
    if (!isInitialLoadRef.current && !formik.values.shippingZone) {
      formik.setFieldValue('cityTown', '');
    }
  }, [formik.values.shippingZone, formik.values.country]);

  const tabs = [
    { id: "business", label: "Business Information" },
    { id: "shipping", label: "Shipping Information" },
    { id: "payment", label: "Payment Information" },
    { id: "additional", label: "Additional Information" },
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

  // Clear saved data on successful submission
  const clearSavedData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sellerSetupFormData');
    }
  };

  const audiences = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Unisex", value: "unisex" },
  ];

  const handleVerifyId = () => {
    if (!formik.values.idType || !idNumber) {
      toastSvc.error("Please select ID type and enter ID number");
      return;
    }

    verifyMutation.mutate({
      idType: formik.values.idType as any,
      idNumber: idNumber
    });
  };

  const fieldNameMap: Record<string, string> = {
    brandName: "Brand Name",
    businessType: "Business Type",
    businessAddress: "Business Address",
    officialEmail: "Official Email",
    phoneNumber: "Phone Number",
    country: "Country",
    fullName: "Full Name",
    idType: "ID Type",
    shippingZone: "Shipping Zone",
    cityTown: "City/Town",
    shippingAddress: "Shipping Address",
    returnAddress: "Return Address",
    preferredPayoutMethod: "Preferred Payout Method",
    productCategory: "Product Category",
    targetAudience: "Target Audience",
    localPricing: "Local Pricing",
    refundPolicy: "Refund Policy",
    periodUntilRefund: "Period Until Refund",
  };

  const handleNext = async () => {
    const errors = await formik.validateForm();

    const tabFields: Record<string, string[]> = {
      business: ["brandName", "businessType", "businessAddress", "officialEmail", "phoneNumber", "country", "fullName", "idType"],
      shipping: ["shippingZone", "cityTown", "shippingAddress", "returnAddress"],
      payment: ["preferredPayoutMethod"],
      additional: ["productCategory", "targetAudience", "localPricing"]
    };

    const currentTabFields = tabFields[activeTab] || [];
    const currentTabErrors = currentTabFields
      .filter(field => errors[field as keyof typeof errors])
      .map(field => ({
        field,
        name: fieldNameMap[field] || field,
        message: errors[field as keyof typeof errors]
      }));

    if (currentTabErrors.length > 0) {
      const errorIndex = currentErrorIndex % currentTabErrors.length;
      const error = currentTabErrors[errorIndex];

      toastSvc.error(`${error.message}`);

      const errorField = document.querySelector(`[name="${error.field}"]`);
      if (errorField) {
        errorField.scrollIntoView({ behavior: "smooth", block: "center" });
        (errorField as HTMLElement).focus();
      }

      setCurrentErrorIndex(prev => prev + 1);

      return;
    }

    setCurrentErrorIndex(0);

    if (activeTab === "additional") {
      const submissionData = {
        ...formik.values,
        idNumber: idNumber,
        idVerified: isVerified
      };
      onPreview(submissionData);
    } else {
      const idx = tabs.findIndex((t) => t.id === activeTab);
      if (idx < tabs.length - 1) {
        setActiveTab(tabs[idx + 1].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

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
    formik.setFieldValue("productCategory", value);
  };

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
  };

  const inputClass =
    "w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600";
  const selectClass =
    "w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm text-[#858585] focus:outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer";

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
      if (formik.values.logoPath) {
        await deleteImage(formik.values.logoPath);
      }

      const result = await uploadImage(file, "store-assets", "logos", false);

      if (result) {
        formik.setFieldValue("storeLogo", result.url);
        formik.setFieldValue("logoPath", result.path);
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
      if (formik.values.bannerPath) {
        await deleteImage(formik.values.bannerPath);
      }

      const result = await uploadImage(file, "store-assets", "banners", false);

      if (result) {
        formik.setFieldValue("storeBanner", result.url);
        formik.setFieldValue("bannerPath", result.path);
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
    if (formik.values.logoPath) {
      await deleteImage(formik.values.logoPath);
    }
    formik.setFieldValue("storeLogo", "");
    formik.setFieldValue("logoPath", "");
  };

  const removeBanner = async () => {
    if (formik.values.bannerPath) {
      await deleteImage(formik.values.bannerPath);
    }
    formik.setFieldValue("storeBanner", "");
    formik.setFieldValue("bannerPath", "");
  };

  return (
    <div className="min-h-screen text-white  w-full bg-[#0E0E0E]">
      <header className="border-b border-[#2B2B2B]">
        <div className="p-6">
          <Link
            href="/sellersAccountSetup"
            className="flex mx-auto justify-center items-center"
          >
            <Image
              src={Logo}
              alt="LUXELA"
              width={147.99}
              height={24.15}
              className="mr-2"
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-[#f2f2f2] mb-2">
            Setup your Seller Account
          </h1>
          <p className="text-[#dcdcdc] text-sm">
            This is where your journey begins. Please provide the details below
            to create your seller account on Luxela.
          </p>
        </div>

        <div className="flex gap-6 mb-24">
          {/* Logo Upload */}
          <div className="shrink-0 relative">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="z-999 absolute left-20 top-24 w-36 h-36 bg-[#141414] rounded-full border border-[#212121] flex flex-col items-center justify-center cursor-pointer hover:bg-[#222] transition-colors overflow-hidden"
            >
              {formik.values.storeLogo ? (
                <>
                  <img
                    src={formik.values.storeLogo}
                    alt="Store Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
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
                </>
              ) : (
                <>
                  {uploadingLogo ? (
                    <div className="text-[#858585] text-sm">Uploading...</div>
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
              onClick={() => bannerInputRef.current?.click()}
              className="w-full h-48 bg-[#141414] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#222] transition-colors relative overflow-hidden"
            >
              {formik.values.storeBanner ? (
                <>
                  <img
                    src={formik.values.storeBanner}
                    alt="Store Banner"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
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
                </>
              ) : (
                <>
                  {uploadingBanner ? (
                    <div className="text-[#858585] text-sm">Uploading...</div>
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

        <div className="mb-6">
          <div className="flex w-fit gap-8 bg-[#141414] pt-3 pb-2 rounded-sm px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm relative transition-colors cursor-pointer ${activeTab === tab.id ? "text-purple-500" : "text-[#595959] hover:text-gray-300"}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={formik.handleSubmit}>
          <div className="bg-[#0a0a0a] border border-[#747474] rounded-lg p-8">

            {activeTab === "business" && (
              <div>
                <h2 className="text-xl font-medium mb-6">
                  Business Information
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      name="brandName"
                      value={formik.values.brandName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter your brand name"
                      className={inputClass}
                    />
                    {formik.touched.brandName && formik.errors.brandName && (
                      <div className="text-red-500 text-xs mt-1">
                        {formik.errors.brandName}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      value={formik.values.businessType}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={selectClass}
                      style={selectStyle}
                    >
                      <option value="">Enter your business type</option>
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {formik.touched.businessType &&
                      formik.errors.businessType && (
                        <div className="text-red-500 text-xs mt-1">
                          {formik.errors.businessType}
                        </div>
                      )}
                    {formik.values.businessType && (
                      <p className="text-xs text-[#858585] mt-1">
                        {BUSINESS_TYPES.find(t => t.value === formik.values.businessType)?.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Business Address
                    </label>
                    <input
                      type="text"
                      name="businessAddress"
                      value={formik.values.businessAddress}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter your business address"
                      className={inputClass}
                    />
                    {formik.touched.businessAddress &&
                      formik.errors.businessAddress && (
                        <div className="text-red-500 text-xs mt-1">
                          {formik.errors.businessAddress}
                        </div>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      name="officialEmail"
                      value={formik.values.officialEmail}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter your email address"
                      className={inputClass}
                    />
                    {formik.touched.officialEmail &&
                      formik.errors.officialEmail && (
                        <div className="text-red-500 text-xs mt-1">
                          {formik.errors.officialEmail}
                        </div>
                      )}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm mb-2 text-[#dcdcdc]">
                        Phone Number
                      </label>
                      <div className="flex flex-col md:flex-row gap-2 items-start">
                        <select
                          name="countryCode"
                          value={formik.values.countryCode || ""}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-24 bg-black border border-[#747474] rounded px-2 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="">Code</option>
                          {Object.entries(COUNTRY_PHONE_CODES).map(([code, phoneCode]) => {
                            const country = COUNTRIES.find(c => c.code === code);
                            return (
                              <option key={code} value={phoneCode}>
                                {country?.flag} {phoneCode}
                              </option>
                            );
                          })}
                        </select>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formik.values.phoneNumber}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="Enter your phone number"
                          className="flex-1 bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      {formik.touched.phoneNumber &&
                        formik.errors.phoneNumber && (
                          <div className="text-red-500 text-xs mt-1">
                            {formik.errors.phoneNumber}
                          </div>
                        )}
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-[#dcdcdc]">
                        Country
                      </label>
                      <select
                        name="country"
                        value={formik.values.country}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={selectClass}
                        style={selectStyle}
                      >
                        <option value="">Select your country</option>
                        {COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.name}
                          </option>
                        ))}
                      </select>
                      {formik.touched.country && formik.errors.country && (
                        <div className="text-red-500 text-xs mt-1">
                          {formik.errors.country}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Social Media Links
                    </label>
                    
                    {/* Add Social Media Platform */}
                    <div className="mb-6 p-4 border border-[#747474] rounded-lg bg-[#0E0E0E]">
                      <label className="text-xs text-[#858585] mb-2 block">Add Social Media Platform</label>
                      <div className="flex gap-2">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const newLink = {
                                platform: e.target.value,
                                username: "",
                                url: "",
                              };
                              const updatedLinks = [...(formik.values.socialMediaLinks || []), newLink];
                              formik.setFieldValue("socialMediaLinks", updatedLinks);
                              e.target.value = ""; // Reset dropdown
                            }
                          }}
                          className={selectClass}
                          style={selectStyle}
                        >
                          <option value="">Select a platform to add</option>
                          {SOCIAL_MEDIA_PLATFORMS.map((platform) => {
                            const isAdded = formik.values.socialMediaLinks?.some(
                              (link) => link.platform === platform.value
                            );
                            return (
                              <option key={platform.value} value={platform.value} disabled={isAdded}>
                                {platform.label} {isAdded ? "(Added)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <p className="text-xs text-[#666] mt-2">Optional: Add your social media profiles to help verify your account</p>
                    </div>
                    
                    {/* Display Added Social Media Links */}
                    <div className="space-y-6">
                      {formik.values.socialMediaLinks?.map((socialLink) => {
                        const platform = SOCIAL_MEDIA_PLATFORMS.find(
                          (p) => p.value === socialLink.platform
                        );
                        if (!platform) return null;
                        
                        const Icon = platform.icon;

                        return (
                          <div key={socialLink.platform} className="border border-[#747474] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5" style={{ color: platform.iconColor }} />
                                <label className="text-sm font-medium text-[#f2f2f2]">
                                  {platform.label}
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (formik.values.socialMediaLinks) {
                                    const updatedLinks = formik.values.socialMediaLinks.filter(
                                      (link) => link.platform !== socialLink.platform
                                    );
                                    formik.setFieldValue("socialMediaLinks", updatedLinks);
                                  }
                                }}
                                className="text-red-500 hover:text-red-400 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-[#858585] mb-1 block">
                                  Username/Handle
                                </label>
                                <input
                                  type="text"
                                  placeholder={platform.placeholder}
                                  value={socialLink.username || ""}
                                  onChange={(e) => {
                                    const updatedLinks = (formik.values.socialMediaLinks || []).map((link) =>
                                      link.platform === socialLink.platform
                                        ? { ...link, username: e.target.value }
                                        : link
                                    );
                                    formik.setFieldValue("socialMediaLinks", updatedLinks);
                                  }}
                                  className={inputClass}
                                />
                                <p className="text-xs text-[#666] mt-0.5">{platform.description}</p>
                              </div>
                              <div>
                                <label className="text-xs text-[#858585] mb-1 block">
                                  Profile URL
                                </label>
                                <input
                                  type="url"
                                  placeholder={`https://${platform.value}.com/...`}
                                  value={socialLink.url || ""}
                                  onChange={(e) => {
                                    const updatedLinks = (formik.values.socialMediaLinks || []).map((link) =>
                                      link.platform === socialLink.platform
                                        ? { ...link, url: e.target.value }
                                        : link
                                    );
                                    formik.setFieldValue("socialMediaLinks", updatedLinks);
                                  }}
                                  className={inputClass}
                                />
                                <p className="text-xs text-[#666] mt-0.5">Full profile URL</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="text-sm mb-2 text-[#dcdcdc] flex justify-between">
                      Full name <span>Required</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formik.values.fullName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter your full name"
                      className={inputClass}
                    />
                    {formik.touched.fullName && formik.errors.fullName && (
                      <div className="text-red-500 text-xs mt-1">
                        {formik.errors.fullName}
                      </div>
                    )}
                  </div>

                  {/* ID Verification Section */}
                  <div className="border-t border-[#747474] pt-6 mt-6">
                    <h3 className="text-base font-medium text-[#f2f2f2] mb-4">ID Verification</h3>

                    <div className="grid grid-cols-2 gap-6 mb-4">
                      {/* ID Type */}
                      <div>
                        <label className="flex justify-between text-sm mb-2 text-[#dcdcdc]">
                          ID Type <span>Required</span>
                        </label>
                        <select
                          name="idType"
                          value={formik.values.idType}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={selectClass}
                          style={selectStyle}
                        >
                          <option value="">Select ID type</option>
                          {ID_TYPES.filter(id => ['passport', 'drivers_license', 'voters_card', 'national_id'].includes(id.value)).map((idType) => (
                            <option key={idType.value} value={idType.value}>
                              {idType.label}
                            </option>
                          ))}
                        </select>
                        {formik.touched.idType && formik.errors.idType && (
                          <div className="text-red-500 text-xs mt-1">
                            {formik.errors.idType}
                          </div>
                        )}
                        {formik.values.idType && (
                          <p className="text-xs text-[#858585] mt-1">
                            {ID_TYPES.find(id => id.value === formik.values.idType)?.description}
                          </p>
                        )}
                      </div>

                      {/* ID Number */}
                      <div>
                        <label className="flex justify-between text-sm mb-2 text-[#dcdcdc]">
                          ID Number <span>Required</span>
                        </label>
                        <input
                          type="text"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          placeholder="Enter your ID number"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Verify Button */}
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleVerifyId}
                        disabled={!idNumber || !formik.values.idType || verifyMutation.isPending || isVerified}
                        className={`px-6 py-2.5 rounded text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                          isVerified
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
                  </div>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div>
                <h2 className="text-xl font-medium mb-6">
                  Shipping Information
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="flex justify-between text-sm mb-2 text-[#dcdcdc]">
                        Shipping zone <span>Required</span>
                      </label>
                      <select
                        name="shippingZone"
                        value={formik.values.shippingZone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={selectClass}
                        style={selectStyle}
                        disabled={!formik.values.country}
                      >
                        <option value="">Select the state</option>
                        {availableStates.map((state, index) => (
                          <option key={`${state.name}-${index}`} value={state.name}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      {!formik.values.country && (
                        <p className="text-xs text-[#858585] mt-1">Please select a country first</p>
                      )}
                      {formik.touched.shippingZone &&
                        formik.errors.shippingZone && (
                          <div className="text-red-500 text-xs mt-1">
                            {formik.errors.shippingZone}
                          </div>
                        )}
                    </div>
                    <div>
                      <label className="flex justify-between text-sm mb-2 text-[#dcdcdc]">
                        City/Town <span>Required</span>
                      </label>
                      <select
                        name="cityTown"
                        value={formik.values.cityTown}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={selectClass}
                        style={selectStyle}
                        disabled={!formik.values.shippingZone}
                      >
                        <option value="">Select city/town</option>
                        {availableCities.map((city, index) => (
                          <option key={`${city}-${index}`} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      {!formik.values.shippingZone && (
                        <p className="text-xs text-[#858585] mt-1">Please select a state first</p>
                      )}
                      {formik.touched.cityTown && formik.errors.cityTown && (
                        <div className="text-red-500 text-xs mt-1">
                          {formik.errors.cityTown}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Shipping Address
                    </label>
                    <input
                      type="text"
                      name="shippingAddress"
                      value={formik.values.shippingAddress}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter your shipping address"
                      className={inputClass}
                    />
                    {formik.touched.shippingAddress &&
                      formik.errors.shippingAddress && (
                        <div className="text-red-500 text-xs mt-1">
                          {formik.errors.shippingAddress}
                        </div>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Return Address
                    </label>
                    <input
                      type="text"
                      name="returnAddress"
                      value={formik.values.returnAddress}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter your return address"
                      className={inputClass}
                    />
                    {formik.touched.returnAddress &&
                      formik.errors.returnAddress && (
                        <div className="text-red-500 text-xs mt-1">
                          {formik.errors.returnAddress}
                        </div>
                      )}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm mb-2 text-[#dcdcdc]">
                        Type of shipping
                      </label>
                      <select
                        name="shippingType"
                        value={formik.values.shippingType}
                        onChange={formik.handleChange}
                        className={selectClass}
                        style={selectStyle}
                      >
                        <option value="">Select shipping type</option>
                        <option value="domestic">Domestic</option>
                        <option value="international">International</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-[#dcdcdc]">
                        Estimated Shipping time
                      </label>
                      <select
                        name="estimatedShippingTime"
                        value={formik.values.estimatedShippingTime}
                        onChange={formik.handleChange}
                        className={selectClass}
                        style={selectStyle}
                      >
                        <option value="">Select time</option>
                        {SHIPPING_ETA_OPTIONS.filter(opt => ['same_day', 'next_day', '48hrs', '72hrs', '5_working_days', '1_2_weeks'].includes(opt.value)).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm mb-2 text-[#dcdcdc]">
                        Refund policy
                      </label>
                      <select
                        name="refundPolicy"
                        value={formik.values.refundPolicy}
                        onChange={formik.handleChange}
                        className={selectClass}
                        style={selectStyle}
                      >
                        <option value="">Select refund policy</option>
                        {REFUND_POLICIES.map((policy) => (
                          <option key={policy.value} value={policy.value}>
                            {policy.label}
                          </option>
                        ))}
                      </select>
                      {formik.values.refundPolicy && (
                        <p className="text-xs text-[#858585] mt-1">
                          {formik.values.refundPolicy === 'no_refunds' ? 'No refunds will be offered after purchase' : 'Customers can request refunds within the specified period'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-[#dcdcdc]">
                        Refund Period
                      </label>
                      <select
                        name="periodUntilRefund"
                        value={formik.values.periodUntilRefund}
                        onChange={formik.handleChange}
                        className={selectClass}
                        style={selectStyle}
                        disabled={formik.values.refundPolicy !== 'accept_refunds'}
                      >
                        <option value="">Select refund period</option>
                        <option value="24hrs">24 Hours</option>
                        <option value="48hrs">48 Hours</option>
                        <option value="72hrs">72 Hours (3 Days)</option>
                        <option value="5_working_days">5 Working Days</option>
                        <option value="1week">1 Week</option>
                        <option value="2weeks">2 Weeks</option>
                      </select>
                      {formik.values.refundPolicy !== 'accept_refunds' && (
                        <p className="text-xs text-[#858585] mt-1">Enable refunds to set a refund period</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payment" && (
              <div>
                <h2 className="text-lg font-medium mb-6 text-[#f2f2f2]">
                  Payment Information
                </h2>
                <div className="space-y-8">
                  <div className="border border-[#747474] rounded-lg p-6">
                    <h3 className="text-base mb-4 text-[#f2f2f2]">
                      Choose your Preferred payout method
                    </h3>
                    <div className="flex gap-8 text-[#858585]">
                      {[
                        {
                          value: "fiat_currency",
                          label: "Fiat currency (Local Currency)",
                        },
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
                              formik.values.preferredPayoutMethod ===
                              method.value
                            }
                            onChange={formik.handleChange}
                            className="w-4 h-4 accent-purple-600"
                          />
                          <span className="text-sm">{method.label}</span>
                        </label>
                      ))}
                    </div>
                    {formik.touched.preferredPayoutMethod &&
                      formik.errors.preferredPayoutMethod && (
                        <div className="text-red-500 text-xs mt-2">
                          {formik.errors.preferredPayoutMethod}
                        </div>
                      )}
                  </div>

                  {(formik.values.preferredPayoutMethod === "fiat_currency" ||
                    formik.values.preferredPayoutMethod === "both") && (
                    <div className="border border-[#747474] rounded-lg p-6 text-[#f2f2f2]">
                      <h3 className="text-base mb-2">
                        Fiat Payment Information
                      </h3>
                      <p className="text-sm mb-6">
                        Enter bank details to receive payment in traditional
                        currencies
                      </p>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="flex justify-between text-sm mb-2 text-[#858585]">
                              Preferred Payout Method <span>Required</span>
                            </label>
                            <select
                              name="fiatPayoutMethod"
                              value={formik.values.fiatPayoutMethod}
                              onChange={formik.handleChange}
                              className={selectClass}
                              style={selectStyle}
                            >
                              <option value="">Select payout option</option>
                              {FIAT_PAYOUT_METHODS.map((method) => (
                                <option key={method.value} value={method.value}>
                                  {method.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="flex justify-between text-sm mb-2 text-[#858585]">
                              Bank Country <span>Required</span>
                            </label>
                            <select
                              name="bankCountry"
                              value={formik.values.bankCountry}
                              onChange={formik.handleChange}
                              className={selectClass}
                              style={selectStyle}
                            >
                              <option value="">Select country</option>
                              {COUNTRIES.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.flag} {country.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm mb-2 text-[#858585]">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              name="accountHolderName"
                              value={formik.values.accountHolderName}
                              onChange={formik.handleChange}
                              placeholder="Enter name as on bank account"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-2 text-[#858585]">
                              Account Number
                            </label>
                            <input
                              type="text"
                              name="accountNumber"
                              value={formik.values.accountNumber}
                              onChange={formik.handleChange}
                              placeholder="Enter account details"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(formik.values.preferredPayoutMethod === "cryptocurrency" ||
                    formik.values.preferredPayoutMethod === "both") && (
                    <div className="border border-[#747474] text-[#f2f2f2] rounded-lg p-6">
                      <h3 className="text-base mb-2">
                        Digital Wallet (Crypto) Information
                      </h3>
                      <p className="text-sm mb-6">
                        Enter digital wallet to receive payments in
                        cryptocurrency.
                      </p>
                      <div className="space-y-6 text-[#858585]">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm mb-2">
                              Supported Blockchain
                            </label>
                            <select
                              name="supportedBlockchain"
                              value={formik.values.supportedBlockchain}
                              onChange={formik.handleChange}
                              className={selectClass}
                              style={selectStyle}
                            >
                              <option value="solana">Solana</option>
                            </select>
                          </div>
                          <div>
                            <label className="flex justify-between text-sm mb-2">
                              Wallet Type <span>Required</span>
                            </label>
                            <select
                              name="walletType"
                              value={formik.values.walletType}
                              onChange={formik.handleChange}
                              className={selectClass}
                              style={selectStyle}
                            >
                              <option value="">Select wallet type</option>
                              {WALLET_TYPES.map((wallet) => (
                                <option key={wallet.value} value={wallet.value}>
                                  {wallet.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="flex justify-between text-sm mb-2">
                              Wallet Address <span>Required</span>
                            </label>
                            <input
                              type="text"
                              name="walletAddress"
                              value={formik.values.walletAddress}
                              onChange={formik.handleChange}
                              placeholder="Enter wallet address"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="flex justify-between text-sm mb-2">
                              Preferred Payout Token <span>Required</span>
                            </label>
                            <select
                              name="preferredPayoutToken"
                              value={formik.values.preferredPayoutToken}
                              onChange={formik.handleChange}
                              className={selectClass}
                              style={selectStyle}
                            >
                              <option value="">Select token</option>
                              {PAYOUT_TOKENS.map((token) => (
                                <option key={token.value} value={token.value}>
                                  {token.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "additional" && (
              <div>
                <h2 className="text-lg font-medium mb-6">
                  Additional information
                </h2>
                <div className="space-y-8">
                  <div className="border border-[#747474] rounded-lg p-6">
                    <h3 className="text-base mb-4 text-[#f2f2f2]">
                      Select product category
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {productCategory.map(({ label, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleCategory(value)}
                          className={`px-6 py-3 rounded text-sm transition-colors ${
                            formik.values.productCategory === value
                              ? "bg-purple-600 text-white"
                              : "bg-[#1a1a1a] text-[#858585] hover:bg-[#222]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {formik.values.productCategory === 'others' && (
                      <div className="mt-6 p-4 bg-[#1a1a1a] rounded border border-[#747474]">
                        <label className="block text-sm text-[#f2f2f2] mb-2">
                          Specify your product category
                        </label>
                        <input
                          type="text"
                          name="otherCategoryName"
                          value={formik.values.otherCategoryName || ''}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="Enter your category"
                          className="w-full px-4 py-2 bg-[#0E0E0E] text-[#f2f2f2] border border-[#747474] rounded focus:outline-none focus:border-purple-600"
                        />
                        {formik.touched.otherCategoryName && formik.errors.otherCategoryName && (
                          <p className="text-red-500 text-sm mt-2">{formik.errors.otherCategoryName}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="border border-[#747474] rounded-lg p-6">
                    <h3 className="text-base mb-4 text-[#f2f2f2]">
                      Target audience
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {audiences.map(({ label, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            formik.setFieldValue("targetAudience", value)
                          }
                          className={`px-6 py-3 rounded text-sm transition-colors ${formik.values.targetAudience === value ? "bg-purple-600 text-white" : "bg-[#1a1a1a] text-[#858585] hover:bg-[#222]"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border border-[#747474] rounded-lg p-6">
                    <h3 className="text-base mb-4 text-[#f2f2f2]">
                      Local pricing or currency
                    </h3>
                    <select
                      name="localPricing"
                      value={formik.values.localPricing}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={selectClass}
                      style={selectStyle}
                    >
                      <option value="">
                        Select your local pricing or currency
                      </option>
                      <option value="fiat">Fiat</option>
                      <option value="cryptocurrency">Cryptocurrency</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              className="px-8 py-2.5 border border-[#747474] rounded text-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {activeTab === "additional" ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-2.5 bg-purple-600 rounded text-sm hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Preview
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-2.5 bg-purple-600 rounded text-sm hover:bg-purple-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </main>
      <BuyerFooter />
    </div>
  );
};

export default SellerSetupForm;