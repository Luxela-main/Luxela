// "use client"
// import BrandCollections from '@/components/buyer/brand/collections'
// import ExploreAllProducts from '@/components/buyer/brand/explore-all-products'
// import { BRAND_DATA } from '@/components/lib/brands'
// import { ChevronRight } from 'lucide-react'
// import Image from 'next/image'
// import Link from 'next/link'
// import React, { useState, use } from 'react'

// export default function BrandPage({ params }: { params: Promise<{ brandSlug: string }> }) {
//   const { brandSlug } = use(params)
//   const [activeTab, setActiveTab] = useState<"collections" | "products">("products")
//   const brand = BRAND_DATA[brandSlug]
  
  
//   if (!brand) {
//     return <div>Brand not found</div>
//   }

//   return (
//     <main className='px-6'>
//       <header>
//         <div className='w-fit flex items-center gap-2 my-10 text-sm text-[#858585]'>
//           <Link href="/buyer/brands" className='hover:text-[#DCDCDC]'>Brands</Link>
//           <ChevronRight size={16} />
//           <span className='text-[#DCDCDC] capitalize'>{brandSlug}</span>
//         </div>
        
//        <div className="relative max-w-[1360px] h-[360px] mx-auto mb-8 rounded-[12px] overflow-hidden">
//   <Image 
//     src={brand.heroImage} 
//     width={1360} 
//     height={360} 
//     alt='brand-hero' 
//     className='w-full h-full rounded-[12px] object-cover' 
//   />
//   <Image 
//     src={brand.logoImage} 
//     width={148} 
//     height={148} 
//     alt='brand-logo' 
//     className='absolute -bottom-14 left-[50%] transform -translate-x-[50%] size-[148px] rounded-full object-cover' 
//   />
// </div>
        
//         <div className='my-20 max-w-[1280px] mx-auto text-center'>
//           <h2 className='text-lg'>{brand.name}</h2>
//           <p className='text-sm text-[#DCDCDC] max-w-[720px] mx-auto mt-4'>
//             {brand.description}
//           </p>
//         </div>
//       </header>

//       <div className='flex items-center justify-center gap-6 mb-10'>
//         <button
//           className={`text-sm cursor-pointer pb-1 w-fit border-b ${activeTab === "products" ? "text-[#8451E1] border-[#8451E1]" : "text-[#DCDCDC] border-transparent"}`}
//           onClick={() => setActiveTab("products")}
//         >
//           Explore All Products
//         </button>
//         <button
//           className={`text-sm cursor-pointer pb-1 w-fit border-b ${activeTab === "collections" ? "text-[#8451E1] border-[#8451E1]" : "text-[#DCDCDC] border-transparent"}`}
//           onClick={() => setActiveTab("collections")}
//         >
//           Collections
//         </button>
//       </div>
      
//       {activeTab === "collections" ? <BrandCollections /> : <ExploreAllProducts />}
//     </main>
//   )
// }





'use client'

import BrandCollections from '@/components/buyer/brand/collections'
import ExploreAllProducts from '@/components/buyer/brand/explore-all-products'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { BRAND_DATA } from '@/components/lib/brands'

export default function BrandPage({ params }: { params: Promise<{ brandSlug: string }> }) {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  
  // Unwrap params using React.use()
  const { brandSlug } = React.use(params)
  
  const [activeTab, setActiveTab] = useState<"collections" | "products">("products")
  const brand = BRAND_DATA[brandSlug]

  // Update tab based on URL parameter
  useEffect(() => {
    if (tabFromUrl === "collections") {
      setActiveTab("collections")
    }
  }, [tabFromUrl])

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Brand Not Found</h1>
          <p className="text-gray-400 mb-6">The brand you're looking for doesn't exist.</p>
          <Link href="/buyer/brands" className="text-[#9872DD] hover:text-[#8451E1]">
            ← Back to all brands
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className='px-6'>
      <header>
        {/* Breadcrumb */}
        <div className='w-fit flex items-center gap-2 my-10 text-sm text-[#858585]'>
          <Link href="/buyer/brands" className='hover:text-[#DCDCDC]'>Brands</Link>
          <ChevronRight size={16} />
          <span className='text-[#DCDCDC] capitalize'>{brandSlug.replace('-', ' ')}</span>
        </div>

        {/* Hero Section */}
        <div className="relative max-w-[1360px] h-[360px] mx-auto mb-8 rounded-[12px]">
          <Image 
            src={brand.heroImage} 
            width={1360} 
            height={360} 
            alt='brand-hero' 
            className='w-full h-full rounded-[12px] object-cover' 
          />
          <Image 
            src={brand.logoImage} 
            width={148} 
            height={148} 
            alt='brand-logo' 
            className='absolute -bottom-14 left-[50%] transform -translate-x-[50%] size-[148px] rounded-full border-4 border-black' 
          />
        </div>

        {/* Brand Info */}
        <div className='my-20 max-w-[1280px] mx-auto text-center'>
          <h2 className='text-2xl font-bold text-white'>{brand.name}</h2>
          <p className='text-xs text-gray-400 mt-1'>{brand.category}</p>
          <p className='text-sm text-[#DCDCDC] max-w-[720px] mx-auto mt-4'>
            {brand.description}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className='flex items-center justify-center gap-6 mb-10'>
        <button
          className={`text-sm cursor-pointer pb-1 w-fit border-b-2 transition-colors ${
            activeTab === "products" 
              ? "text-[#8451E1] border-[#8451E1]" 
              : "text-[#DCDCDC] border-transparent hover:text-[#9872DD]"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Explore All Products
        </button>
        <button
          className={`text-sm cursor-pointer pb-1 w-fit border-b-2 transition-colors ${
            activeTab === "collections" 
              ? "text-[#8451E1] border-[#8451E1]" 
              : "text-[#DCDCDC] border-transparent hover:text-[#9872DD]"
          }`}
          onClick={() => setActiveTab("collections")}
        >
          Collections
        </button>
      </div>

{/* Content */}
{activeTab === "collections" ? (
  <BrandCollections brandSlug={brandSlug} />
) : (
  <ExploreAllProducts brandSlug={brandSlug} />
)}
    </main>
  )
}