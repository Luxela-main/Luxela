'use client'

import Link from "next/link"
import { useState, useEffect } from "react"

interface Product {
  id: number
  name: string
  brand: string
  price: number
  currency: string
  image: string
  category: string
  isLiked: boolean
  variants: string[]
}

interface BrandSection {
  brandName: string
  products: Product[]
}

const BRAND_CATALOG: BrandSection[] = [
  {
    brandName: "BAZ",
    products: [
      {
        id: 1,
        name: "Baggy Jeans",
        brand: "BAZ",
        price: 45,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop",
        category: "Denim",
        isLiked: false,
        variants: ["blue", "black", "gray"]
      },
      {
        id: 2,
        name: "BAZ Hoodie",
        brand: "BAZ",
        price: 32,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop",
        category: "Hoodies",
        isLiked: true,
        variants: ["white", "black", "gray"]
      },
      {
        id: 3,
        name: "Bat Tee Black Print",
        brand: "BAZ",
        price: 28,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop",
        category: "T-Shirts",
        isLiked: false,
        variants: ["black", "navy", "gray"]
      },
      {
        id: 4,
        name: "Baseball Tee",
        brand: "BAZ",
        price: 35,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=300&h=400&fit=crop",
        category: "T-Shirts",
        isLiked: false,
        variants: ["white", "black", "red"]
      }
    ]
  },
  {
    brandName: "HONORAH",
    products: [
      {
        id: 5,
        name: "Silk Dress",
        brand: "HONORAH",
        price: 89,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop",
        category: "Dresses",
        isLiked: true,
        variants: ["pink", "cream", "black"]
      },
      {
        id: 6,
        name: "Evening Gown",
        brand: "HONORAH",
        price: 125,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=300&h=400&fit=crop",
        category: "Dresses",
        isLiked: false,
        variants: ["burgundy", "navy", "black"]
      },
      {
        id: 7,
        name: "Cocktail Dress",
        brand: "HONORAH",
        price: 95,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop",
        category: "Dresses",
        isLiked: false,
        variants: ["red", "black", "gold"]
      },
      {
        id: 8,
        name: "Summer Dress",
        brand: "HONORAH",
        price: 67,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=300&h=400&fit=crop",
        category: "Dresses",
        isLiked: true,
        variants: ["coral", "white", "blue"]
      }
    ]
  },
  {
    brandName: "RIO JEWELS",
    products: [
      {
        id: 9,
        name: "Diamond Ring",
        brand: "RIO JEWELS",
        price: 450,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=400&fit=crop",
        category: "Rings",
        isLiked: false,
        variants: ["gold", "silver", "rose-gold"]
      },
      {
        id: 10,
        name: "Luxury Watch",
        brand: "RIO JEWELS",
        price: 280,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=400&fit=crop",
        category: "Watches",
        isLiked: true,
        variants: ["black", "silver", "gold"]
      },
      {
        id: 11,
        name: "Gold Chain",
        brand: "RIO JEWELS",
        price: 180,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&h=400&fit=crop",
        category: "Chains",
        isLiked: false,
        variants: ["gold", "silver", "rose-gold"]
      },
      {
        id: 12,
        name: "Pearl Necklace",
        brand: "RIO JEWELS",
        price: 320,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=300&h=400&fit=crop",
        category: "Necklaces",
        isLiked: false,
        variants: ["white", "cream", "black"]
      }
    ]
  },
  {
    brandName: "SHU",
    products: [
      {
        id: 13,
        name: "Leather Boots",
        brand: "SHU",
        price: 125,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop",
        category: "Boots",
        isLiked: true,
        variants: ["brown", "black", "tan"]
      },
      {
        id: 14,
        name: "High Heels",
        brand: "SHU",
        price: 89,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop",
        category: "Heels",
        isLiked: false,
        variants: ["black", "nude", "red"]
      },
      {
        id: 15,
        name: "Sneakers",
        brand: "SHU",
        price: 95,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=400&fit=crop",
        category: "Sneakers",
        isLiked: false,
        variants: ["white", "black", "gray"]
      },
      {
        id: 16,
        name: "Oxford Shoes",
        brand: "SHU",
        price: 115,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=400&fit=crop",
        category: "Formal",
        isLiked: false,
        variants: ["brown", "black", "burgundy"]
      }
    ]
  }
]

