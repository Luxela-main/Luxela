'use client'

import Link from "next/link"
import { useState, useMemo } from "react"
import { useListings } from '@/context/ListingsContext'
import { X } from 'lucide-react'

const BRANDS_PER_PAGE = 5

interface BrandSection {
  brandName: string
  brandSlug: string
  storeLogo: string
  products: any[]
}

type SortOption = 'name-asc' | 'name-desc' | 'products-high' | 'products-low'

const BrandCatalogGrid = () => {
  const { listings, loading } = useListings()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Group listings by brand
  const brandSections = useMemo(() => {
    const brandMap = new Map<string, any[]>()

    listings.forEach(listing => {
      const business = listing.sellers?.seller_business?.[0]
      if (business?.brand_name) {
        const brandName = business.brand_name
        if (!brandMap.has(brandName)) {
          brandMap.set(brandName, [])
        }
        brandMap.get(brandName)?.push(listing)
      }
    })

    return Array.from(brandMap.entries()).map(([brandName, products]) => ({
      brandName,
      brandSlug: brandName.toLowerCase().replace(/\s+/g, '-'),
      storeLogo: products[0]?.sellers?.seller_business?.[0]?.store_logo || '',
      products
    }))
  }, [listings])

  // unique categories for filtering
  const availableCategories = useMemo(() => {
    const categories = new Set<string>()
    listings.forEach(listing => {
      if (listing.category) {
        categories.add(listing.category)
      }
    })
    return Array.from(categories).sort()
  }, [listings])

  // Filter brands by category
  const filteredBrands = useMemo(() => {
    if (selectedCategories.length === 0) return brandSections

    return brandSections
      .map(brand => ({
        ...brand,
        products: brand.products.filter(product => 
          selectedCategories.includes(product.category)
        )
      }))
      .filter(brand => brand.products.length > 0)
  }, [brandSections, selectedCategories])

  // Sort brands
  const sortedBrands = useMemo(() => {
    const brands = [...filteredBrands]
    
    switch (sortBy) {
      case 'name-asc':
        return brands.sort((a, b) => a.brandName.localeCompare(b.brandName))
      case 'name-desc':
        return brands.sort((a, b) => b.brandName.localeCompare(a.brandName))
      case 'products-high':
        return brands.sort((a, b) => b.products.length - a.products.length)
      case 'products-low':
        return brands.sort((a, b) => a.products.length - b.products.length)
      default:
        return brands
    }
  }, [filteredBrands, sortBy])

  const parseColors = (colorsJson: string | null) => {
    try {
      return colorsJson ? JSON.parse(colorsJson) : []
    } catch {
      return []
    }
  }

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toLocaleString()
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(sortedBrands.length / BRANDS_PER_PAGE)
  const startIndex = (currentPage - 1) * BRANDS_PER_PAGE
  const paginatedBrands = sortedBrands.slice(startIndex, startIndex + BRANDS_PER_PAGE)

  if (loading) {
    return (
      <div className="bg-black min-h-screen w-full flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen w-full px-4">
      <div className="px-6 py-8 layout">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">All Brands</h1>
            {selectedCategories.length > 0 && (
              <p className="text-gray-400 text-sm mt-1">
                Filtered by {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu)
                  setShowSortMenu(false)
                }}
                className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors flex items-center gap-2"
              >
                Filter
                {selectedCategories.length > 0 && (
                  <span className="bg-[#9872DD] text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#161616] border border-gray-800 rounded-lg shadow-xl p-4 min-w-[200px] z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium text-sm">Categories</h3>
                    {selectedCategories.length > 0 && (
                      <button 
                        onClick={clearFilters}
                        className="text-xs text-[#9872DD] hover:text-[#8451E1]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableCategories.map(category => (
                      <label 
                        key={category}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="w-4 h-4 accent-[#9872DD]"
                        />
                        <span className="text-gray-300 text-sm capitalize">
                          {category.replace(/_/g, ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => {
                  setShowSortMenu(!showSortMenu)
                  setShowFilterMenu(false)
                }}
                className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors"
              >
                Sort
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#161616] border border-gray-800 rounded-lg shadow-xl p-2 min-w-[180px] z-50">
                  <button
                    onClick={() => {
                      setSortBy('name-asc')
                      setShowSortMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      sortBy === 'name-asc' 
                        ? 'bg-[#9872DD] text-white' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    Name (A-Z)
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('name-desc')
                      setShowSortMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      sortBy === 'name-desc' 
                        ? 'bg-[#9872DD] text-white' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    Name (Z-A)
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('products-high')
                      setShowSortMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      sortBy === 'products-high' 
                        ? 'bg-[#9872DD] text-white' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    Most Products
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('products-low')
                      setShowSortMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      sortBy === 'products-low' 
                        ? 'bg-[#9872DD] text-white' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    Least Products
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className="bg-[#9872DD]/20 text-[#9872DD] px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-[#9872DD]/30 transition-colors"
              >
                {category.replace(/_/g, ' ')}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {/* Brand Sections */}
        {paginatedBrands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No brands found matching your filters</p>
          </div>
        ) : (
          paginatedBrands.map((brandSection) => (
            <div key={brandSection.brandName} className="mb-12">
              {/* Brand Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {brandSection.storeLogo && (
                    <img 
                      src={brandSection.storeLogo} 
                      alt={brandSection.brandName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <h2 className="text-xl font-bold text-white">{brandSection.brandName}</h2>
                  <span className="text-sm text-gray-400">({brandSection.products.length} items)</span>
                </div>
                <Link 
                  href={`/buyer/brand/${brandSection.brandSlug}`} 
                  className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors flex items-center gap-1"
                >
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {brandSection.products.slice(0, 4).map((product) => {
                  const colors = parseColors(product.colors_available)
                  const business = product.sellers?.seller_business?.[0]

                  return (
                    <Link key={product.id} href={`/buyer/product/${product.id}`} prefetch={true}>
                      <div className="group bg-[#161616] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-800 hover:border-[#9872DD]/30">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              console.log(`Toggling like for product ${product.id}`)
                            }}
                            className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-all duration-200"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
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

                        <div className="p-4">
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                            {business?.brand_name || 'Unknown Brand'}
                          </p>

                          <h3 className="text-white font-medium text-sm mb-3 line-clamp-2">
                            {product.title}
                          </h3>

                          {colors.length > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                              {colors.slice(0, 3).map((color: any, index: number) => (
                                <div
                                  key={index}
                                  className="w-4 h-4 rounded-full border border-gray-400"
                                  style={{ 
                                    backgroundColor: color.colorHex || '#9ca3af' 
                                  }}
                                ></div>
                              ))}
                              {colors.length > 3 && (
                                <span className="text-xs text-gray-400">+{colors.length - 3}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-white font-bold text-lg">
                                {formatPrice(product.price_cents)}
                              </span>
                              <span className="text-white font-bold text-sm">
                                {product.currency}
                              </span>
                            </div>

                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                console.log(`Adding ${product.id} to cart`)
                              }}
                              className="bg-[#9872DD] hover:bg-[#8451E1] text-white p-2.5 rounded-lg transition-colors duration-200 group/cart"
                            >
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
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <>
            <div className="flex items-center justify-end mt-8 gap-2">
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

            <div className="flex justify-end mt-4">
              <span className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages} • Showing {paginatedBrands.length} of {sortedBrands.length} brands
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BrandCatalogGrid