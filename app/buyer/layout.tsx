import BuyerFooter from '@/components/buyer/footer'
import BuyerHeader from '@/components/buyer/header'
import React from 'react'

const BuyerPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className='min-h-screen flex flex-col bg-[#0E0E0E] text-[#F2F2F2]'>
      <BuyerHeader />
      <div className='flex-grow'>
        {children}
      </div>
      <BuyerFooter />
    </main>
  )
}

export default BuyerPageLayout