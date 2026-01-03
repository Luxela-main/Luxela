'use client'

import { ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"
import { PRODUCTS } from "@/components/lib/products"
import Link from "next/link"

interface Product {
  id: number
  name: string
  brand: string
  brandSlug: string 
  price: string
  currency: string
  image: string
  category: string
  isLiked: boolean
}

type SortOption =
  | "Sort by Price (Low to High)"
  | "Sort by Price (High to Low)"
  | "Sort by Name (A-Z)"
  | "Sort by Name (Z-A)"
  | "Sort by Newest"
  | "Sort by Popular"

const SORT_OPTIONS: SortOption[] = [
  "Sort by Price (Low to High)",
  "Sort by Price (High to Low)",
  "Sort by Name (A-Z)",
  "Sort by Name (Z-A)",
  "Sort by Newest",
  "Sort by Popular"
]

interface ExploreAllProductsProps {
  brandSlug?: string 
}

const ExploreAllProducts = ({ brandSlug }: ExploreAllProductsProps) => {
  // Filter products by brand if brandSlug is provided
  const filteredProducts = brandSlug 
    ? PRODUCTS.filter(product => product.brandSlug === brandSlug)
    : PRODUCTS

  const [products, setProducts] = useState(filteredProducts)
  const [sortBy, setSortBy] = useState("Sort by Price (Low to High)")
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [visibleProducts, setVisibleProducts] = useState<number[]>([])
  const [visibleCount, setVisibleCount] = useState(12)

  // Update products when brandSlug changes
  useEffect(() => {
    const filtered = brandSlug 
      ? PRODUCTS.filter(product => product.brandSlug === brandSlug)
      : PRODUCTS
    setProducts(filtered)
    setVisibleCount(12) 
  }, [brandSlug])

  // Animate products on load
  useEffect(() => {
    setVisibleProducts([])
    const timer = setTimeout(() => {
      products.slice(0, visibleCount).forEach((_, index) => {
        setTimeout(() => {
          setVisibleProducts(prev => [...prev, index])
        }, index * 100)
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [products, visibleCount])

  const toggleLike = (productId: number) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, isLiked: !product.isLiked }
          : product
      )
    )
  }

  const handleSort = (sortOption: SortOption) => {
    let sortedProducts: Product[] = [...products]

    switch (sortOption) {
      case "Sort by Price (Low to High)":
        sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
      case "Sort by Price (High to Low)":
        sortedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        break
      case "Sort by Name (A-Z)":
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "Sort by Name (Z-A)":
        sortedProducts.sort((a, b) => b.name.localeCompare(a.name))
        break
      default:
        break
    }

    setProducts(sortedProducts)
    setSortBy(sortOption)
    setShowSortDropdown(false)
    setVisibleProducts([])

    // Re-trigger animation
    setTimeout(() => {
      sortedProducts.slice(0, visibleCount).forEach((_, index) => {
        setTimeout(() => {
          setVisibleProducts((prev: number[]) => [...prev, index])
        }, index * 50)
      })
    }, 100)
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 4, products.length))
  }

  // Show message if no products found for the brand
  if (brandSlug && products.length === 0) {
    return (
      <div className="mt-16">
        <div className="px-6 py-8">
          <div className="text-center py-12">
            <p className="text-gray-400">No products found for this brand.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="md:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">
              {brandSlug ? `All ${products[0]?.brand} Products` : 'Explore All'}
            </h1>
            {!brandSlug && (
              <a
                href="#"
                className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors"
              >
                See All
              </a>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="mt-6 md:mt-0 relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 bg-[#161616] text-white text-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-[#9872DD] transition-colors"
            >
              <span>{sortBy}</span>
              <svg
                className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSortDropdown && (
              <div className="absolute top-full mt-2 w-64 bg-[#161616] border border-gray-700 rounded-lg shadow-xl z-10">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSort(option)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-[#222] transition-colors first:rounded-t-lg last:rounded-b-lg ${sortBy === option ? 'text-[#9872DD] bg-[#9872DD]/10' : 'text-white'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, visibleCount).map((product, index) => (
            <div
              key={product.id}
              className={`group transition-all duration-700 ease-out ${visibleProducts.includes(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
                }`}
            >
              {/* Product Card */}
                            <Link key={product.id} href={`/buyer/product/${product.id}`}>
                             <div className="bg-[#161616] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.01] border border-gray-800 hover:border-[#9872DD]/30">
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Like Button */}
                  <button
                    onClick={() => toggleLike(product.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-all duration-200"
                  >
                    <svg
                      className={`w-5 h-5 transition-colors ${product.isLiked ? 'text-red-500 fill-current' : 'text-white'
                        }`}
                      fill={product.isLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Brand */}
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                    {product.brand}
                  </p>

                  {/* Product Name */}
                  <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold text-lg">
                        {product.price}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {product.currency}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button className="cursor-pointer bg-gradient-to-b text-sm from-[#9872DD] via-[#8451E1] to-[#5C2EAF]  hover:bg-[#8451E1] text-white px-4 py-2 rounded-lg transition-colors duration-200 group/cart">
                      <ShoppingCart size={16} className="inline-block " />
                    </button>
                  </div>
                </div>
              </div>

</Link>
             
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleCount < products.length && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleLoadMore}
              className="bg-gradient-to-b text-sm from-[#9872DD] via-[#8451E1] to-[#5C2EAF] text-white px-8 py-3 rounded-lg font-medium hover:from-[#8451E1] hover:via-[#7240D0] hover:to-[#4A1E8F] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
            >
              Load More Products
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showSortDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowSortDropdown(false)}
        />
      )}
    </div>
  )
}

export default ExploreAllProducts;
