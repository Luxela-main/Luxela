// app/product/[id]/page.tsx
"use client"

import Image from "next/image"
import { useState } from "react"
import { ShoppingCart, Heart, ChevronRight, MoreHorizontal } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Separator } from "@/components/ui/separator"
import { RatingItem } from "@/components/rating-item"
import { ReviewCard } from "@/components/review-card"
import Link from "next/link"
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
  price: string
  currency: string
  images: string[]
  description: string
  sizes: string[]
  colors: { id: string; hex: string }[]
}

/**
 * Place these example images in /public/images/
 * - /public/images/shirt-main.jpg
 * - /public/images/shirt-1.jpg
 * - /public/images/shirt-2.jpg
 * - /public/images/shirt-3.jpg
 * - /public/images/related-1.jpg ... related-8.jpg
 */

const PRODUCT: Product = {
  id: 1,
  name: "B/W Wrangler Raglan Long Sleeve",
  brand: "BAZ Fashion",
  price: "0.06",
  currency: "SOL",
  images: [
    "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
  ],
  description:
    `• 100% cotton\n• Medium weight (220 GSM)\n• Regular fit\n• Machine wash cold, tumble dry low\n\nThis B/W Wrangler raglan long sleeve features a bold front print and signature raglan sleeves. Classic silhouette with modern comfort — a wardrobe staple.`,
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: [
    { id: "white", hex: "#ffffff" },
    { id: "black", hex: "#0b0b0b" },
    { id: "navy", hex: "#172554" },
  ],
}

const reviews = [
  {
    name: "Name of customer",
    rating: 3.9,
    date: "10/11/2024",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation",
    likes: 148,
    dislikes: 24,
    images: [null, null, null], // placeholders
  },
  {
    name: "Name of customer",
    rating: 3.9,
    date: "10/11/2024",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    likes: 96,
    dislikes: 10,
    images: [],
  },
];

