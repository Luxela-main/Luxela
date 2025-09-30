'use client'

import { ShoppingCart } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

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

const WranglerCollection = () => {
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
    <div className="">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="md:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-{#DCDCDC}">Wrangler Collections</h1>
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
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-neutral-900 p-4 rounded-xl shadow hover:shadow-lg group max-w-[320px] h-[350px] flex flex-col justify-between duration-300 ease-in-out"
              >
                <Image
                  src={product.image}
                  width={150}
                  height={180}
                  alt={product.name}
                  className="rounded-lg mb-3 w-full h-[200px] object-cover group-hover:scale-[1.03] duration-300 ease-in-out"
                />

                <div className="flex-1">
                  <p className="text-gray-400 text-sm">{product.brand}</p>
                  <h3 className="font-semibold">{product.name}</h3>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold text-lg">
                      {product.price}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {product.currency}
                    </span>
                  </div>
                  {/* Add to Cart Button */}
                  <button className="cursor-pointer bg-gradient-to-b text-sm from-[#9872DD] via-[#8451E1] to-[#5C2EAF]  
                                     hover:bg-[#8451E1] text-white px-4 py-2 rounded-lg transition-colors duration-200 group/cart">
                    <ShoppingCart size={16} className="inline-block" />
                  </button>
                </div>
              </motion.div>
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

export default WranglerCollection