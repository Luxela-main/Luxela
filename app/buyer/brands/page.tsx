import BrandCatalogGrid from '@/components/buyer/brand-catalogue-grid'
import React from 'react'

export default function Brands() {
  return (
    <section className='min-h-screen bg-gradient-to-b from-black via-[#0e0e0e] to-black'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8 pb-6 border-b-2 border-[#E5E7EB]'>
          <h1 className='text-4xl font-bold text-white mb-2'>Featured Brands</h1>
          <p className='text-[#6B7280] text-sm font-medium'>Discover luxury brands from around the world</p>
        </div>
      </div>
      <main>
        <BrandCatalogGrid/>
      </main>
    </section>
  )
}