'use client'

import BuyerFooter from '@/components/buyer/footer'
import BuyerHeader from '@/components/buyer/header'
import React from 'react'
import { ProfileProvider } from '@/context/ProfileContext'
import { ListingsProvider } from '@/context/ListingsContext'
import { CartProvider } from '@/modules/cart/context' 
import { SearchProvider } from '@/context/SearchContext'

const BuyerPageLayout = ({ children }: { children: React.ReactNode }) => {
  
  return (   
    <SearchProvider>
    <ProfileProvider>
      <ListingsProvider> 
        <CartProvider> 
          <main className='relative flex flex-col bg-[#0E0E0E] text-[#F2F2F2] min-h-screen'>
            <div className='sticky top-0 z-100'>
              <BuyerHeader />
            </div>
            <div className='flex-1 relative z-10 max-w-350 mx-auto w-full px-4 lg:[@media(max-width:1420px)]:px-6 xl:px-0'>
              {children}
            </div>
            <BuyerFooter />
          </main>
        </CartProvider>
      </ListingsProvider>
    </ProfileProvider>
    </SearchProvider>
  )
}

export default BuyerPageLayout