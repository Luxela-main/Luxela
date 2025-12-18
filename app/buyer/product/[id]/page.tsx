"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { ShoppingCart, Heart, ChevronRight, MoreHorizontal } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Separator } from "@/components/ui/separator"
import { RatingItem } from "@/components/rating-item"
import { ReviewCard } from "@/components/review-card"
import Link from "next/link"
import React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Product = {
  id: number
  name: string
  brand: string
  brandSlug: string
  price: string
  currency: string
  images: string[]
  description: string
  sizes: string[]
  colors: { id: string; hex: string }[]
  category: string
  sku: string
  inStock: boolean
  shipsIn: string
}

// Mock product database - Replace with actual API call
const PRODUCTS_DATABASE: Product[] = [
  {
    id: 1,
    name: "Baggy Jeans",
    brand: "BAZ",
    brandSlug: "baz",
    price: "0.06",
    currency: "SOL",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
    ],
    description: "• 100% cotton\n• Medium weight (220 GSM)\n• Regular fit\n• Machine wash cold, tumble dry low\n\nClassic baggy jeans with a modern twist. Perfect for everyday wear.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { id: "white", hex: "#ffffff" },
      { id: "black", hex: "#0b0b0b" },
      { id: "navy", hex: "#172554" },
    ],
    category: "Denim",
    sku: "BAZ-001",
    inStock: true,
    shipsIn: "1-2 days"
  },
  {
    id: 2,
    name: "BAZ Hoodie",
    brand: "BAZ",
    brandSlug: "baz",
    price: "0.06",
    currency: "SOL",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
    ],
    description: "• 80% cotton, 20% polyester\n• Heavy weight (320 GSM)\n• Oversized fit\n• Machine wash cold\n\nPremium comfort hoodie with signature BAZ branding.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { id: "black", hex: "#0b0b0b" },
      { id: "gray", hex: "#6b7280" },
    ],
    category: "Hoodies",
    sku: "BAZ-002",
    inStock: true,
    shipsIn: "1-2 days"
  },
  {
    id: 3,
    name: "Bat Tee Black Print",
    brand: "BAZ",
    brandSlug: "baz",
    price: "0.04",
    currency: "SOL",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
    ],
    description: "• 100% cotton\n• Lightweight (180 GSM)\n• Regular fit\n• Bold graphic print\n\nStatement tee with eye-catching bat graphic.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { id: "black", hex: "#0b0b0b" },
      { id: "white", hex: "#ffffff" },
    ],
    category: "T-Shirts",
    sku: "BAZ-003",
    inStock: true,
    shipsIn: "1-2 days"
  },
  {
    id: 9,
    name: "Classic Loafers",
    brand: "SHU",
    brandSlug: "shu",
    price: "0.08",
    currency: "SOL",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
    ],
    description: "• Premium leather\n• Comfortable insole\n• Slip-on design\n• Versatile style\n\nTimeless loafers for any occasion.",
    sizes: ["7", "8", "9", "10", "11"],
    colors: [
      { id: "black", hex: "#0b0b0b" },
      { id: "brown", hex: "#92400e" },
    ],
    category: "Shoes",
    sku: "SHU-001",
    inStock: true,
    shipsIn: "2-3 days"
  },
]

const reviews = [
  {
    name: "Name of customer",
    rating: 3.9,
    date: "10/11/2024",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation",
    likes: 148,
    dislikes: 24,
    images: [null, null, null],
  },
  {
    name: "Name of customer",
    rating: 3.9,
    date: "10/11/2024",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    likes: 96,
    dislikes: 10,
    images: [],
  },
]

