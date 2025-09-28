"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShoppingCart } from "lucide-react"

interface Product {
  id: number
  name: string
  brand: string
  price: number
  currency: string
  image: string
}

interface BrandSection {
  brand: string
  products: Product[]
}

type SortOption =
  | "Sort by Price (Low to High)"
  | "Sort by Price (High to Low)"
  | "Sort by Name (A-Z)"
  | "Sort by Name (Z-A)"

// Example data (you can add 12+ brands here)
const BRAND_CATALOG: BrandSection[] = [
  {
    brand: "Wrangler",
    products: [
      {
        id: 1,
        name: "B/W Wrangler",
        brand: "Wrangler",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop"
      },
      {
        id: 2,
        name: "Wrangler Shirt",
        brand: "Wrangler",
        price: 0.08,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Nike",
    products: [
      {
        id: 3,
        name: "Air Max",
        brand: "Nike",
        price: 0.1,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"
      },
      {
        id: 4,
        name: "Cortez",
        brand: "Nike",
        price: 0.05,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Adidas",
    products: [
      {
        id: 5,
        name: "Superstar",
        brand: "Adidas",
        price: 0.07,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop"
      },
      {
        id: 6,
        name: "Gazelle",
        brand: "Adidas",
        price: 0.12,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Supreme",
    products: [
      {
        id: 1,
        name: "B/W Wrangler",
        brand: "Wrangler",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop"
      },
      {
        id: 2,
        name: "Wrangler Shirt",
        brand: "Wrangler",
        price: 0.08,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Off-White",
    products: [
      {
        id: 9,
        name: "Industrial Belt",
        brand: "Off-White",
        price: 0.18,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"
      },
      {
        id: 10,
        name: "Arrow T-Shirt",
        brand: "Off-White",
        price: 0.22,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Stone Island",
    products: [
      {
        id: 1,
        name: "B/W Wrangler",
        brand: "Wrangler",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop"
      },
      {
        id: 2,
        name: "Wrangler Shirt",
        brand: "Wrangler",
        price: 0.08,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Palace",
    products: [
      {
        id: 1,
        name: "B/W Wrangler",
        brand: "Wrangler",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop"
      },
      {
        id: 2,
        name: "Wrangler Shirt",
        brand: "Wrangler",
        price: 0.08,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Kith",
    products: [
      {
        id: 1,
        name: "B/W Wrangler",
        brand: "Wrangler",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop"
      },
      {
        id: 2,
        name: "Wrangler Shirt",
        brand: "Wrangler",
        price: 0.08,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Fear of God",
    products: [
      {
        id: 17,
        name: "Essentials Hoodie",
        brand: "Fear of God",
        price: 0.16,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=400&h=400&fit=crop"
      },
      {
        id: 18,
        name: "Military Sneaker",
        brand: "Fear of God",
        price: 0.45,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Yeezy",
    products: [
      {
        id: 15,
        name: "Williams Hoodie",
        brand: "Kith",
        price: 0.2,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=400&h=400&fit=crop"
      },
      {
        id: 16,
        name: "Vintage Tee",
        brand: "Kith",
        price: 0.14,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1583743814966-8936f37f3ff3?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Jordan",
    products: [
      {
        id: 15,
        name: "Williams Hoodie",
        brand: "Kith",
        price: 0.2,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1556821840-3a9fbc86339e?w=400&h=400&fit=crop"
      },
      {
        id: 16,
        name: "Vintage Tee",
        brand: "Kith",
        price: 0.14,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1583743814966-8936f37f3ff3?w=400&h=400&fit=crop"
      },
    ],
  },
  {
    brand: "Bape",
    products: [
      {
        id: 1,
        name: "B/W Wrangler",
        brand: "Wrangler",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop"
      },
      {
        id: 2,
        name: "Wrangler Shirt",
        brand: "Wrangler",
        price: 0.08,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
      },
    ],
  },
];

const BRANDS_PER_PAGE = 3 // show 3 brands per page

export default function CollectionsPage() {
  const [products, setProducts] = useState<BrandSection[]>(BRAND_CATALOG)
  const [sortBy, setSortBy] = useState<SortOption>("Sort by Price (Low to High)")
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(products.length / BRANDS_PER_PAGE)

  const paginatedBrands = products.slice(
    (currentPage - 1) * BRANDS_PER_PAGE,
    currentPage * BRANDS_PER_PAGE
  )

  // sorting per brand
  const handleSort = (sortOption: SortOption) => {
    const sortedBrands = products.map((brandSection) => {
      const sorted = [...brandSection.products]
      switch (sortOption) {
        case "Sort by Price (Low to High)":
          sorted.sort((a, b) => a.price - b.price)
          break
        case "Sort by Price (High to Low)":
          sorted.sort((a, b) => b.price - a.price)
          break
        case "Sort by Name (A-Z)":
          sorted.sort((a, b) => a.name.localeCompare(b.name))
          break
        case "Sort by Name (Z-A)":
          sorted.sort((a, b) => b.name.localeCompare(a.name))
          break
      }
      return { ...brandSection, products: sorted }
    })

    setProducts(sortedBrands)
    setSortBy(sortOption)
  }

  return (
    <div className="px-6 py-10 text-white">     

      {/* brand sections */}
      {paginatedBrands.map((brandSection, i) => (
        <div key={i} className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold mb-4">{brandSection.brand} Collection</h2>
            <Link href={"/buyer/brands/brand/wrangler"} className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors flex items-center gap-1 mb-4">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {brandSection.products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
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

            ))}
          </div>
        </div>
      ))}

      {/* pagination bottom right */}
      <div className="flex justify-end mt-8">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-neutral-700 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-neutral-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
