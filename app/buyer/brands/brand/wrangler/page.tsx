'use client'

import BrandCollections from '@/components/buyer/brand/collections'
import ExploreAllProducts from '@/components/buyer/brand/explore-all-products'
import WranglerCollection from '@/components/buyer/wrangler-collection'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

export default function WranglerCollectionPage() {
  const [activeTab, setActiveTab] = useState<"collections" | "products" | "">("")
  return (
    <main className='px-6'>
      <header>
        {/* breandcrumb */}
        <div className='w-fit flex items-center gap-2 my-10 text-sm text-[#858585]'>
          <Link href="/buyer/brands" className='hover:text-[#DCDCDC] capitalize'>Brands</Link>
          <ChevronRight size={16} />
          <Link href="/buyer/brands/brand" className='hover:text-[#DCDCDC] capitalize'>Brand</Link>
          <ChevronRight size={16} />
          <span className='text-[#DCDCDC] capitalize'>Wrangler</span>
        </div>

        <div className="relative max-w-[1360px] h-[360px] mx-auto mb-8 rounded-[12px] ">
          <Image src="/brand-hero.jpg" width={1360} height={360} alt='brand-hero' className='w-full h-full rounded-[12px]' />
          <Image src="/brand-hero-image.jpg" width={148} height={148} alt='brand-hero' className='absolute -bottom-14 left-[50%] transform -translate-x-[50%] size-[148px] rounded-full' />
        </div>
        <div className='my-20 max-w-[1280px] mx-auto text-center'>
          <h2 className='text-lg'>Baz Fashion</h2>
          <p className='text-sm text-[#DCDCDC] max-w-[720px] mx-auto mt-4'>
            We do not exist as a singular element. Our genetic make up is a stepping stone to our individuality, but even then, our genetic make up is not a singular entity. As we grow, we learn and unlearn, we experience and we forget, we take and we give back. There’s more variation in our individuality per day.
          </p>
        </div>
      </header>

      <div className='flex items-center justify-center gap-6 mb-10'>
        <button
          className={`text-sm cursor-pointer pb-1 w-fit border-b ${activeTab === "products" ? "text-[#8451E1] border-[#8451E1]" : "text-[#DCDCDC] border-transparent"}`}
          onClick={() => setActiveTab("products")}
        >
          Explore All Products
        </button>
        <button
          className={`text-sm cursor-pointer pb-1 w-fit border-b ${activeTab === "collections" ? "text-[#8451E1] border-[#8451E1]" : "text-[#DCDCDC] border-transparent"}`}
          onClick={() => setActiveTab("collections")}
        >
          Collections
        </button>
      </div>
      {activeTab === "collections" ? <BrandCollections /> : activeTab === "products" ? <ExploreAllProducts /> : <WranglerCollection />}
    </main>
  )
}