const getVariantColor = (variant: string): string => {
  const colorMap: { [key: string]: string } = {
    'blue': 'bg-blue-500',
    'black': 'bg-black',
    'gray': 'bg-gray-500',
    'white': 'bg-white border-gray-300',
    'navy': 'bg-blue-900',
    'red': 'bg-red-500',
    'pink': 'bg-pink-400',
    'cream': 'bg-yellow-100 border-gray-300',
    'burgundy': 'bg-red-900',
    'gold': 'bg-yellow-500',
    'coral': 'bg-orange-400',
    'silver': 'bg-gray-300',
    'rose-gold': 'bg-rose-400',
    'brown': 'bg-amber-800',
    'tan': 'bg-yellow-700',
    'nude': 'bg-pink-200',
  }
  return colorMap[variant] || 'bg-gray-400'
}

const BRANDS_PER_PAGE = 2

const BrandCatalogGrid = () => {
  const [visibleProducts, setVisibleProducts] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(BRAND_CATALOG.length / BRANDS_PER_PAGE)
  const startIndex = (currentPage - 1) * BRANDS_PER_PAGE
  const paginatedBrands = BRAND_CATALOG.slice(startIndex, startIndex + BRANDS_PER_PAGE)

  // Animate products on load
  useEffect(() => {
    const allProducts = BRAND_CATALOG.flatMap(section => section.products)
    const timer = setTimeout(() => {
      allProducts.forEach((_, index) => {
        setTimeout(() => {
          setVisibleProducts(prev => [...prev, index])
        }, index * 50) // Faster stagger for many items
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  const toggleLike = (productId: number) => {
    // This would typically update your state management or API
    console.log(`Toggling like for product ${productId}`)
  }

  let productIndex = 0

  return (
    <div className="bg-black min-h-screen w-full">
      <div className="px-6 py-8 layout">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">All Brands</h1>
          <div className="flex items-center gap-4">
            <button className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors">
              Filter
            </button>
            <button className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors">
              Sort
            </button>
          </div>
        </div>

        {/* Brand Sections */}
        {paginatedBrands.map((brandSection) => (
          <div key={brandSection.brandName} className="mb-12">
            {/* Brand Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{brandSection.brandName}</h2>
                <span className="text-sm text-gray-400">({brandSection.products.length} items)</span>
              </div>
              <Link href={"/buyer/brands/brand"} className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors flex items-center gap-1">
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {brandSection.products.map((product) => {
                const currentIndex = productIndex++
                return (
                  <div
                    key={product.id}
                    className={`group transition-all duration-700 ease-out ${visibleProducts.includes(currentIndex)
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                      }`}
                  >
                    {/* Product Card */}
                    <div className="bg-[#161616] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-800 hover:border-[#9872DD]/30">
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
                        <h3 className="text-white font-medium text-sm mb-3">
                          {product.name}
                        </h3>

                        {/* Color Variants */}
                        <div className="flex items-center gap-2 mb-3">
                          {product.variants.slice(0, 3).map((variant, index) => (
                            <div
                              key={variant}
                              className={`w-4 h-4 rounded-full ${getVariantColor(variant)} ${variant === 'white' || variant === 'cream' ? 'border border-gray-400' : ''
                                } ${index === 0 ? 'ring-2 ring-purple-400 ring-offset-1 ring-offset-[#161616]' : ''}`}
                            ></div>
                          ))}
                        </div>

                        {/* Price and Cart Button Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-white font-bold text-lg">
                              {product.price}
                            </span>
                            <span className="text-white font-bold text-lg">
                              {product.currency}
                            </span>
                          </div>

                          {/* Purple Cart Button */}
                          <button className="bg-[#9872DD] hover:bg-[#8451E1] text-white p-2.5 rounded-lg transition-colors duration-200 group/cart">
                            <svg
                              className="w-4 h-4 group-hover/cart:scale-110 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3zM16 16a1 1 0 11-2 0 1 1 0 012 0zM9 16a1 1 0 11-2 0 1 1 0 012 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Load More Button */}
        {/* <div className="flex justify-center mt-12">
          <button className="bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#8451E1] hover:via-[#7240D0] hover:to-[#4A1E8F] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Load More Brands
          </button>
        </div> */}
        {/* Pagination Controls */}
        <div className="flex items-center justify-end mt-8 gap-2">
          {/* Prev */}
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-lg ${currentPage === 1
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-[#161616] text-white hover:bg-[#222]"
              }`}
          >
            Prev
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-4 py-1 rounded-md ${currentPage === pageNum
                ? "bg-[#9872DD] text-white"
                : "text-gray-300 hover:bg-[#222]"
                }`}
            >
              {pageNum}
            </button>
          ))}

          {/* Next */}
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-lg ${currentPage === totalPages
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-[#161616] text-white hover:bg-[#222]"
              }`}
          >
            Next
          </button>
        </div>

        {/* Page Info */}
        <div className="flex justify-end mt-4">
          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages} • Showing {paginatedBrands.length} of {BRAND_CATALOG.length} brands
          </span>
        </div>
      </div>
    </div>
  )
}

export default BrandCatalogGrid