'use client'

import BuyerFooter from '@/components/buyer/footer'
import BuyerHeader from '@/components/buyer/header'
import React from 'react'

const BuyerPageLayout = ({ children }: { children: React.ReactNode }) => {
  
  return (
    <main className='relative flex flex-col bg-[#0E0E0E] text-[#F2F2F2] min-h-screen'>
      <div className='sticky top-0 z-[100]'>
        <BuyerHeader />
      </div>
      <div className='flex-1 relative z-10 layout'>
        {children}
      </div>
      <BuyerFooter />
    </main>
  )
}

export default BuyerPageLayout