import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

interface VendorDetailsProps {
  business: any;
  totalItems: number;
}

export default function VendorDetails({
  business,
  totalItems,
}: VendorDetailsProps) {
  if (!business) return null;

  // Use the actual brand slug from database
  const brandSlug = business?.slug || business?.brand_slug || "";

  // Mock vendor stats
  const vendorRating = 4.8;
  const totalSales = 156;

  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] rounded-2xl border border-[#1a1a1a] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-light tracking-widest uppercase text-white flex items-center gap-3">
          <span className="w-1 h-6 bg-gradient-to-b from-[#8451E1] to-[#7240D0] rounded-full"></span>
          Vendor Details
        </h2>
        {/* View Products Button */}
        {brandSlug && (
          <Link
            href={`/buyer/brand/${brandSlug}${business?.seller_id ? `?sellerId=${business.seller_id}` : ''}`}
            className="text-[#8451E1] hover:text-[#9665F5] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 group"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Vendor Info Card */}
      <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#1a1a1a]">
        {business.store_logo ? (
          <img
            src={business.store_logo}
            alt={business.brand_name}
            className="w-20 h-20 rounded-xl object-cover border border-[#1a1a1a]"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#8451E1] to-[#7240D0] flex items-center justify-center border border-[#1a1a1a]">
            <span className="text-white text-lg font-light">
              {business.brand_name?.charAt(0).toUpperCase() || "S"}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-xl mb-2 text-white">
            {business.brand_name}
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1 rounded-full">
              <Star className="w-4 h-4 fill-[#8451E1] text-[#8451E1]" />
              <span className="text-sm font-semibold text-white">
                {vendorRating}
              </span>
            </div>
            <span className="text-sm text-gray-400 font-medium">
              •
            </span>
            <span className="text-sm text-gray-400 font-medium">
              {totalSales} sales
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-[#1a1a1a]">
        <div className="bg-[#1a1a1a] rounded-xl p-5 text-center border border-[#242424]">
          <div className="text-2xl font-light mb-1 text-white">{vendorRating}</div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Rating
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-5 text-center border border-[#242424]">
          <div className="text-2xl font-light mb-1 text-white">{totalItems}</div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Products
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-3 text-sm">
        {business.business_type && (
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500 font-medium">Business Type:</span>
            <span className="text-gray-300 font-semibold capitalize">
              {business.business_type}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center py-2 border-t border-[#1a1a1a] pt-3">
          <span className="text-gray-500 font-medium">Response Time:</span>
          <span className="text-gray-300 font-semibold">Within 24hrs</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-500 font-medium">Member Since:</span>
          <span className="text-gray-300 font-semibold">2024</span>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
          <span>✓</span>
          <span>Verified Seller on Luxela</span>
        </div>
      </div>
    </div>
  );
}