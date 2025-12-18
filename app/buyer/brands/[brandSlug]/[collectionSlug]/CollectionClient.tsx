"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  currency: string;
  image: string;
  isLiked: boolean;
  variants: string[];
}

type SortOption =
  | "Sort by Price (Low to High)"
  | "Sort by Price (High to Low)"
  | "Sort by Name (A-Z)"
  | "Sort by Name (Z-A)";

const PRODUCTS_PER_PAGE = 12;

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "B/W Wrangler Raglan",
    price: 0.06,
    currency: "SOL",
    image:
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
    isLiked: false,
    variants: ["blue", "black", "gray"],
  },
  {
    id: 2,
    name: "Wrangler Denim Jacket",
    price: 0.08,
    currency: "SOL",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
    isLiked: true,
    variants: ["blue", "black"],
  },
];

const getVariantColor = (variant: string) => {
  const map: Record<string, string> = {
    blue: "bg-blue-500",
    black: "bg-black",
    gray: "bg-gray-500",
    navy: "bg-blue-900",
    khaki: "bg-yellow-700",
    olive: "bg-green-800",
    red: "bg-red-500",
    brown: "bg-amber-800",
  };

  return map[variant] ?? "bg-gray-400";
};

export default function CollectionClient() {
  const [products, setProducts] = useState(PRODUCTS);
  const [sortBy, setSortBy] =
    useState<SortOption>("Sort by Price (Low to High)");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handleSort = (option: SortOption) => {
    const sorted = [...products];

    switch (option) {
      case "Sort by Price (Low to High)":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "Sort by Price (High to Low)":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "Sort by Name (A-Z)":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Sort by Name (Z-A)":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    setProducts(sorted);
    setSortBy(option);
  };

  const toggleLike = (id: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isLiked: !p.isLiked } : p
      )
    );
  };

  return (
    <div className="text-white">
      {/* Sort Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-400 text-sm">
          Showing {paginatedProducts.length} of {products.length} products
        </p>

        <select
          value={sortBy}
          onChange={(e) =>
            handleSort(e.target.value as SortOption)
          }
          className="bg-neutral-800 px-4 py-2 rounded-lg text-sm border border-neutral-700"
        >
          <option>Sort by Price (Low to High)</option>
          <option>Sort by Price (High to Low)</option>
          <option>Sort by Name (A-Z)</option>
          <option>Sort by Name (Z-A)</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {paginatedProducts.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#161616] rounded-xl border border-gray-800"
          >
            <div className="relative aspect-[3/4]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover rounded-t-xl"
              />
              <button
                onClick={() => toggleLike(product.id)}
                className="absolute top-3 right-3"
              >
                <Heart
                  className={
                    product.isLiked
                      ? "text-red-500 fill-current"
                      : "text-white"
                  }
                />
              </button>
            </div>

            <div className="p-4">
              <h3 className="text-sm mb-2">{product.name}</h3>

              <div className="flex gap-2 mb-3">
                {product.variants.map((v) => (
                  <span
                    key={v}
                    className={`w-4 h-4 rounded-full ${getVariantColor(
                      v
                    )}`}
                  />
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold">
                  {product.price} {product.currency}
                </span>
                <button className="bg-[#9872DD] p-2 rounded-lg">
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}