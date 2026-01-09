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

  const brandSlug =
    business.brand_name?.toLowerCase().replace(/\s+/g, "-") || "";

  // Mock vendor stats
  const vendorRating = 4.8;
  const totalSales = 156;

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 sticky top-6">
      <div className="w-full flex justify-between items-center text-sm mb-4">
        <h2 className="font-medium w-full">Vendor details:</h2>
        {/* View Products Button */}
        <Link
          href={`/buyer/brand/${brandSlug}`}
          className="w-full bg-black text-purple-600  py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group"
        >
          View products
          <span>
            {" "}
            <ArrowRight className="w-4 h-4" />
          </span>{" "}
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <img
          src={business.store_logo}
          alt={business.brand_name}
          className="w-16 h-16 rounded-full object-cover bg-gray-800"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{business.brand_name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#9872DD] text-[#9872DD]" />
              <span className="text-sm font-medium">{vendorRating}</span>
            </div>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-400">{totalSales} sales</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold mb-1">{vendorRating}</div>
          <div className="text-xs text-gray-400">Rating</div>
        </div>
        <div className="bg-black/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold mb-1">{totalItems}</div>
          <div className="text-xs text-gray-400">Items</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-gray-800 space-y-3 text-sm">
        {business.business_type && (
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white capitalize">
              {business.business_type}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">Response time:</span>
          <span className="text-white">Within 24hrs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Member since:</span>
          <span className="text-white">2024</span>
        </div>
      </div>
    </div>
  );
}
