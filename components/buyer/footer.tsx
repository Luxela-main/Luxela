import Image from 'next/image'
import React from 'react'

const BuyerFooter = () => {
  return (
    <footer className='bg-[#1A1A1A] p-10 '>
      <div className='layout w-full flex items-center justify-between'>

        <Image src={"/images/Luxela-white-logo-200x32.svg"} width={200} height={32} alt='Luxela logo' />
        <Image src={"/x-logo-24x24.svg"} width={24} height={24} alt='X former Twitter logo.' />
      </div>

    </footer>
  )
}

export default BuyerFooter