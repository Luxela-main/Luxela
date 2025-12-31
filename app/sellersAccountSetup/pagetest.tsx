"use client";
import React, { useState } from "react";
import { Camera, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/luxela.svg";
import BuyerFooter from "@/components/buyer/footer";

const SellerAccountSetup = () => {
  const [activeTab, setActiveTab] = useState("business");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [productCategory, setProductCategory] = useState<
    (typeof productCategories)[number]["value"] | null
  >(null);

  const [targetAudience, setTargetAudience] = useState<
    (typeof audiences)[number]["value"] | null
  >(null);

  const [formData, setFormData] = useState({
    brandName: "",
    businessType: "",
    businessAddress: "",
    officialEmail: "",
    phoneNumber: "",
    countryCode: "+234",
    country: "",
    socialMedia: "",
    fullName: "",
    idType: "",
    shippingZone: "",
    cityTown: "",
    shippingAddress: "",
    returnAddress: "",
    shippingType: "",
    estimatedShippingTime: "",
    refundPolicy: "",
    periodUntilRefund: "",
    preferredPayoutMethod: "",
    bankCountry: "",
    accountHolderName: "",
    accountNumber: "",
    supportedBlockchain: "solana",
    walletType: "",
    walletAddress: "",
    preferredPayoutToken: "",
    localPricing: "",
  });

  const tabs = [
    { id: "business", label: "Business Information" },
    { id: "shipping", label: "Shipping Information" },
    { id: "payment", label: "Payment Information" },
    { id: "additional", label: "Additional Information" },
  ];

  // const productCategories = [
  //   "Men Clothing",
  //   "Women Clothing",
  //   "Men Shoes",
  //   "Women Shoes",
  //   "Accessories",
  //   "Merch",
  //   "Others",
  // ];
  // const audiences = ["Male", "Female", "Unisex"];

  const productCategories = [
    { label: "Men Clothing", value: "men_clothing" },
    { label: "Women Clothing", value: "women_clothing" },
    { label: "Men Shoes", value: "men_shoes" },
    { label: "Women Shoes", value: "women_shoes" },
    { label: "Accessories", value: "accessories" },
    { label: "Merch", value: "merch" },
    { label: "Others", value: "others" },
  ] as const;

  const audiences = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Unisex", value: "unisex" },
  ] as const;

  const handleInputChange = (e: { target: { name: any; value: any } }) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  const toggleAudience = (value: (typeof audiences)[number]["value"]) =>
    setTargetAudience((prev) => (prev === value ? null : value));

  const handleNext = () => {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
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

  const handleCancel = () => {
    // Handle cancel logic
    console.log("Cancel clicked");
  };

  return (
    <div className="min-h-screen text-white z-[999] bg-[#0E0E0E] w-full">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-xl font-medium  text-[#f2f2f2] mb-2">
            Setup your Seller Account
          </h1>
          <p className="text-[#dcdcdc] text-sm">
            This is where your journey begins. Please provide the details below
            to create your seller account on Luxela.
          </p>
        </div>

        {/* Image Upload Section */}
        <div className="flex gap-6 mb-24">
          {/* Profile Image */}
          <div className="flex-shrink-0  relative">
            <div className="absolute left-20 top-24 w-36 h-36 bg-[#141414] rounded-full border border-[#212121] flex flex-col items-center justify-center cursor-pointer hover:bg-[#222] transition-colors">
              <Camera className="w-12 h-12 text-[#858585] mb-2" />
            </div>
          </div>

          {/* Banner Image */}
          <div className="flex-1">
            <div className="w-full h-44 bg-[#141414] rounded-lg border border-none flex flex-col items-center justify-center cursor-pointer hover:bg-[#222] transition-colors">
              <Camera className="w-12 h-12 text-[#858585] mb-1" />
              <p className="text-xs text-[#acacac]">
                Supported file formats are .png and .jpeg
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex w-fit gap-8 bg-[#141414] pt-3 pb-2 rounded-sm px-2 ">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm relative transition-colors ${
                  activeTab === tab.id
                    ? "text-purple-500"
                    : "text-[#595959] hover:text-gray-300"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#0a0a0a] border border-[#747474] rounded-lg p-8">
          {/* Business Information Tab */}
          {activeTab === "business" && (
            <div>
              <h2 className="text-xl font-medium mb-6">Business Information</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2 text-[#dcdcdc]">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleInputChange}
                    placeholder="Enter your brand name"
                    className="w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#dcdcdc]">
                    Business Type
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm text-gray-400 focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                  >
                    <option value="">Enter your business type</option>
                    <option value="sole">Sole Proprietorship</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#dcdcdc]">
                    Business Address
                  </label>
                  <input
                    type="text"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your business address"
                    className="w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#dcdcdc]">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    name="officialEmail"
                    value={formData.officialEmail}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 max-sm:place-items-center">
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Phone Number
                    </label>
                    <div className="block md:flex gap-2">
                      <input
                        type="text"
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        className="w-20 bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="flex-1 bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm text-gray-400 focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                      <option value="">Select your country</option>
                      <option value="ng">Nigeria</option>
                      <option value="us">United States</option>
                      <option value="uk">United Kingdom</option>
                      <option value="ca">Canada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#dcdcdc]">
                    Social Media
                  </label>
                  <input
                    type="text"
                    name="socialMedia"
                    value={formData.socialMedia}
                    onChange={handleInputChange}
                    placeholder="Enter your social media"
                    className="w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm mb-2 text-[#dcdcdc] flex justify-between">
                      Full name <span className="text-right">Required</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-sm mb-2 text-[#dcdcdc]">
                      ID Type <span className="">Required</span>
                    </label>
                    <select
                      name="idType"
                      value={formData.idType}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-[#747474] rounded px-4 py-2.5 text-sm text-gray-400 focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                    >
                      <option value="">Select ID type</option>
                      <option value="passport">Passport</option>
                      <option value="drivers">Driver's License</option>
                      <option value="national">National ID</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "shipping" && (
            <div>
              <h2 className="text-xl font-medium mb-6">Shipping Information</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="flex justify-between text-sm mb-2 text-[#dcdcdc]">
                      Shipping zone <span className="">Required</span>
                    </label>
                    <select
                      name="shippingZone"
                      value={formData.shippingZone}
                      onChange={handleInputChange}
                      className={selectClass}
                      style={selectStyle}
                    >
                      <option value="">Select the state</option>
                      <option value="lagos">Lagos</option>
                      <option value="abuja">Abuja</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex justify-between text-sm mb-2 text-[#dcdcdc]">
                      City/Town <span className="">Required</span>
                    </label>
                    <select
                      name="cityTown"
                      value={formData.cityTown}
                      onChange={handleInputChange}
                      className={selectClass}
                      style={selectStyle}
                    >
                      <option value="">Select city/town</option>
                      <option value="ikeja">Ikeja</option>
                      <option value="lekki">Lekki</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-[#dcdcdc]">
                    Shipping Address
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your shipping address"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-[#dcdcdc]">
                    Return Address
                  </label>
                  <input
                    type="text"
                    name="returnAddress"
                    value={formData.returnAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your return address"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Type of shipping
                    </label>
                    <select
                      name="shippingType"
                      value={formData.shippingType}
                      onChange={handleInputChange}
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
                      value={formData.estimatedShippingTime}
                      onChange={handleInputChange}
                      className={selectClass}
                      style={selectStyle}
                    >
                      <option value="48hrs"> 48hrs</option>
                      <option value="72hrs">72hrs</option>
                      <option value="5_working_days">5 working days</option>
                      <option value="1week">I week</option>
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
                      value={formData.refundPolicy}
                      onChange={handleInputChange}
                      className={selectClass}
                      style={selectStyle}
                    >
                      <option value="">Select refund policy</option>
                      <option value="no_refunds">No Refunds</option>
                      <option value="accept_refunds">Accept Refunds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-[#dcdcdc]">
                      Period Until refund
                    </label>
                    <select
                      name="periodUntilRefund"
                      value={formData.periodUntilRefund}
                      onChange={handleInputChange}
                      className={selectClass}
                      style={selectStyle}
                    >
                      <option value="48hrs"> 48hrs</option>
                      <option value="72hrs">72hrs</option>
                      <option value="5_working_days">5 working days</option>
                      <option value="1week">I week</option>
                    </select>
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
                    {["fiat", "crypto", "both"].map((method) => (
                      <label
                        key={method}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 accent-purple-600"
                        />
                        <span className="text-sm">
                          {method === "fiat"
                            ? "Fiat currency (Local Currency)"
                            : method === "crypto"
                              ? "Cryptocurrency"
                              : "Both"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {(paymentMethod === "fiat" || paymentMethod === "both") && (
                  <div className="border border-[#747474] rounded-lg p-6 text-[#f2f2f2]">
                    <h3 className="text-base mb-2">Fiat Payment Information</h3>
                    <p className="text-sm mb-6">
                      Enter bank details to receive to payment in traditional
                      currencies
                    </p>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="flex justify-between text-sm mb-2 text-[#858585]">
                            Preferred Payout Method{" "}
                            <span className="">Required</span>
                          </label>
                          <select
                            name="preferredPayoutMethod"
                            value={formData.preferredPayoutMethod}
                            onChange={handleInputChange}
                            className={selectClass}
                            style={selectStyle}
                          >
                            <option value="">Select payout option</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="paypal">PayPal</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex justify-between text-sm mb-2 text-[#858585]">
                            Bank Country <span className="">Required</span>
                          </label>
                          <select
                            name="bankCountry"
                            value={formData.bankCountry}
                            onChange={handleInputChange}
                            className={selectClass}
                            style={selectStyle}
                          >
                            <option value="">Select city/town</option>
                            <option value="nigeria">Nigeria</option>
                            <option value="usa">United States</option>
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
                            value={formData.accountHolderName}
                            onChange={handleInputChange}
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
                            value={formData.accountNumber}
                            onChange={handleInputChange}
                            placeholder="Enter account details"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === "crypto" || paymentMethod === "both") && (
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
                        <div className="text-[#858585]">
                          <label className="block text-sm mb-2 text-[#858585]">
                            Supported Blockchain
                          </label>
                          <select
                            name="supportedBlockchain"
                            value={formData.supportedBlockchain}
                            onChange={handleInputChange}
                            className={selectClass}
                            style={selectStyle}
                          >
                            <option value="solana">Solana</option>
                            {/* <option value="ethereum">Ethereum</option>
                            <option value="bitcoin">Bitcoin</option> */}
                          </select>
                        </div>
                        <div>
                          <label className="flex justify-between text-sm mb-2 text-[#858585]">
                            Wallet Type <span className="">Required</span>
                          </label>
                          <select
                            name="walletType"
                            value={formData.walletType}
                            onChange={handleInputChange}
                            className={selectClass}
                            style={selectStyle}
                          >
                            <option value="">Select wallet type</option>
                            <option value="phantom">Phantom</option>
                            <option value="solflare">Solflare</option>
                            <option value="backpack">Backpack</option>
                            <option value="walletconnect">
                              Wallet Connect
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="flex justify-between text-sm mb-2 text-[#858585]">
                            Wallet Address <span className="">Required</span>
                          </label>
                          <input
                            type="text"
                            name="walletAddress"
                            value={formData.walletAddress}
                            onChange={handleInputChange}
                            placeholder="Enter wallet address"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="flex justify-between text-sm mb-2 text-[#858585]">
                            Preferred Payout Token{" "}
                            <span className="">Required</span>
                          </label>
                          <select
                            name="preferredPayoutToken"
                            value={formData.preferredPayoutToken}
                            onChange={handleInputChange}
                            className={selectClass}
                            style={selectStyle}
                          >
                            <option value="">
                              Select preferred payout token
                            </option>
                            <option value="usdt">USDT</option>
                            <option value="usdc">USDC</option>
                            <option value="sol">Solana</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-500 cursor-pointer hover:text-purple-400">
                        {/* <Info className="w-4 h-4" /><span>I don't have a wallet</span> */}
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
                      {productCategories.map(({ label, value }) => (
                        <button
                          key={value}
                          onClick={() =>
                            setSelectedCategories((prev) =>
                              prev.includes(value)
                                ? prev.filter((v) => v !== value)
                                : [...prev, value]
                            )
                          }
                          className={`px-6 py-3 rounded text-sm transition-colors ${
                            selectedCategories.includes(value)
                              ? "bg-purple-600 text-white"
                              : "bg-[#1a1a1a] text-[#858585] hover:bg-[#222]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                  </div>
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
                          onClick={() => setTargetAudience(value)}
                          className={`px-6 py-3 rounded text-sm transition-colors ${
                            targetAudience === value
                              ? "bg-purple-600 text-white"
                              : "bg-[#1a1a1a] text-[#858585] hover:bg-[#222]"
                          }`}
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
                    value={formData.localPricing}
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
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => console.log("Cancel")}
            className="px-8 py-2.5 border border-[#747474] rounded text-sm hover:bg-[#1a1a1a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-2.5 bg-purple-600 rounded text-sm hover:bg-purple-700 transition-colors"
          >
            {activeTab === "additional" ? "Preview" : "Next"}
          </button>
        </div>
      </main>

      {/* Footer */}
      <BuyerFooter />
    </div>
  );
};

export default SellerAccountSetup;
