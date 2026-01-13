'use client'

import Link from "next/link"
import { useState, useMemo } from "react"
import { useListings } from '@/context/ListingsContext'
import { X, ChevronRight } from 'lucide-react'
import ProductCard from "./ProductCard"

const BRANDS_PER_PAGE = 5

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

  // Unique categories for filtering
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
    <div className="bg-black min-h-screen w-full px-4 lg:px-8">
      <div className="px-6 py-8 layout max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-medium text-white">All Brands</h1>
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
                className="text-[#9872DD] cursor-pointer hover:text-[#8451E1] text-sm transition-colors flex items-center gap-2"
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
                className="text-[#9872DD] cursor-pointer hover:text-[#8451E1] text-sm transition-colors"
              >
                Sort
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#161616] border border-gray-800 rounded-lg shadow-xl p-2 min-w-[180px] z-50">
                  {[
                    { id: 'name-asc', label: 'Name (A-Z)' },
                    { id: 'name-desc', label: 'Name (Z-A)' },
                    { id: 'products-high', label: 'Most Products' },
                    { id: 'products-low', label: 'Least Products' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id as SortOption)
                        setShowSortMenu(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        sortBy === option.id 
                          ? 'bg-[#9872DD] text-white' 
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {brandSection.storeLogo && (
                    <img 
                      src={brandSection.storeLogo} 
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <h2 className="text-lg font-medium text-white">{brandSection.brandName}</h2>
                  <span className="text-sm text-gray-400">({brandSection.products.length} items)</span>
                </div>
                <Link 
                  href={`/buyer/brand/${brandSection.brandSlug}`} 
                  className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* ProductCard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {brandSection.products.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 1 ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-[#161616] text-white hover:bg-[#222]"
                }`}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-1 rounded-md transition-colors ${
                    currentPage === pageNum ? "bg-[#9872DD] text-white" : "text-gray-300 hover:bg-[#222]"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === totalPages ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-[#161616] text-white hover:bg-[#222]"
                }`}
              >
                Next
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <span className="text-gray-400 text-xs">
                Page {currentPage} of {totalPages} • Showing {paginatedBrands.length} of {sortedBrands.length} brands
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrandCatalogGrid