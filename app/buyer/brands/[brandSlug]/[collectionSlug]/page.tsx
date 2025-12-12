// // 'use client'

// // import WranglerCollection from '@/components/buyer/wrangler-collection'
// // import { ChevronRight } from 'lucide-react'
// // import Image from 'next/image'
// // import Link from 'next/link'
// // import React, { use } from 'react'

// // export default function CollectionPage({ 
// //   params 
// // }: { 
// //   params: Promise<{ brandSlug: string; collectionSlug: string }> 
// // }) {
// //   // Unwrap the params Promise
// //   const { brandSlug, collectionSlug } = use(params)
  
// //   return (
// //     <main className='px-6'>
// //       <header>
// //         <div className='w-fit flex items-center gap-2 my-10 text-sm text-[#858585]'>
// //           <Link href="/buyer/brands" className='hover:text-[#DCDCDC] capitalize'>Brands</Link>
// //           <ChevronRight size={16} />
// //           <Link href={`/buyer/brands/${brandSlug}`} className='hover:text-[#DCDCDC] capitalize'>{brandSlug}</Link>
// //           <ChevronRight size={16} />
// //           <span className='text-[#DCDCDC] capitalize'>{collectionSlug}</span>
// //         </div>

// //       </header>

// //     </main>
// //   )
// // }







// "use client"

// import { useState } from "react"
// import { motion } from "framer-motion"
// import Image from "next/image"
// import { ShoppingCart, Heart } from "lucide-react"

// interface Product {
//   id: number
//   name: string
//   price: number
//   currency: string
//   image: string
//   isLiked: boolean
//   variants: string[]
// }

// type SortOption =
//   | "Sort by Price (Low to High)"
//   | "Sort by Price (High to Low)"
//   | "Sort by Name (A-Z)"
//   | "Sort by Name (Z-A)"

// // These are products WITHIN a collection
// const WRANGLER_PRODUCTS: Product[] = [
//   {
//     id: 1,
//     name: "B/W Wrangler Raglan",
//     price: 0.06,
//     currency: "SOL",
//     image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
//     isLiked: false,
//     variants: ["blue", "black", "gray"]
//   },
//   {
//     id: 2,
//     name: "Wrangler Denim Jacket",
//     price: 0.08,
//     currency: "SOL",
//     image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
//     isLiked: true,
//     variants: ["blue", "black"]
//   },
//   {
//     id: 3,
//     name: "Wrangler Slim Fit Jeans",
//     price: 0.05,
//     currency: "SOL",
//     image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
//     isLiked: false,
//     variants: ["blue", "black", "gray"]
//   },
//   {
//     id: 4,
//     name: "Wrangler Hoodie",
//     price: 0.07,
//     currency: "SOL",
//     image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
//     isLiked: false,
//     variants: ["black", "navy"]
//   },
//   {
//     id: 5,
//     name: "Wrangler Cargo Pants",
//     price: 0.09,
//     currency: "SOL",
//     image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop",
//     isLiked: true,
//     variants: ["khaki", "black", "olive"]
//   },
//   {
//     id: 6,
//     name: "Wrangler Flannel Shirt",
//     price: 0.06,
//     currency: "SOL",
//     image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop",
//     isLiked: false,
//     variants: ["red", "blue", "gray"]
//   },
//   {
//     id: 7,
//     name: "Wrangler Western Boots",
//     price: 0.12,
//     currency: "SOL",
//     image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
//     isLiked: false,
//     variants: ["brown", "black"]
//   },
//   {
//     id: 8,
//     name: "Wrangler Belt",
//     price: 0.03,
//     currency: "SOL",
//     image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
//     isLiked: false,
//     variants: ["brown", "black"]
//   },
// ]

// const getVariantColor = (variant: string): string => {
//   const colorMap: { [key: string]: string } = {
//     'blue': 'bg-blue-500',
//     'black': 'bg-black',
//     'gray': 'bg-gray-500',
//     'navy': 'bg-blue-900',
//     'khaki': 'bg-yellow-700',
//     'olive': 'bg-green-800',
//     'red': 'bg-red-500',
//     'brown': 'bg-amber-800',
//   }
//   return colorMap[variant] || 'bg-gray-400'
// }

// const PRODUCTS_PER_PAGE = 12

// export default function WranglerCollection() {
//   const [products, setProducts] = useState<Product[]>(WRANGLER_PRODUCTS)
//   const [sortBy, setSortBy] = useState<SortOption>("Sort by Price (Low to High)")
//   const [currentPage, setCurrentPage] = useState(1)

//   const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE)

//   const paginatedProducts = products.slice(
//     (currentPage - 1) * PRODUCTS_PER_PAGE,
//     currentPage * PRODUCTS_PER_PAGE
//   )

