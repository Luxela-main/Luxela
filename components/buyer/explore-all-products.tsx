'use client'

import { useState, useEffect } from "react"

interface Product {
  id: number
  name: string
  brand: string
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

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Baggy Jeans",
    brand: "BAZ",
    price: "0.06",
    currency: "SOL",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop",
    category: "Denim",
    isLiked: false
  },
  {
    id: 2,
    name: "BAZ Hoodie",
    brand: "BAZ",
    price: "0.06",
    currency: "SOL",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop",
    category: "Hoodies",
    isLiked: true
  },
  {
    id: 3,
    name: "Bat Tee Black Print",
    brand: "BAZ",
    price: "0.04",
    currency: "SOL",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop",
    category: "T-Shirts",
    isLiked: false
  },
  {
    id: 4,
    name: "Bat Tee Black Print",
    brand: "BAZ",
    price: "0.6",
    currency: "SOL",
    image: "https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=300&h=400&fit=crop",
    category: "T-Shirts",
    isLiked: false
  },
  {
    id: 5,
    name: "Bat Tee Edit",
    brand: "BAZ",
    price: "0.4",
    currency: "SOL",
    image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=300&h=400&fit=crop",
    category: "T-Shirts",
    isLiked: false
  },
  {
    id: 6,
    name: "Track Pants",
    brand: "BAZ",
    price: "0.06",
    currency: "SOL",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop",
    category: "Pants",
    isLiked: true
  },
  {
    id: 7,
    name: "Cargo Pants",
    brand: "BAZ",
    price: "0.06",
    currency: "SOL",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=400&fit=crop",
    category: "Pants",
    isLiked: false
  },
  {
    id: 8,
    name: "Mantis Uniform",
    brand: "BAZ",
    price: "0.06",
    currency: "SOL",
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=400&fit=crop",
    category: "Uniforms",
    isLiked: false
  }
]

const SORT_OPTIONS: SortOption[] = [
  "Sort by Price (Low to High)",
  "Sort by Price (High to Low)",
  "Sort by Name (A-Z)",
  "Sort by Name (Z-A)",
  "Sort by Newest",
  "Sort by Popular"
]

const ExploreAllProducts = () => {
  const [products, setProducts] = useState(PRODUCTS)
  const [sortBy, setSortBy] = useState("Sort by Price (Low to High)")
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [visibleProducts, setVisibleProducts] = useState<number[]>([])
  const [visibleCount, setVisibleCount] = useState(4) 

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


  return (
    <div className="mt-16">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="md:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Explore All</h1>
            <a
              href="#"
              className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors"
            >
              See All
            </a>
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
                    <button className="cursor-pointer bg-[#9872DD] hover:bg-[#8451E1] text-white p-2 rounded-lg transition-colors duration-200 group/cart">
                      <svg
                        className="w-4 h-4 group-hover/cart:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3zM16 16a1 1 0 11-2 0 1 1 0 012 0zM9 16a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
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

export default ExploreAllProducts