export default function ProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  const productId = parseInt(id)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [qty, setQty] = useState(1)

  useEffect(() => {
    // Simulate API call - Replace with actual fetch
    const fetchProduct = async () => {
      setLoading(true)
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const foundProduct = PRODUCTS_DATABASE.find(p => p.id === productId)
      setProduct(foundProduct || null)
      
      if (foundProduct) {
        setSelectedSize(foundProduct.sizes[2] || foundProduct.sizes[0])
        setSelectedColor(foundProduct.colors[0]?.id || "")
      }
      
      setLoading(false)
    }

    fetchProduct()
  }, [productId])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060606] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9872DD] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading product...</p>
        </div>
      </div>
    )
  }

  // Product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-[#060606] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-400 mb-8">
            Sorry, the product you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/buyer/brands">
            <button className="bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] text-white px-8 py-3 rounded-lg font-semibold hover:from-[#8451E1] transition-all">
              Browse All Products
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const mainImage = product.images[selectedImageIndex]

  // Get related products from same brand
  const relatedProducts = PRODUCTS_DATABASE.filter(
    p => p.brandSlug === product.brandSlug && p.id !== product.id
  ).slice(0, 8)

  return (
    <div className="min-h-screen bg-[#060606] text-white px-6 lg:px-20 py-8">
      {/* Breadcrumb */}
      <div className='w-fit flex items-center gap-2 mb-10 text-xs text-[#858585]'>
        <Link href="/buyer/brands" className='hover:text-[#DCDCDC] capitalize'>Brands</Link>
        <ChevronRight size={16} />
        <Link href={`/buyer/brands/${product.brandSlug}`} className='hover:text-[#DCDCDC] capitalize'>
          {product.brand}
        </Link>
        <ChevronRight size={16} />
        <span className='text-[#DCDCDC] capitalize'>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT - Images */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-row-2 gap-2">
            {/* Main image */}
            <div className="col-span-1">
              <div className="bg-[#0f0f10] rounded-2xl border border-neutral-800 p-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                <motion.div
                  key={mainImage}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-h-[520px] rounded-[8px] overflow-hidden flex items-center justify-center"
                >
                  <Image
                    src={mainImage}
                    alt={product.name}
                    width={760}
                    height={760}
                    className="object-cover rounded-[8px] max-h-[520px] w-full"
                  />
                </motion.div>
                </AnimatePresence>
              </div>

              {/* Mobile thumbnail row */}
              <div className="flex gap-3 md:hidden overflow-x-auto">
                {product.images.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`rounded-md overflow-hidden w-[72px] mt-4 flex-shrink-0 ${selectedImageIndex === idx ? 'ring-2 ring-[#2F7DF8]' : ''}`}
                  >
                    <Image src={s} width={72} height={72} alt={`m-thumb-${idx}`} className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnails column (on md+) */}
            <div className="hidden md:flex justify-between gap-2 items-center">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`cursor-pointer rounded-md overflow-hidden relative w-full h-full flex items-center justify-center group
                    ${selectedImageIndex === i ? 'ring-2 ring-[#2F7DF8] -ring-offset-2 ring-offset-[#0b0b0b]' : 'border border-transparent'}
                    transition-all`}
                >
                  <Image src={src} width={72} height={72} alt={`thumb-${i}`} className="group-hover:scale-[1.03] object-cover w-full rounded-[8px]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT - Product info card */}
        <aside className="lg:col-span-5">
          <div className="bg-[#0f0f10] rounded-2xl border border-neutral-800 p-6 space-y-6">
            <div>
              <h3 className="text-xs text-gray-400">{product.brand}</h3>
              <h1 className="text-xl font-bold mt-1">{product.name}</h1>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-extrabold">{product.price}</div>
                <div className="text-sm text-gray-400">{product.currency}</div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 rounded-md bg-black/30 border border-neutral-800 hover:bg-black/40">
                  <Heart size={18} />
                </button>
                <button className="px-3 py-2 rounded-lg bg-[#121212] border border-neutral-800 text-sm">
                  Share
                </button>
              </div>
            </div>

            {/* Color swatches */}
            {product.colors.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-2">Color</div>
                <div className="flex items-center gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-8 h-8 rounded-full border-2 ${selectedColor === c.id ? 'border-[#9872DD] ring-2 ring-[#9872DD]/30' : 'border-neutral-700'} flex-none`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={`color-${c.id}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-2">Size</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-2 rounded-md text-sm border ${selectedSize === s ? 'bg-[#9872DD] text-black font-semibold' : 'border-neutral-700 text-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Quantity</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 rounded-md border border-neutral-700"
                >
                  -
                </button>
                <div className="text-lg font-medium">{qty}</div>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 rounded-md border border-neutral-700"
                >
                  +
                </button>
                <div className="ml-auto text-xs text-gray-400">
                  {product.inStock ? 'In stock' : 'Out of stock'}
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="md:flex items-center justify-between gap-3">
              <button 
                disabled={!product.inStock}
                className="w-full px-4 py-3 rounded-lg text-sm font-semibold
                bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] hover:from-[#8451E1] transition-shadow shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                Add to Cart
              </button>

              <button 
                disabled={!product.inStock}
                className="w-full px-4 py-3 rounded-lg text-sm font-semibold
                border border-neutral-800 bg-[#0b0b0b] hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed">
                Buy Now
              </button>
            </div>

            {/* Product meta */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div>SKU: {product.sku}</div>
              <div>Ships in {product.shipsIn}</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Description and details card */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-[#FFFFFF0D] bg-[#141414] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#DCDCDC]">Product Description</CardTitle>
          </CardHeader>
          <Separator className="bg-[#FFFFFF0D]" />

          <CardContent className="flex flex-col h-full">
            <CardDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[#7c7a7a] text-base">Name:</p>
                  <p className="text-white">{product.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[#7c7a7a] text-base">Category:</p>
                  <p className="text-white">{product.category}</p>
                </div>
              </div>
              <p className="whitespace-pre-line leading-relaxed mt-5 text-[#ACACAC] text-sm">
                {product.description}
              </p>
            </CardDescription>

            <div className="mt-auto w-full bg-[#212121] min-h-[100px] space-y-8 p-4 rounded-[12px] border border-[#FFFFFF0D]">
              <div className="w-full flex h-fit justify-between">
                <p>Vendor details: </p>
                <Link href={`/buyer/brands/${product.brandSlug}`}>
                  <button className="bg-[#2B2B2B] rounded-[8px] text-[#8451E1] text-sm px-2 py-1">
                    View products <ChevronRight size={16} className="inline-flex" />
                  </button>
                </Link>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image src={"/brand-hero-image.jpg"} width={60} height={60} alt="Brand Image" className="object-cover rounded-full size-12" />
                  <div>
                    <p className="text-[#DCDCDC] text-sm font-semibold capitalize">{product.brand}</p>
                    <p className="text-[#ACACAC] text-xs font-semibold capitalize">{product.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex gap-1 flex-col">
                    <p className="text-[#ACACAC] text-sm font-medium capitalize">Rating</p>
                    <p className="text-[#DCDCDC] text-xs font-semibold capitalize">5</p>
                  </div>
                  <div className="h-6 w-px bg-[#747474]" />
                  <div className="flex gap-1 flex-col">
                    <p className="text-[#ACACAC] text-sm font-medium capitalize">Products</p>
                    <p className="text-[#DCDCDC] text-xs font-semibold capitalize">125 Items</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ratings and reviews */}
        <Card className="border border-[#FFFFFF0D] bg-[#141414] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#DCDCDC]">Product ratings and reviews</CardTitle>
          </CardHeader>

          <Separator className="bg-[#FFFFFF0D]" />
          <CardContent>
            <CardDescription className="mt-6">
              <div className="space-y-4">
                <p className="text-white font-medium">Product rating</p>
                <div className="flex flex-wrap gap-4">
                  <RatingItem stars={5} count={1290} />
                  <RatingItem stars={4} count={290} />
                  <RatingItem stars={3} count={129} />
                  <RatingItem stars={2} count={190} />
                  <RatingItem stars={1} count={87} />
                </div>
              </div>

              <div className="mt-8 space-y-10">
                <p className="text-white font-medium">Product reviews</p>
                {reviews.map((review, idx) => (
                  <ReviewCard key={idx} review={review} />
                ))}
              </div>
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-semibold">More from {product.brand}</h3>
            <Link href={`/buyer/brands/${product.brandSlug}`}>
              <button className="bg-[#2B2B2B] rounded-[8px] text-[#8451E1] text-sm px-2 py-1">
                View all <ChevronRight size={16} className="inline-flex" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link key={relatedProduct.id} href={`/buyer/product/${relatedProduct.id}`}>
                <div className="bg-[#0f0f10] rounded-xl border border-neutral-800 p-3 relative group hover:shadow-md hover:shadow-[#8451E1]/10 cursor-pointer">
                  <Image
                    src={relatedProduct.images[0]}
                    alt={relatedProduct.name}
                    width={400}
                    height={400}
                    className="object-cover w-full h-[160px] rounded-[8px] mb-3 group-hover:scale-[1.03] duration-300 ease-in-out"
                  />
                  <div className="text-xs text-gray-400">{relatedProduct.brand}</div>
                  <div className="font-medium mt-1">{relatedProduct.name}</div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm font-bold">
                      {relatedProduct.price} <span className="text-xs text-gray-400">{relatedProduct.currency}</span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        console.log('Added to cart:', relatedProduct.id)
                      }}
                      className="p-2 rounded-md bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF]"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>

                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-neutral-700 flex items-center justify-center">
                      <Heart size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}