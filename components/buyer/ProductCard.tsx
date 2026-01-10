import Link from "next/link";
import { Listing } from "@/types/listing";
import { ShoppingCart, Images } from "lucide-react";

export default function ProductCard({ product }: { product: Listing }) {
  const business = product.sellers?.seller_business?.[0];

  // Parse colors safely
  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    colors = product.colors_available
      ? JSON.parse(product.colors_available)
      : [];
  } catch (e) {
    console.error("Error parsing colors:", e);
  }

  const isValidImage =
    typeof product.image === "string" &&
    product.image.length > 0 &&
    !product.image.includes("placeholder.com");

  return (
    <div className="w-full bg-gray-800 rounded-lg overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-purple-500/20">

      <Link href={`/buyer/product/${product.id}`}>
        <div className="relative h-96 bg-black flex items-center justify-center group cursor-pointer">
          {isValidImage ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <Images className="w-12 h-12 text-gray-600 opacity-50" />
            </div>
          )}

          {/* Luxela Badge */}
          {product.limited_edition_badge === "show_badge" && (
            <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded text-xs font-semibold text-gray-900">
              Limited
            </div>
          )}
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-6">
        {/* Brand Name */}
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">
          {business?.brand_name || "Luxela"}
        </div>

        {/* Product Name & Colors */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-xl font-semibold truncate">
            {product.title}
          </h3>
          {/* Color Options - Overlapping circles */}
          <div className="flex items-center -space-x-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-gray-800 cursor-pointer hover:scale-110 transition-transform z-30"></div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-green-400 border-2 border-gray-800 cursor-pointer hover:scale-110 transition-transform z-20"></div>
            <div className="w-7 h-7 rounded-full bg-gray-950 border-2 border-gray-800 cursor-pointer hover:scale-110 transition-transform z-10"></div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between">
          {/* Price */}
          <div className="flex items-center gap-2">
            <img src="/solana.svg" alt="Solana" className="w-8 h-8" />
            <span className="text-white text-lg font-semibold">
              {(product.price_cents / 100).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={(e) => {
                e.preventDefault();

                console.log("Add to cart:", product.id);
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 p-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
