'use client'

import BuyerFooter from '@/components/buyer/footer'
import BuyerHeader from '@/components/buyer/header'
import React from 'react'
import { ProfileProvider } from '@/context/ProfileContext'

const BuyerPageLayout = ({ children }: { children: React.ReactNode }) => {
  
  return (   
    <ProfileProvider>        
    <main className='relative flex flex-col bg-[#0E0E0E] text-[#F2F2F2] min-h-screen'>
      <div className='sticky top-0 z-100'>
        <BuyerHeader />
      </div>
      <div className='flex-1 relative z-10'>
        {children}
      </div>
      <BuyerFooter />
    </main>
    </ProfileProvider>
  )
}

export default BuyerPageLayout