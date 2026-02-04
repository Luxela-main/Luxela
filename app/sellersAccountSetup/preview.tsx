"use client"
import React, { useState, useEffect } from "react";
import { Building, Truck, FileText, ArrowLeft, Save, Edit2 } from "lucide-react";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import BuyerFooter from "@/components/buyer/footer";
import { SellerSetupFormData } from "@/types/seller";
import { SOCIAL_MEDIA_PLATFORMS, PHONE_COUNTRY_CODES } from "./constants/formOptions";

type SellerPreviewProps = {
  data: SellerSetupFormData;
  onBack: () => void;
  onSubmit: (data: SellerSetupFormData) => void;
  onUpdate: (data: SellerSetupFormData) => void;
};

const SellerAccountPreview: React.FC<SellerPreviewProps> = ({
  data,
  onBack,
  onSubmit,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("business");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localData, setLocalData] = useState<SellerSetupFormData>(data);
  const [idNumber, setIdNumber] = useState(data.idNumber || "");
  const [isVerified, setIsVerified] = useState(data.idVerified || false);

  useEffect(() => {
    setLocalData(data);
    setIdNumber(data.idNumber || "");
    setIsVerified(data.idVerified || false);
  }, [data]);

  const tabs = [
    { id: "business", label: "Business Information", icon: Building },
    { id: "shipping", label: "Shipping Information", icon: Truck },
    { id: "additional", label: "Additional Information", icon: FileText },
  ];
  // Payment tab removed - payment is optional

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

  const handleEdit = (section: string) => setEditingSection(section);

  const handleSave = () => {
    onUpdate({
      ...localData,
      idNumber: idNumber,
      idVerified: isVerified
    });
    setEditingSection(null);
  };

  const handleCancel = () => {
    setLocalData(data);
    setIdNumber(data.idNumber || "");
    setIsVerified(data.idVerified || false);
    setEditingSection(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleCategory = (value: string) => {
    const categoryValue = value as
      | "men_clothing"
      | "women_clothing"
      | "men_shoes"
      | "women_shoes"
      | "accessories"
      | "merch"
      | "others";

    setLocalData((prev) => ({
      ...prev,
      productCategory: categoryValue,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600";
  const selectClass =
    "w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer";

  const renderInfoField = (
    label: string,
    name: keyof SellerSetupFormData,
    isEditing: boolean,
    type: string = "text"
  ) => (
    <div className="mb-6">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      {isEditing ? (
        <input
          key={`${name}-${editingSection}`}
          type={type}
          name={name as string}
          value={(localData[name] as string) || ""}
          onChange={handleInputChange}
          className={inputClass}
          autoFocus={false}
        />
      ) : (
        <div className="text-gray-300 text-sm">
          {(data[name] as string) || "Not provided"}
        </div>
      )}
    </div>
  );

  const renderSelectField = (
    label: string,
    name: keyof SellerSetupFormData,
    isEditing: boolean,
    options: { value: string; label: string }[],
    required?: boolean
  ) => (
    <div className="mb-6">
      <label className="flex justify-between text-sm text-gray-400 mb-2">
        {label} {required && <span>Required</span>}
      </label>
      {isEditing ? (
        <select
          key={`${name}-${editingSection}`}
          name={name as string}
          value={(localData[name] as string) || ""}
          onChange={handleSelectChange}
          className={selectClass}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-black text-white">
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-gray-300 text-sm">
          {options.find(opt => opt.value === (data[name] as string))?.label || (data[name] as string) || "Not provided"}
        </div>
      )}
    </div>
  );

  const renderInfoRow = (
    label1: string,
    name1: keyof SellerSetupFormData,
    label2: string,
    name2: keyof SellerSetupFormData,
    isEditing: boolean,
    type1: string = "text",
    type2: string = "text"
  ) => (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">{label1}</label>
        {isEditing ? (
          <input
            key={`${name1}-${editingSection}`}
            type={type1}
            name={name1 as string}
            value={(localData[name1] as string) || ""}
            onChange={handleInputChange}
            className={inputClass}
            autoFocus={false}
          />
        ) : (
          <div className="text-gray-300 text-sm">
            {(data[name1] as string) || "Not provided"}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">{label2}</label>
        {isEditing ? (
          <input
            key={`${name2}-${editingSection}`}
            type={type2}
            name={name2 as string}
            value={(localData[name2] as string) || ""}
            onChange={handleInputChange}
            className={inputClass}
            autoFocus={false}
          />
        ) : (
          <div className="text-gray-300 text-sm">
            {(data[name2] as string) || "Not provided"}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <header className="border-b border-[#2B2B2B]">
        <div className="p-6">
          <Link
            href="/sellersAccountSetup"
            className="flex mx-auto justify-center items-center"
          >
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base">Preview your Seller Account</span>
          </button>
          <p className="text-sm text-gray-400">
            Review your details to ensure everything looks great before going
            live.
          </p>
        </div>

        <div className="mb-12 relative">
          {/* Banner */}
          <div className="w-full h-48 bg-gray-700 rounded-lg overflow-hidden mb-8">
            {data.storeBanner ? (
              <img
                src={data.storeBanner}
                alt="Store Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-purple-900 to-blue-900"></div>
            )}
          </div>

          {/* Logo */}
          <div className="absolute left-8 top-24">
            <div className="w-32 h-32 bg-gray-700 rounded-full border-4 border-[#0E0E0E] flex items-center justify-center text-4xl font-bold overflow-hidden">
              {data.storeLogo ? (
                <img
                  src={data.storeLogo}
                  alt="Store Logo"
                  className="w-full h-full object-cover"
                />
              ) : data.brandName ? (
                data.brandName.charAt(0).toUpperCase()
              ) : (
                "B"
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex w-fit gap-8 bg-[#141414] pt-3 pb-2 rounded-sm px-2">
            {tabs.map((tab) => {
              const TabIcon = (tab as any).icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm relative transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "text-purple-500"
                      : "text-[#595959] hover:text-gray-300"
                  }`}
                >
                  <TabIcon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-black border border-[#747474] rounded-lg p-8">
          {activeTab === "business" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Business Information</h2>
                {editingSection === "business" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <span className="text-sm">Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      <span className="text-sm">Save</span>
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

              {renderInfoField(
                "Brand Name",
                "brandName",
                editingSection === "business"
              )}
              {renderSelectField(
                "Business Type",
                "businessType",
                editingSection === "business",
                [
                  { label: "Select business type", value: "" },
                  { label: "Individual", value: "individual" },
                  { label: "Registered Business", value: "business" },
                  { label: "Sole Proprietorship", value: "sole_proprietorship" },
                  { label: "LLC", value: "llc" },
                  { label: "Corporation", value: "corporation" },
                  { label: "Partnership", value: "partnership" },
                  { label: "Cooperative", value: "cooperative" },
                  { label: "Non-Profit", value: "non_profit" },
                  { label: "Trust", value: "trust" },
                  { label: "Joint Venture", value: "joint_venture" },
                ]
              )}
              {renderInfoField(
                "Business Address",
                "businessAddress",
                editingSection === "business"
              )}
              {renderInfoField(
                "Official Email Address",
                "officialEmail",
                editingSection === "business",
                "email"
              )}

              {/* Phone Number and Country Code */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                  {editingSection === "business" ? (
                    <input
                      key={`phoneNumber-${editingSection}`}
                      type="tel"
                      name="phoneNumber"
                      value={(localData.phoneNumber as string) || ""}
                      onChange={handleInputChange}
                      className={inputClass}
                      autoFocus={false}
                    />
                  ) : (
                    <div className="text-gray-300 text-sm">
                      {(data.phoneNumber as string) || "Not provided"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Country Code</label>
                  {editingSection === "business" ? (
                    <select
                      key={`countryCode-${editingSection}`}
                      name="countryCode"
                      value={(localData.countryCode as string) || ""}
                      onChange={handleSelectChange}
                      className={selectClass}
                    >
                      <option value="">Select country code</option>
                      {PHONE_COUNTRY_CODES.map((cc) => (
                        <option key={cc.value} value={cc.code} className="bg-black text-white">
                          {cc.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-gray-300 text-sm">
                      {PHONE_COUNTRY_CODES.find(cc => cc.code === (data.countryCode as string))?.label || (data.countryCode as string) || "Not provided"}
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media Links */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Social Media</label>
                {editingSection === "business" ? (
                  <div className="space-y-3">
                    {localData.socialMediaLinks && localData.socialMediaLinks.length > 0 ? (
                      localData.socialMediaLinks.map((link, index) => {
                        const platform = SOCIAL_MEDIA_PLATFORMS.find(
                          (p) => p.value === link.platform
                        );
                        const IconComponent = platform?.icon;
                        return (
                          <div key={index} className="p-3 bg-[#1a1a1a] rounded border border-[#747474] flex items-start gap-3">
                            {IconComponent && (
                              <IconComponent
                                size={20}
                                color={platform?.iconColor || "#ffffff"}
                                className="flex-shrink-0 mt-0.5"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-gray-300 capitalize">{link.platform}</p>
                              <p className="text-xs text-gray-500 break-all">{link.url}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">No social media links added</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.socialMediaLinks && data.socialMediaLinks.length > 0 ? (
                      data.socialMediaLinks.map((link, index) => {
                        const platform = SOCIAL_MEDIA_PLATFORMS.find(
                          (p) => p.value === link.platform
                        );
                        const IconComponent = platform?.icon;
                        return (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            {IconComponent && (
                              <IconComponent
                                size={18}
                                color={platform?.iconColor || "#ffffff"}
                                className="flex-shrink-0 mt-1"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-gray-400 capitalize">{link.platform}</p>
                              <p className="text-gray-300 break-all">{link.url}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-300 text-sm">Not provided</p>
                    )}
                  </div>
                )}
              </div>

              {/* Full Name */}
              {renderInfoField(
                "Full Name",
                "fullName",
                editingSection === "business"
              )}

              {/* ID Verification Section */}
              <div className="border-t border-[#747474] pt-6 mt-6">
                <h3 className="text-base font-medium mb-4">ID Verification</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  {/* ID Type */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">ID Type</label>
                    {editingSection === "business" ? (
                      <select
                        name="idType"
                        value={localData.idType}
                        onChange={handleSelectChange}
                        className={selectClass}
                      >
                        <option value="" className="bg-black text-white">Select ID type</option>
                        <option value="national_id" className="bg-black text-white">National ID (NIN)</option>
                        <option value="passport" className="bg-black text-white">International Passport</option>
                        <option value="drivers_license" className="bg-black text-white">Driver's License</option>
                        <option value="voters_card" className="bg-black text-white">Voter's Card</option>
                      </select>
                    ) : (
                      <div className="text-gray-300 text-sm capitalize">
                        {data.idType === "national_id"
                          ? "National ID (NIN)"
                          : data.idType === "passport"
                          ? "International Passport"
                          : data.idType === "drivers_license"
                          ? "Driver's License"
                          : data.idType === "voters_card"
                          ? "Voter's Card"
                          : "Not provided"}
                      </div>
                    )}
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">ID Number</label>
                    {editingSection === "business" ? (
                      <input
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className={inputClass}
                        placeholder="Enter your ID number"
                      />
                    ) : (
                      <div className="text-gray-300 text-sm">
                        {idNumber || "Not provided"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Status */}
                {isVerified && (
                  <div className="flex items-center gap-2 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>ID Verified</span>
                  </div>
                )}
                
                {!isVerified && editingSection !== "business" && (
                  <div className="text-gray-400 text-sm">
                    ID not verified yet
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "shipping" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Shipping Information</h2>
                {editingSection === "shipping" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <span className="text-sm">Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      <span className="text-sm">Save</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit("shipping")}
                    className="text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {renderInfoRow(
                "Shipping zone",
                "shippingZone",
                "City/Town",
                "cityTown",
                editingSection === "shipping"
              )}

              {renderInfoField(
                "Shipping Address",
                "shippingAddress",
                editingSection === "shipping"
              )}
              {renderInfoField(
                "Return Address",
                "returnAddress",
                editingSection === "shipping"
              )}

              {renderInfoRow(
                "Type of shipping",
                "shippingType",
                "Estimated Shipping time",
                "estimatedShippingTime",
                editingSection === "shipping"
              )}

              {renderInfoRow(
                "Refund policy",
                "refundPolicy",
                "Period Until refund",
                "periodUntilRefund",
                editingSection === "shipping"
              )}
            </div>
          )}

          {activeTab === "additional" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Additional Information</h2>
                {editingSection === "additional" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <span className="text-sm">Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      <span className="text-sm">Save</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit("additional")}
                    className="text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">
                  Product Categories
                </label>
                {editingSection === "additional" ? (
                  <div className="grid grid-cols-3 gap-4">
                    {productCategory.map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleCategory(value)}
                        className={`px-6 py-3 rounded text-sm transition-colors ${
                          localData.productCategory === value
                            ? "bg-purple-600 text-white"
                            : "bg-[#1a1a1a] text-[#858585] hover:bg-[#222]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.productCategory ? (
                      <span className="px-4 py-2 bg-purple-600 text-white text-sm rounded capitalize">
                        {data.productCategory.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">
                        No category selected
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">
                  Target Audience
                </label>
                {editingSection === "additional" ? (
                  <div className="grid grid-cols-3 gap-4">
                    {audiences.map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setLocalData((prev) => ({
                            ...prev,
                            targetAudience: value as any,
                          }))
                        }
                        className={`px-6 py-3 rounded text-sm transition-colors ${
                          localData.targetAudience === value
                            ? "bg-purple-600 text-white"
                            : "bg-[#1a1a1a] text-[#858585] hover:bg-[#222]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-300 text-sm capitalize">
                    {data.targetAudience || "Not specified"}
                  </div>
                )}
              </div>

              {renderInfoField(
                "Local pricing or currency",
                "localPricing",
                editingSection === "additional"
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onBack}
            className="px-8 py-2.5 border border-[#747474] rounded text-sm hover:bg-[#1a1a1a] transition-colors cursor-pointer"
          >
            Back to Edit
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-purple-600 rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </main>

      <BuyerFooter />
    </div>
  );
};

export default SellerAccountPreview;