export default function Item() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState("M")
  const [selectedColor, setSelectedColor] = useState(PRODUCT.colors[0].id)
  const [qty, setQty] = useState(1)

  const mainImage = PRODUCT.images[selectedImageIndex]

  return (
    <div className="min-h-screen bg-[#060606] text-white px-6 lg:px-20 py-8">
      {/* breandcrumb */}
      <div className='w-fit flex items-center gap-2 mb-10 text-xs text-[#858585]'>
        <Link href="/buyer/brands" className='hover:text-[#DCDCDC] capitalize'>Brands</Link>
        <ChevronRight size={16} />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Toggle menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem className="text-black hover:!text-[#DCDCDC] hover:!bg-[#2B2B2B]">
              <Link href="/buyer/brands/brand" className='hover:text-[#DCDCDC] capitalize'>Brand</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ChevronRight size={16} />
        <span className='text-[#DCDCDC] capitalize'>B/W Wrangler Raglan Long Sleeve</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-7 space-y-6">
          {/* Image area */}
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
                    alt={PRODUCT.name}
                    width={760}
                    height={760}
                    className="object-cover rounded-[8px] max-h-[520px] w-full"
                  />
                </motion.div>
                </AnimatePresence>
              </div>

              {/* mobile thumbnail row */}
              <div className="flex gap-3 md:hidden">
                {PRODUCT.images.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`rounded-md overflow-hidden w-[72px] mt-4 ${selectedImageIndex === idx ? 'ring-2 ring-[#2F7DF8]' : ''}`}
                  >
                    <Image src={s} width={72} height={72} alt={`m-thumb-${idx}`} className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* thumbnails column (on md+) */}
            <div className="hidden md:flex justify-between gap-2 items-center ">
              {PRODUCT.images.map((src, i) => (
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
              <h3 className="text-xs text-gray-400">{PRODUCT.brand}</h3>
              <h1 className="text-xl font-bold mt-1">{PRODUCT.name}</h1>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-extrabold">{PRODUCT.price}</div>
                <div className="text-sm text-gray-400">{PRODUCT.currency}</div>
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
            <div>
              <div className="text-xs text-gray-400 mb-2">Color</div>
              <div className="flex items-center gap-3">
                {PRODUCT.colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-8 h-8 rounded-full border-2 ${selectedColor === c.id ? 'border-[#9872DD] ring-2 ring-[#9872DD]/30' : 'border-neutral-700'} flex-none`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={`color-${c.id}`}
                  />
                ))}

                {/* color mode toggle (visual) */}
                <div className="ml-3 text-sm text-gray-400">B/W</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#9872DD]/30 ring-1 ring-[#9872DD]" />
                  <div className="w-6 h-6 rounded-full bg-[#CFF]/10" />
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Size</div>
              <div className="flex items-center gap-2 flex-wrap">
                {PRODUCT.sizes.map((s) => (
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
                <div className="ml-auto text-xs text-gray-400">In stock</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="md:flex items-center justify-between gap-3">
              <button className="w-full px-4 py-3 rounded-lg text-sm font-semibold
                bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] hover:from-[#8451E1] transition-shadow shadow-lg">
                Add to Cart
              </button>

              <button className="w-full px-4 py-3 rounded-lg text-sm font-semibold
                border border-neutral-800 bg-[#0b0b0b] hover:bg-neutral-900">
                Buy Now
              </button>
            </div>

            {/* small product meta */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div>SKU: BAZ-001</div>
              <div>Ships in 1-2 days</div>
            </div>
          </div>
        </aside>
      </div>

      {/* description and details card */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-[#FFFFFF0D] bg-[#141414] rounded-xl">
          <CardHeader className="">
            <CardTitle className="text-lg font-semibold text-[#DCDCDC]">Product Description</CardTitle>
          </CardHeader>
          <Separator className="bg-[#FFFFFF0D]" />

          <CardContent className="flex flex-col h-full">
            <CardDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2 whitespace-pre-line leading-relaxed ">
                  <p className="text-[#7c7a7a] text-base">Name:</p>
                  <p className="text-white">Wrangler</p>
                </div>
                <div className="flex items-center gap-2 whitespace-pre-line leading-relaxed ">
                  <p className="text-[#7c7a7a] text-base">Material:</p>
                  <p className="text-white">Cotton</p>
                </div>
                <div className="flex items-center gap-2 whitespace-pre-line leading-relaxed ">
                  <p className="text-[#7c7a7a] text-base">Detail:</p>
                  <p className="text-white">Other details</p>
                </div>
              </div>
              <p className="whitespace-pre-line leading-relaxed mt-5 text-[#ACACAC] text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </CardDescription>

            <div className="mt-auto w-full bg-[#212121] min-h-[100px] space-y-8 p-4 rounded-[12px] border border-[#FFFFFF0D]">
              <div className="w-full flex h-fit justify-between">
                <p>Vendor details: </p>
                <button className="bg-[#2B2B2B] rounded-[8px] text-[#8451E1] text-sm px-2 py-1">View products <ChevronRight size={16} className="inline-flex" /></button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image src={"/brand-hero-image.jpg"} width={60} height={60} alt="Brand Image" className="object-cover rounded-full size-12" />
                  <div>
                    <p className="text-[#DCDCDC] text-sm font-semibold capitalize">Baz</p>
                    <p className="text-[#ACACAC] text-xs font-semibold capitalize">Clothes & Wears</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Vendor Rating */}
                  <div className="flex gap-1 flex-col">
                    <p className="text-[#ACACAC] text-sm font-medium capitalize">Rating</p>
                    <p className="text-[#DCDCDC] text-xs font-semibold capitalize">5</p>
                  </div>

                  {/* Divider */}
                  <div className="h-6 w-px bg-[#747474]" />

                  {/* Products */}
                  <div className="flex gap-1 flex-col">
                    <p className="text-[#ACACAC] text-sm font-medium capitalize">Products</p>
                    <p className="text-[#DCDCDC] text-xs font-semibold capitalize">125 Items</p>
                  </div>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* small seller / details card */}
        <Card className="border border-[#FFFFFF0D] bg-[#141414] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#DCDCDC]">Product ratings and reviews</CardTitle>
          </CardHeader>

          <Separator className="bg-[#FFFFFF0D]" />
          <CardContent>
            <CardDescription className="mt-6">
              {/* Ratings summary */}
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

              {/* Reviews */}
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
      <section className="mt-10">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-lg font-semibold">More from this collection</h3>
          <Link href={"#"} className="bg-[#2B2B2B] rounded-[8px] text-[#8451E1] text-sm px-2 py-1">
            View all <ChevronRight size={16} className="inline-flex" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#0f0f10] rounded-xl border border-neutral-800 p-3 relative group hover:shadow-md hover:shadow-[#8451E1]/10 cursor-pointer">
              <Image
                src={`https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop`}
                alt={`related-${i + 1}`}
                width={400}
                height={400}
                className="object-cover w-full h-[160px] rounded-[8px] mb-3 group-hover:scale-[1.03] duration-300 ease-in-out"
              />
              <div className="text-xs text-gray-400">{PRODUCT.brand}</div>
              <div className="font-medium mt-1">B/W Wrangler</div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm font-bold">{PRODUCT.price} <span className="text-xs text-gray-400">{PRODUCT.currency}</span></div>

                <button className="p-2 rounded-md bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF]">
                  <ShoppingCart size={16} />
                </button>
              </div>

              {/* small hover overlay like the screenshot */}
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-black/40 border border-neutral-700 flex items-center justify-center">
                  <Heart size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div >
  )
}