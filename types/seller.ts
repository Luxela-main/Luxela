export type SellerSetupFormData = {
  // Business Information
  brandName: string;
  businessType: "individual" | "sole_proprietorship" | "llc" | "corporation" | "partnership" | "cooperative" | "non_profit" | "trust" | "joint_venture";
  businessAddress: string;
  officialEmail: string;
  phoneNumber: string;
  countryCode: string;
  country: string;
  state?: string;
  city?: string;
  socialMediaLinks?: Array<{ platform: string; username: string; url: string }>;
  fullName: string;
  idType: "passport" | "drivers_license" | "voters_card" | "national_id" | "business_license" | "tax_id" | "business_registration";
  idNumber?: string;
  idVerified?: boolean;
  bio?: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  logoPath?: string;
  bannerPath?: string;

  // Shipping Information
  shippingZone: string;
  cityTown: string;
  shippingAddress: string;
  returnAddress: string;
  shippingType: "domestic" | "international" | "both";
  estimatedShippingTime: "same_day" | "next_day" | "48hrs" | "72hrs" | "5_working_days" | "1_2_weeks" | "2_3_weeks" | "custom";
  refundPolicy: "no_refunds" | "48hrs" | "72hrs" | "5_working_days" | "1week" | "14days" | "30days" | "60days" | "store_credit";
  periodUntilRefund: "24hrs" | "48hrs" | "72hrs" | "5_working_days" | "1week" | "2weeks";

  // Additional Information
  productCategory: "men_clothing" | "women_clothing" | "men_shoes" | "women_shoes" | "accessories" | "merch" | "others";
  otherCategoryName?: string;
  targetAudience: "male" | "female" | "unisex" | "kids" | "teens";
  localPricing: "fiat" | "cryptocurrency" | "both";
};
