export type SellerSetupFormData = {
  fiatPayoutMethod?: string | number | readonly string[] | undefined;
  // Business Information
  brandName: string;
  businessType: string;
  businessAddress: string;
  officialEmail: string;
  phoneNumber: string;
  countryCode: string;
  country: string;
  socialMedia: string;
  fullName: string;
  idType: string;
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
  shippingType: string;
  estimatedShippingTime: string;
  refundPolicy: string;
  periodUntilRefund: string;

  // Payment Information
  paymentMethod: string;
  preferredPayoutMethod: string;
  bankCountry: string;
  accountHolderName: string;
  accountNumber: string;
  supportedBlockchain: string;
  walletType: string;
  walletAddress: string;
  preferredPayoutToken: string;

  // Additional Information
  productCategory:string;
  targetAudience: "male" | "female" | "unisex" | "";
  localPricing: string;
    idNumber?: string;
  idVerified?: boolean;
};