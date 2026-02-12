'use client';

import BuyerFooter from '@/components/buyer/footer'
import BuyerHeader from '@/components/buyer/header'
import React, { Suspense } from 'react'
import { ProfileProvider } from '@/context/ProfileContext'
import { ListingsProvider } from '@/context/ListingsContext'
import { CartProvider } from '@/modules/cart/context' 
import { SearchProvider } from '@/context/SearchContext'

const BuyerLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (   
    <SearchProvider>
    <ProfileProvider>
      <ListingsProvider> 
        <CartProvider> 
          <main className='relative flex flex-col bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-[#F2F2F2] min-h-screen overflow-hidden'>
            {/* Animated background blobs */}
            <div className='fixed inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute -top-40 -right-40 w-96 h-96 bg-[#8451E1]/8 rounded-full blur-3xl animate-blob'></div>
              <div className='absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-blob animation-delay-2000'></div>
              <div className='absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/3 rounded-full blur-3xl animate-blob animation-delay-4000'></div>
            </div>
            <div className='sticky top-0 z-100 relative'>
              <Suspense fallback={<div className='h-[70px]' />}>
                <BuyerHeader />
              </Suspense>
            </div>
            <div className='flex-1 relative z-10 max-w-350 mx-auto w-full px-4 lg:[@media(max-width:1420px)]:px-6 xl:px-0'>
              {children}
            </div>
            <BuyerFooter />
          </main>
          <style>{`
            @keyframes blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
            }
            .animate-blob {
              animation: blob 7s infinite;
            }
            .animation-delay-2000 {
              animation-delay: 2s;
            }
            .animation-delay-4000 {
              animation-delay: 4s;
            }
          `}</style>
        </CartProvider>
      </ListingsProvider>
    </ProfileProvider>
    </SearchProvider>
  )
}

export default BuyerLayoutWrapper
