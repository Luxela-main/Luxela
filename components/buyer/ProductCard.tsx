import Link from "next/link";
import { Listing } from "@/types/listing";
import { ShoppingCart, Images } from "lucide-react";

export default function ProductCard({ product }: { product: Listing }) {
  const business = product.sellers?.seller_business?.[0];

  // colors
  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    colors = product.colors_available
      ? JSON.parse(product.colors_available)
      : [];
  } catch (e) {
    console.error("Error parsing colors:", e);
  }

  // sizes
  let sizes: string[] = [];
  try {
    sizes = product.sizes_json ? JSON.parse(product.sizes_json) : [];
  } catch (e) {
    console.error("Error parsing sizes:", e);
  }

  const isValidImage =
    typeof product.image === "string" &&
    product.image.length > 0 &&
    product.image !== "https://via.placeholder.com/400";

  return (
    <Link href={`/buyer/product/${product.id}`}>
      <div className="group bg-[#161616] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#9872DD]/50 transition-all">
<div className="h-96 bg-[#858585] p-5 flex relative">
  {isValidImage ? (
    <img
      src={product.image}
      alt={product.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <Images className="w-12 h-12 text-gray-600" />
    </div>
  )}

  {/* Limited Edition Badge */}
  {product.limited_edition_badge === "show_badge" && (
    <div className="absolute top-3 left-3 bg-purple-600 px-2.5 py-1 rounded">
      <span className="text-[#f2f2f2] text-sm font-bold uppercase">
        Limited
      </span>
    </div>
  )}
</div>

        <div className="p bg-black py-4">
          <p className="text-[#acacac] text-lg uppercase mb-1">
            {business?.brand_name}
          </p>

          <div className="flex items-center justify-between gap-3 mb-3 min-h-5">
            <h3 className="text-[#f2f2f2] capitalize font-medium text-base line-clamp-2 leading-snug min-h-10">
              {product.title}
            </h3>
            {/* Color */}
            {colors.length > 0 && (
              <div className="flex gap-1.5">
                {colors.slice(0, 4).map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 relative rounded-full border border-gray-700"
                    style={{
                      backgroundColor: color.colorHex || "#666",
                    }}
                    title={color.colorName}
                  />
                ))}
                {colors.length > 4 && (
                  <span className="text-gray-500 text-xs">
                    +{colors.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Price & Cart */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#f2f2f2] text-sm">
                {product.currency}{" "}
                {(product.price_cents / 100).toLocaleString()}
              </div>
              {product.quantity_available <= 5 &&
                product.quantity_available > 0 && (
                  <p className="text-orange-500 text-[10px] mt-0.5">
                    Only {product.quantity_available} left
                  </p>
                )}
            </div>

            <div className="bottom-3 right-3">
              <button className="bg-purple-600 hover:bg-gray-100 p-2.5 shadow-lg">
                <ShoppingCart className="w-4 h-4 text-[#f2f2f2]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
