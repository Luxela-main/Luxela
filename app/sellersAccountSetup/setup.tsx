"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Building, Truck, CreditCard, FileText, ArrowLeft, Save, Edit2Building } from "lucide-react";
import BuyerFooter from "@/components/buyer/footer";
import { SellerSetupFormData } from "@/types/seller";
import {
  COUNTRIES_WITH_STATES_AND_CITIES,
  getStatesForCountry,
  getCitiesForState,
  PHONE_COUNTRY_CODES,
  SOCIAL_MEDIA_PLATFORMS,
} from "./constants/formOptions";

type SetupProps = {
  initialData: SellerSetupFormData;
  onPreview: (data: SellerSetupFormData) => void;
};

const SellerSetupForm: React.FC<SetupProps> = ({ initialData, onPreview }) => {
  const [activeTab, setActiveTab] = useState<"business" | "shipping" | "payment" | "additional">("business");
  const [formData, setFormData] = useState<SellerSetupFormData>(initialData);
  const [socialMediaLinks, setSocialMediaLinks] = useState(
    initialData.socialMediaLinks || []
  );
  const [newSocialLink, setNewSocialLink] = useState({
    platform: "",
    url: "",
    username: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Save form data to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sellerOnboardingFormData', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    }
  }, [formData]);

  const validateSection = (section: string) => {
    const newErrors: Record<string, string> = {};

    if (section === "business") {
      if (!formData.brandName.trim())
        newErrors.brandName = "Brand name is required";
      if (!formData.businessType) newErrors.businessType = "Business type is required";
      if (!formData.businessAddress.trim())
        newErrors.businessAddress = "Business address is required";
      if (!formData.officialEmail.trim())
        newErrors.officialEmail = "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail))
        newErrors.officialEmail = "Invalid email format";
      if (!formData.phoneNumber.trim())
        newErrors.phoneNumber = "Phone number is required";
      if (!formData.country) newErrors.country = "Country is required";
      if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!formData.idType) newErrors.idType = "ID type is required";
      if (!formData.storeDescription?.trim())
        newErrors.storeDescription = "Store description is required";
    }

    if (section === "shipping") {
      if (!formData.shippingZone.trim())
        newErrors.shippingZone = "Shipping zone is required";
      if (!formData.cityTown.trim())
        newErrors.cityTown = "City/Town is required";
      if (!formData.shippingAddress.trim())
        newErrors.shippingAddress = "Shipping address is required";
      if (!formData.returnAddress.trim())
        newErrors.returnAddress = "Return address is required";
      if (!formData.shippingType) newErrors.shippingType = "Shipping type is required";
      if (!formData.estimatedShippingTime)
        newErrors.estimatedShippingTime = "Estimated shipping time is required";
      if (!formData.refundPolicy) newErrors.refundPolicy = "Refund policy is required";
      if (!formData.periodUntilRefund)
        newErrors.periodUntilRefund = "Refund period is required";
    }

    if (section === "payment") {
      if (!formData.preferredPayoutMethod)
        newErrors.preferredPayoutMethod = "Preferred payout method is required";

      if (
        formData.preferredPayoutMethod === "fiat_currency" ||
        formData.preferredPayoutMethod === "both"
      ) {
        if (!formData.fiatPayoutMethod)
          newErrors.fiatPayoutMethod = "Fiat payout method is required";
        if (formData.fiatPayoutMethod === "bank") {
          if (!formData.bankCountry)
            newErrors.bankCountry = "Bank country is required";
          if (!formData.accountHolderName?.trim())
            newErrors.accountHolderName = "Account holder name is required";
          if (!formData.accountNumber?.trim())
            newErrors.accountNumber = "Account number is required";
        }
      }

      if (
        formData.preferredPayoutMethod === "cryptocurrency" ||
        formData.preferredPayoutMethod === "both"
      ) {
        if (!formData.walletType)
          newErrors.walletType = "Wallet type is required";
        if (!formData.walletAddress?.trim())
          newErrors.walletAddress = "Wallet address is required";
        if (!formData.preferredPayoutToken)
          newErrors.preferredPayoutToken = "Preferred payout token is required";
        if (!formData.supportedBlockchain)
          newErrors.supportedBlockchain = "Blockchain is required";
      }
    }

    if (section === "additional") {
      if (!formData.productCategory)
        newErrors.productCategory = "Product category is required";
      if (!formData.targetAudience)
        newErrors.targetAudience = "Target audience is required";
      if (!formData.localPricing) newErrors.localPricing = "Pricing type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const addSocialLink = () => {
    if (!newSocialLink.platform || !newSocialLink.url) {
      setErrors((prev) => ({
        ...prev,
        socialMedia: "Platform and URL are required",
      }));
      return;
    }

    const updatedLinks = [
      ...socialMediaLinks,
      { ...newSocialLink, username: newSocialLink.username || "" },
    ];
    setSocialMediaLinks(updatedLinks);
    setFormData((prev) => ({ ...prev, socialMediaLinks: updatedLinks }));
    setNewSocialLink({ platform: "", url: "", username: "" });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.socialMedia;
      return newErrors;
    });
  };

  const removeSocialLink = (index: number) => {
    const updatedLinks = socialMediaLinks.filter((_, i) => i !== index);
    setSocialMediaLinks(updatedLinks);
    setFormData((prev) => ({ ...prev, socialMediaLinks: updatedLinks }));
  };

  const handleNext = () => {
    if (activeTab === "business" && validateSection("business")) {
      setActiveTab("shipping");
    } else if (activeTab === "shipping" && validateSection("shipping")) {
      setActiveTab("payment");
    } else if (activeTab === "payment" && validateSection("payment")) {
      setActiveTab("additional");
    }
  };

  const handlePrevious = () => {
    const tabOrder: Array<"business" | "shipping" | "payment" | "additional"> = [
      "business",
      "shipping",
      "payment",
      "additional",
    ];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const handleSubmitPreview = () => {
    const allTabsValid =
      validateSection("business") &&
      validateSection("shipping") &&
      validateSection("payment") &&
      validateSection("additional");

    if (allTabsValid) {
      onPreview(formData);
    } else {
      setActiveTab("business");
    }
  };

  const tabs = [
    { id: "business" as const, label: "Business Information", icon: Building },
    { id: "shipping" as const, label: "Shipping Information", icon: Truck },
    { id: "payment" as const, label: "Payment Information", icon: CreditCard },
    { id: "additional" as const, label: "Additional Information", icon: FileText },
  ];

  const inputClass =
    "w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600";
  const selectClass =
    "w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer";
  const labelClass = "block text-sm text-gray-400 mb-2 font-medium";
  const errorClass = "text-red-500 text-xs mt-1";

  const renderInputField = (
    label: string,
    name: keyof SellerSetupFormData,
    type: string = "text",
    placeholder: string = "",
    required: boolean = true
  ) => (
    <div className="mb-6">
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name as string}
        value={(formData[name] as string) || ""}
        onChange={handleInputChange}
        className={`${inputClass} ${errors[name] ? "border-red-500" : ""}`}
        placeholder={placeholder}
      />
      {errors[name] && <p className={errorClass}>{errors[name]}</p>}
    </div>
  );

  const renderSelectField = (
    label: string,
    name: keyof SellerSetupFormData,
    options: Array<{ value: string; label: string }>,
    required: boolean = true
  ) => (
    <div className="mb-6">
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name as string}
        value={(formData[name] as string) || ""}
        onChange={handleInputChange}
        className={`${selectClass} ${errors[name] ? "border-red-500" : ""}`}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errors[name] && <p className={errorClass}>{errors[name]}</p>}
    </div>
  );

  const renderCountryField = (
    label: string = "Country",
    required: boolean = true
  ) => {
    const countryList = Object.entries(COUNTRIES_WITH_STATES_AND_CITIES).map(
      ([code, data]) => ({
        value: code,
        label: data.label,
      })
    );

    return (
      <div className="mb-6">
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          name="country"
          value={(formData.country as string) || ""}
          onChange={(e) => {
            handleInputChange(e);
            setFormData((prev) => ({
              ...prev,
              state: "",
              city: "",
            }));
          }}
          className={`${selectClass} ${errors.country ? "border-red-500" : ""}`}
        >
          <option value="">Select country</option>
          {countryList.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.country && <p className={errorClass}>{errors.country}</p>}
      </div>
    );
  };

  const renderStateField = (
    label: string = "State/Region",
    required: boolean = true
  ) => {
    const states = formData.country ? getStatesForCountry(formData.country) : [];

    return (
      <div className="mb-6">
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          name="state"
          value={(formData.state as string) || ""}
          onChange={(e) => {
            handleInputChange(e);
            setFormData((prev) => ({
              ...prev,
              city: "",
            }));
          }}
          disabled={!formData.country}
          className={`${selectClass} ${errors.state ? "border-red-500" : ""} ${
            !formData.country ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="">Select state/region</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors.state && <p className={errorClass}>{errors.state}</p>}
      </div>
    );
  };

  const renderCityField = (
    label: string = "City",
    required: boolean = true,
    fieldName: 'city' | 'cityTown' = 'city'
  ) => {
    const cities =
      formData.country && formData.state
        ? getCitiesForState(formData.country, formData.state)
        : [];

    return (
      <div className="mb-6">
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          name={fieldName}
          value={(formData[fieldName] as string) || ""}
          onChange={handleInputChange}
          disabled={!formData.state}
          className={`${selectClass} ${errors[fieldName] ? "border-red-500" : ""} ${
            !formData.state ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="">Select city</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        {errors[fieldName] && <p className={errorClass}>{errors[fieldName]}</p>}
      </div>
    );
  };

  const renderBankCountryField = (
    label: string = "Bank Country",
    required: boolean = true
  ) => {
    const countryList = Object.entries(COUNTRIES_WITH_STATES_AND_CITIES).map(
      ([code, data]) => ({
        value: code,
        label: data.label,
      })
    );

    return (
      <div className="mb-6">
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          name="bankCountry"
          value={(formData.bankCountry as string) || ""}
          onChange={handleInputChange}
          className={`${selectClass} ${errors.bankCountry ? "border-red-500" : ""}`}
        >
          <option value="">Select country</option>
          {countryList.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.bankCountry && <p className={errorClass}>{errors.bankCountry}</p>}
      </div>
    );
  };

  const getCountryCodeForCountry = (countryCode: string): string => {
    const phoneCountryData = PHONE_COUNTRY_CODES.find(
      (c) => c.value === countryCode
    );
    return phoneCountryData?.code || "";
  };

  const renderCountryCodeField = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className={labelClass}>
            Phone Number
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={(formData.phoneNumber as string) || ""}
            onChange={handleInputChange}
            placeholder="Enter phone number"
            className={`${inputClass} ${errors.phoneNumber ? "border-red-500" : ""}`}
          />
          {errors.phoneNumber && <p className={errorClass}>{errors.phoneNumber}</p>}
        </div>
        <div>
          <label className={labelClass}>
            Country Code
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="countryCode"
            value={(formData.countryCode as string) || ""}
            onChange={(e) => {
              handleInputChange(e);
            }}
            disabled={!formData.country}
            className={`${selectClass} ${errors.countryCode ? "border-red-500" : ""} ${
              !formData.country ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <option value="">Select country code</option>
            {PHONE_COUNTRY_CODES.map((cc) => (
              <option key={cc.value} value={cc.code}>
                {cc.label}
              </option>
            ))}
          </select>
          {errors.countryCode && <p className={errorClass}>{errors.countryCode}</p>}
        </div>
      </div>
    );
  };

  const renderTwoColumns = (
    label1: string,
    name1: keyof SellerSetupFormData,
    label2: string,
    name2: keyof SellerSetupFormData,
    type1: string = "text",
    type2: string = "text"
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label className={labelClass}>
          {label1}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type={type1}
          name={name1 as string}
          value={(formData[name1] as string) || ""}
          onChange={handleInputChange}
          className={`${inputClass} ${errors[name1] ? "border-red-500" : ""}`}
        />
        {errors[name1] && <p className={errorClass}>{errors[name1]}</p>}
      </div>
      <div>
        <label className={labelClass}>
          {label2}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type={type2}
          name={name2 as string}
          value={(formData[name2] as string) || ""}
          onChange={handleInputChange}
          className={`${inputClass} ${errors[name2] ? "border-red-500" : ""}`}
        />
        {errors[name2] && <p className={errorClass}>{errors[name2]}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white pb-20">
      <header className="border-b border-[#2B2B2B] sticky top-0 z-10 bg-[#0E0E0E]">
        <div className="p-6 max-w-7xl mx-auto">
          <Link href="/" className="flex justify-center items-center">
            <Image
              src="/luxela.svg"
              alt="LUXELA"
              width={147.99}
              height={24.15}
              className="mr-2"
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Seller Account Setup</h1>
          <p className="text-gray-400">
            Complete all sections to set up your seller account
          </p>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 bg-[#141414] p-2 rounded-lg min-w-max md:min-w-0">
            {tabs.map((tab, idx) => {
              const TabIcon = (tab as any).icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (idx < tabs.indexOf(tabs.find((t) => t.id === activeTab) || tabs[0])) {
                      setActiveTab(tab.id);
                    }
                  }}
                  type="button"
                  className={`px-3 py-2 rounded text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer font-medium ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                  title={tab.label}
                >
                  <TabIcon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab, idx) => (
            <div
              key={tab.id}
              className={`h-1 flex-1 rounded transition-colors ${
                activeTab === tab.id ? "bg-purple-500" : "bg-[#333]"
              }`}
            />
          ))}
        </div>

        <div className="bg-black border border-[#747474] rounded-lg p-6 md:p-8">
          {activeTab === "business" && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-6">Business Information</h2>

              {renderInputField(
                "Brand Name",
                "brandName",
                "text",
                "Enter your brand name",
                true
              )}

              {renderSelectField(
                "Business Type",
                "businessType",
                [
                  { value: "individual", label: "Individual" },
                  { value: "business", label: "Registered Business" },
                  { value: "sole_proprietorship", label: "Sole Proprietorship" },
                  { value: "llc", label: "LLC" },
                  { value: "corporation", label: "Corporation" },
                  { value: "partnership", label: "Partnership" },
                  { value: "cooperative", label: "Cooperative" },
                  { value: "non_profit", label: "Non-Profit" },
                  { value: "trust", label: "Trust" },
                  { value: "joint_venture", label: "Joint Venture" },
                ],
                true
              )}

              {renderInputField(
                "Business Address",
                "businessAddress",
                "text",
                "Street address",
                true
              )}

              {renderInputField(
                "Official Email",
                "officialEmail",
                "email",
                "Enter your official email",
                true
              )}

              {renderCountryField("Country", true)}

              {renderStateField("State/Region", true)}

              {renderCityField("City", true)}

              {renderCountryCodeField()}

              {renderInputField(
                "Full Name",
                "fullName",
                "text",
                "Your full name",
                true
              )}

              {renderInputField(
                "Bio",
                "bio",
                "text",
                "A brief bio about yourself",
                false
              )}

              {renderInputField(
                "Store Description",
                "storeDescription",
                "text",
                "Brief description of your store",
                true
              )}

              <div className="border-t border-[#747474] pt-6 mt-6">
                <h3 className="font-semibold mb-4">Store Branding</h3>
                
                {/* Store Logo Upload */}
                <div className="mb-6">
                  <label className={labelClass}>
                    Store Logo / Profile Picture
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData((prev) => ({
                                ...prev,
                                storeLogo: reader.result as string,
                                logoPath: file.name,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full cursor-pointer file:cursor-pointer hover:opacity-80"
                      />
                      {formData.logoPath && (
                        <p className="text-xs text-gray-500 mt-2">Selected: {formData.logoPath}</p>
                      )}
                    </div>
                    {formData.storeLogo && (
                      <div className="w-24 h-24 relative rounded border border-[#747474] overflow-hidden flex-shrink-0">
                        <Image
                          src={formData.storeLogo}
                          alt="Store Logo Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Store Banner Upload */}
                <div className="mb-6">
                  <label className={labelClass}>
                    Store Banner
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex gap-4 items-start flex-col">
                    <div className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData((prev) => ({
                                ...prev,
                                storeBanner: reader.result as string,
                                bannerPath: file.name,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full cursor-pointer file:cursor-pointer hover:opacity-80"
                      />
                      {formData.bannerPath && (
                        <p className="text-xs text-gray-500 mt-2">Selected: {formData.bannerPath}</p>
                      )}
                    </div>
                    {formData.storeBanner && (
                      <div className="w-full h-32 relative rounded border border-[#747474] overflow-hidden">
                        <Image
                          src={formData.storeBanner}
                          alt="Store Banner Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#747474] pt-6 mt-6">
                <h3 className="font-semibold mb-4">ID Verification</h3>
                {renderSelectField(
                  "ID Type",
                  "idType",
                  [
                    { value: "national_id", label: "National ID (NIN)" },
                    { value: "passport", label: "International Passport" },
                    { value: "drivers_license", label: "Driver's License" },
                    { value: "voters_card", label: "Voter's Card" },
                    { value: "business_license", label: "Business License" },
                    { value: "tax_id", label: "Tax ID" },
                    { value: "business_registration", label: "Business Registration" },
                  ],
                  true
                )}
              </div>

              <div className="border-t border-[#747474] pt-6 mt-6">
                <h3 className="font-semibold mb-4">Social Media Links (Optional)</h3>
                <div className="mb-4 p-4 bg-[#1a1a1a] rounded-lg">
                  <div className="mb-4">
                    <label className={labelClass}>Social Media Platform</label>
                    <select
                      value={newSocialLink.platform}
                      onChange={(e) =>
                        setNewSocialLink((prev) => ({
                          ...prev,
                          platform: e.target.value,
                        }))
                      }
                      className={selectClass}
                    >
                      <option value="">Select platform</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="x">Twitter/X</option>
                      <option value="tiktok">TikTok</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className={labelClass}>Username/Handle</label>
                    <input
                      type="text"
                      value={newSocialLink.username}
                      onChange={(e) =>
                        setNewSocialLink((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className={inputClass}
                      placeholder="@username"
                    />
                  </div>

                  <div className="mb-4">
                    <label className={labelClass}>Profile URL</label>
                    <input
                      type="url"
                      value={newSocialLink.url}
                      onChange={(e) =>
                        setNewSocialLink((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors cursor-pointer font-medium active:scale-95"
                  >
                    Add Link
                  </button>
                </div>

                {errors.socialMedia && (
                  <p className={errorClass}>{errors.socialMedia}</p>
                )}

                {socialMediaLinks.length > 0 && (
                  <div className="space-y-2">
                    {socialMediaLinks.map((link, idx) => {
                      const platform = SOCIAL_MEDIA_PLATFORMS.find(
                        (p) => p.value === link.platform
                      );
                      const IconComponent = platform?.icon;
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded border border-[#747474]"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {IconComponent && (
                              <IconComponent
                                size={20}
                                color={platform?.iconColor || "#ffffff"}
                                className="flex-shrink-0"
                              />
                            )}
                            <div>
                              <p className="text-sm text-gray-400 capitalize">
                                {link.platform}
                              </p>
                              <p className="text-xs text-gray-500">{link.url}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSocialLink(idx)}
                            className="text-red-500 hover:text-red-400 ml-4 cursor-pointer font-bold active:scale-110 transition-transform"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "shipping" && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-6">Shipping Information</h2>

              {renderInputField(
                "Shipping Zone",
                "shippingZone",
                "text",
                "Enter shipping zone",
                true
              )}

              {renderCityField("City/Town", true, 'cityTown')}

              {renderInputField(
                "Shipping Address",
                "shippingAddress",
                "text",
                "Complete shipping address",
                true
              )}

              {renderInputField(
                "Return Address",
                "returnAddress",
                "text",
                "Address for returns",
                true
              )}

              {renderSelectField(
                "Type of Shipping",
                "shippingType",
                [
                  { value: "domestic", label: "Domestic Only" },
                  { value: "international", label: "International Only" },
                  { value: "both", label: "Both Domestic & International" },
                ],
                true
              )}

              {renderSelectField(
                "Estimated Shipping Time",
                "estimatedShippingTime",
                [
                  { value: "same_day", label: "Same Day" },
                  { value: "next_day", label: "Next Day" },
                  { value: "48hrs", label: "48 Hours" },
                  { value: "72hrs", label: "72 Hours" },
                  { value: "5_working_days", label: "5 Working Days" },
                  { value: "1_2_weeks", label: "1-2 Weeks" },
                  { value: "2_3_weeks", label: "2-3 Weeks" },
                  { value: "custom", label: "Custom" },
                ],
                true
              )}

              {renderSelectField(
                "Refund Policy",
                "refundPolicy",
                [
                  { value: "no_refunds", label: "No Refunds" },
                  { value: "48hrs", label: "Within 48 Hours" },
                  { value: "72hrs", label: "Within 72 Hours" },
                  { value: "5_working_days", label: "Within 5 Working Days" },
                  { value: "1week", label: "Within 1 Week" },
                  { value: "14days", label: "Within 14 Days" },
                  { value: "30days", label: "Within 30 Days" },
                  { value: "60days", label: "Within 60 Days" },
                  { value: "store_credit", label: "Store Credit Only" },
                  { value: "accept_refunds", label: "Accept Refunds" },
                ],
                true
              )}

              {renderSelectField(
                "Refund Period",
                "periodUntilRefund",
                [
                  { value: "24hrs", label: "24 Hours" },
                  { value: "48hrs", label: "48 Hours" },
                  { value: "72hrs", label: "72 Hours" },
                  { value: "5_working_days", label: "5 Working Days" },
                  { value: "1week", label: "1 Week" },
                  { value: "2weeks", label: "2 Weeks" },
                ],
                true
              )}
            </div>
          )}

          {activeTab === "payment" && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-6">Payment Information</h2>

              <div className="mb-6">
                <label className={labelClass}>
                  Preferred Payout Method
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="space-y-3">
                  {[
                    {
                      value: "fiat_currency",
                      label: "Fiat Currency (Bank Transfer, etc.)",
                    },
                    { value: "cryptocurrency", label: "Cryptocurrency Wallet" },
                    { value: "both", label: "Both Methods" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className="flex items-center p-3 border border-[#747474] rounded cursor-pointer hover:bg-[#1a1a1a] transition-colors font-medium"
                    >
                      <input
                        type="radio"
                        name="preferredPayoutMethod"
                        value={method.value}
                        checked={formData.preferredPayoutMethod === method.value}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="ml-3 text-sm">{method.label}</span>
                    </label>
                  ))}
                </div>
                {errors.preferredPayoutMethod && (
                  <p className={errorClass}>{errors.preferredPayoutMethod}</p>
                )}
              </div>

              {(formData.preferredPayoutMethod === "fiat_currency" ||
                formData.preferredPayoutMethod === "both") && (
                <div className="mb-8 p-6 bg-[#1a1a1a] rounded-lg border border-[#747474]">
                  <h3 className="font-semibold mb-4">Fiat Currency Details</h3>

                  {renderSelectField(
                    "Preferred Fiat Method",
                    "fiatPayoutMethod",
                    [
                      { value: "bank", label: "Bank Transfer" },
                      { value: "paypal", label: "PayPal" },
                      { value: "stripe", label: "Stripe" },
                      { value: "flutterwave", label: "Flutterwave" },
                      { value: "wise", label: "Wise" },
                      { value: "mobile_money", label: "Mobile Money" },
                      { value: "local_gateway", label: "Local Payment Gateway" },
                    ],
                    true
                  )}

                  {formData.fiatPayoutMethod === "bank" && (
                    <>
                      {renderBankCountryField("Bank Country", true)}
                      {renderInputField(
                        "Account Holder Name",
                        "accountHolderName",
                        "text",
                        "Full name on account",
                        true
                      )}
                      {renderInputField(
                        "Account Number",
                        "accountNumber",
                        "text",
                        "Bank account number",
                        true
                      )}
                    </>
                  )}
                </div>
              )}

              {(formData.preferredPayoutMethod === "cryptocurrency" ||
                formData.preferredPayoutMethod === "both") && (
                <div className="mb-8 p-6 bg-[#1a1a1a] rounded-lg border border-[#747474]">
                  <h3 className="font-semibold mb-4">Cryptocurrency Wallet Details</h3>

                  {renderSelectField(
                    "Supported Blockchain",
                    "supportedBlockchain",
                    [
                      { value: "solana", label: "Solana" },
                      { value: "ethereum", label: "Ethereum" },
                      { value: "polygon", label: "Polygon" },
                      { value: "arbitrum", label: "Arbitrum" },
                      { value: "optimism", label: "Optimism" },
                    ],
                    true
                  )}

                  {renderSelectField(
                    "Wallet Type",
                    "walletType",
                    [
                      { value: "phantom", label: "Phantom" },
                      { value: "solflare", label: "Solflare" },
                      { value: "backpack", label: "Backpack" },
                      { value: "magic_eden", label: "Magic Eden" },
                      { value: "wallet_connect", label: "Wallet Connect" },
                      { value: "ledger_live", label: "Ledger Live" },
                    ],
                    true
                  )}

                  {renderInputField(
                    "Wallet Address",
                    "walletAddress",
                    "text",
                    "Your public wallet address",
                    true
                  )}

                  {renderSelectField(
                    "Preferred Payout Token",
                    "preferredPayoutToken",
                    [
                      { value: "USDT", label: "USDT (Tether)" },
                      { value: "USDC", label: "USDC (USD Coin)" },
                      { value: "DAI", label: "DAI" },
                      { value: "solana", label: "SOL (Solana)" },
                      { value: "ETH", label: "ETH (Ethereum)" },
                      { value: "MATIC", label: "MATIC (Polygon)" },
                    ],
                    true
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "additional" && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-6">Additional Information</h2>

              {renderSelectField(
                "Primary Product Category",
                "productCategory",
                [
                  { value: "men_clothing", label: "Men Clothing" },
                  { value: "women_clothing", label: "Women Clothing" },
                  { value: "men_shoes", label: "Men Shoes" },
                  { value: "women_shoes", label: "Women Shoes" },
                  { value: "accessories", label: "Accessories" },
                  { value: "merch", label: "Merchandise" },
                  { value: "others", label: "Others" },
                ],
                true
              )}

              {formData.productCategory === "others" && (
                <div className="mb-6">
                  <label className={labelClass}>
                    Specify Your Category
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="otherCategoryName"
                    value={formData.otherCategoryName || ""}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter category name"
                  />
                </div>
              )}

              {renderSelectField(
                "Target Audience",
                "targetAudience",
                [
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "unisex", label: "Unisex" },
                  { value: "kids", label: "Kids" },
                  { value: "teens", label: "Teens" },
                ],
                true
              )}

              {renderSelectField(
                "Local Pricing Type",
                "localPricing",
                [
                  { value: "fiat", label: "Fiat Currency" },
                  { value: "cryptocurrency", label: "Cryptocurrency" },
                  { value: "both", label: "Both" },
                ],
                true
              )}

              <div className="mb-6">
                <label className={labelClass}>Store Bio (Optional)</label>
                <textarea
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleInputChange}
                  className={`${inputClass} resize-none h-24`}
                  placeholder="Tell customers about your store..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-8 gap-4">
          <button
            onClick={handlePrevious}
            disabled={activeTab === "business"}
            type="button"
            className={`px-6 py-2.5 rounded text-sm transition-colors ${
              activeTab === "business"
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 border border-[#747474] hover:bg-[#1a1a1a] cursor-pointer active:scale-95"
            }`}
          >
            Previous
          </button>

          {activeTab !== "additional" ? (
            <button
              onClick={handleNext}
              type="button"
              className="px-8 py-2.5 bg-purple-600 rounded text-sm hover:bg-purple-700 transition-colors cursor-pointer font-medium active:scale-95"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmitPreview}
              disabled={isLoading}
              type="button"
              className="px-8 py-2.5 bg-green-600 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer font-medium active:scale-95"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                  Loading...
                </>
              ) : (
                "Review & Submit"
              )}
            </button>
          )}
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
};

export default SellerSetupForm;
