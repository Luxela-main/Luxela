import { Listing } from "@/types/listing";

interface ProductDescriptionProps {
  product: Listing;
}

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

        {/* Material */}
        {product.material_composition && (
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
              Material
            </h3>
            <p className="text-gray-300 text-base capitalize">
              {product.material_composition}
            </p>
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

            {product.release_duration && (
              <div>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
                  Release Duration
                </h3>
                <p className="text-gray-300 text-base">{product.release_duration}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}