//   const handleSort = (sortOption: SortOption) => {
//     const sorted = [...products]
//     switch (sortOption) {
//       case "Sort by Price (Low to High)":
//         sorted.sort((a, b) => a.price - b.price)
//         break
//       case "Sort by Price (High to Low)":
//         sorted.sort((a, b) => b.price - a.price)
//         break
//       case "Sort by Name (A-Z)":
//         sorted.sort((a, b) => a.name.localeCompare(b.name))
//         break
//       case "Sort by Name (Z-A)":
//         sorted.sort((a, b) => b.name.localeCompare(a.name))
//         break
//     }

//     setProducts(sorted)
//     setSortBy(sortOption)
//   }

//   const toggleLike = (productId: number) => {
//     setProducts(products.map(p => 
//       p.id === productId ? { ...p, isLiked: !p.isLiked } : p
//     ))
//   }

//   return (
//     <div className="text-white">
//       {/* Filter/Sort Bar */}
//       <div className="flex justify-between items-center mb-6">
//         <p className="text-gray-400 text-sm">
//           Showing {paginatedProducts.length} of {products.length} products
//         </p>
//         <div className="flex gap-3">
//           <select
//             value={sortBy}
//             onChange={(e) => handleSort(e.target.value as SortOption)}
//             className="bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm border border-neutral-700 focus:outline-none focus:border-[#9872DD]"
//           >
//             <option>Sort by Price (Low to High)</option>
//             <option>Sort by Price (High to Low)</option>
//             <option>Sort by Name (A-Z)</option>
//             <option>Sort by Name (Z-A)</option>
//           </select>
//         </div>
//       </div>

//       {/* Products Grid */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
//         {paginatedProducts.map((product, idx) => (
//           <motion.div
//             key={product.id}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: idx * 0.05 }}
//             className="bg-[#161616] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-800 hover:border-[#9872DD]/30 group"
//           >
//             {/* Image Container */}
//             <div className="relative aspect-[3/4] overflow-hidden">
//               <Image
//                 src={product.image}
//                 width={300}
//                 height={400}
//                 alt={product.name}
//                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
//               />

//               {/* Gradient Overlay */}
//               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

//               {/* Like Button */}
//               <button
//                 onClick={() => toggleLike(product.id)}
//                 className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-all duration-200"
//               >
//                 <Heart
//                   size={18}
//                   className={`transition-colors ${
//                     product.isLiked ? 'text-red-500 fill-current' : 'text-white'
//                   }`}
//                 />
//               </button>
//             </div>

//             {/* Product Info */}
//             <div className="p-4">
//               {/* Product Name */}
//               <h3 className="text-white font-medium text-sm mb-3">
//                 {product.name}
//               </h3>

//               {/* Color Variants */}
//               <div className="flex items-center gap-2 mb-3">
//                 {product.variants.slice(0, 3).map((variant, index) => (
//                   <div
//                     key={variant}
//                     className={`w-4 h-4 rounded-full ${getVariantColor(variant)} ${
//                       index === 0 ? 'ring-2 ring-purple-400 ring-offset-1 ring-offset-[#161616]' : ''
//                     }`}
//                   ></div>
//                 ))}
//               </div>

//               {/* Price and Cart Button Row */}
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-1">
//                   <span className="text-white font-bold text-lg">
//                     {product.price}
//                   </span>
//                   <span className="text-gray-400 text-xs">
//                     {product.currency}
//                   </span>
//                 </div>

//                 {/* Cart Button */}
//                 <button className="bg-[#9872DD] hover:bg-[#8451E1] text-white p-2.5 rounded-lg transition-colors duration-200 group/cart">
//                   <ShoppingCart
//                     size={16}
//                     className="group-hover/cart:scale-110 transition-transform"
//                   />
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       {/* Pagination */}
//       <div className="flex justify-end mt-8">
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//             disabled={currentPage === 1}
//             className={`px-4 py-2 rounded-lg ${
//               currentPage === 1
//                 ? "bg-gray-800 text-gray-500 cursor-not-allowed"
//                 : "bg-[#161616] text-white hover:bg-[#222]"
//             }`}
//           >
//             Prev
//           </button>

//           {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
//             <button
//               key={pageNum}
//               onClick={() => setCurrentPage(pageNum)}
//               className={`px-4 py-2 rounded-md ${
//                 currentPage === pageNum
//                   ? "bg-[#9872DD] text-white"
//                   : "text-gray-300 hover:bg-[#222]"
//               }`}
//             >
//               {pageNum}
//             </button>
//           ))}

//           <button
//             onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
//             disabled={currentPage === totalPages}
//             className={`px-4 py-2 rounded-lg ${
//               currentPage === totalPages
//                 ? "bg-gray-800 text-gray-500 cursor-not-allowed"
//                 : "bg-[#161616] text-white hover:bg-[#222]"
//             }`}
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }