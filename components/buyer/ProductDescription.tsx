import { Listing } from "@/types/listing";
import { FileText, Film, Badge, AlertCircle, Check, X, Clock } from "lucide-react";

interface ProductDescriptionProps {
  product: Listing;
}

// Format enum values to readable text
const formatEnumValue = (value: string | null | undefined): string => {
  if (!value) return "N/A";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ProductDescription({
  product,
}: ProductDescriptionProps) {
  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] rounded-2xl border border-[#1a1a1a] text-sm p-8">
      <h2 className="text-lg font-light mb-8 tracking-widest uppercase text-white flex items-center gap-3">
        <span className="w-1 h-6 bg-gradient-to-b from-[#8451E1] to-[#7240D0] rounded-full"></span>
        Product Description
      </h2>

      <div className="space-y-6">
        {/* Product Name */}
        <div>
          <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
            Product Name
          </h3>
          <p className="text-white text-base leading-relaxed">{product.title}</p>
        </div>

        {/* SKU & Barcode */}
        {(product.sku || product.barcode) && (
          <div className="grid md:grid-cols-2 gap-6">
            {product.sku && (
              <div>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
                  SKU
                </h3>
                <p className="text-gray-300 text-sm font-mono bg-[#161616]/50 px-3 py-2 rounded border border-[#1a1a1a]">
                  {product.sku}
                </p>
              </div>
            )}
            {product.barcode && (
              <div>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
                  Barcode
                </h3>
                <p className="text-gray-300 text-sm font-mono bg-[#161616]/50 px-3 py-2 rounded border border-[#1a1a1a]">
                  {product.barcode}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Meta Description */}
        {product.meta_description && (
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
              SEO Description
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed italic">
              {product.meta_description}
            </p>
          </div>
        )}

        {/* Material */}
        {product.material_composition && (
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
              Material Composition
            </h3>
            <p className="text-gray-300 text-base capitalize">
              {product.material_composition}
            </p>
          </div>
        )}

        {/* Care Instructions */}
        {product.care_instructions && (
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Care Instructions
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {product.care_instructions}
            </p>
          </div>
        )}

        {/* Video URL */}
        {product.video_url && (
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Film className="w-4 h-4" /> Product Video
            </h3>
            <a
              href={product.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-[#8451E1]/20 hover:bg-[#8451E1]/30 text-[#8451E1] text-sm font-semibold rounded border border-[#8451E1]/30 transition-colors"
            >
              Watch Video →
            </a>
          </div>
        )}

        {/* Main Description */}
        <div className="border-t border-[#1a1a1a] pt-6 space-y-4">
          {product.description && (
            <div>
              <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">
                About This Product
              </h3>
              <p className="text-gray-300 leading-relaxed text-base">
                {product.description}
              </p>
            </div>
          )}

          {/* Additional Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {/* Limited Edition Badge */}
            {product.limited_edition_badge === "show_badge" && (
              <div>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Badge className="w-4 h-4 text-[#8451E1]" /> Limited Edition
                </h3>
                <p className="text-[#8451E1] text-sm font-semibold">
                  ✨ Exclusive Limited Edition
                </p>
              </div>
            )}

            {/* Release Duration */}
            {product.release_duration && (
              <div>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Release Duration
                </h3>
                <p className="text-gray-300 text-base">{product.release_duration}</p>
              </div>
            )}

            {/* Supply Capacity */}
            {product.supply_capacity && (
              <div>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
                  Supply Capacity
                </h3>
                <p className="text-gray-300 capitalize text-base">
                  {product.supply_capacity === "limited"
                    ? "Limited Supply Available"
                    : "Unlimited Supply"}
                </p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}