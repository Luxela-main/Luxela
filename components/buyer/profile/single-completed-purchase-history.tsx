import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const SingleCompletedPurchaseHistory = () => {
  return (
    <section>
      <div className='w-fit flex items-center gap-2 my-10 text-sm text-[#858585]'>
        <Link href="/buyer/profile" className='hover:text-[#DCDCDC] capitalize'>Home</Link>
        <ChevronRight size={16} />
        <Link href="/buyer/profile" className='hover:text-[#DCDCDC] capitalize'>Purchase History</Link>
        <ChevronRight size={16} />
        <span className='text-[#DCDCDC] capitalize'>item name</span>
      </div>

      <section className='flex flex-col gap-10 md:flex-row md:items-start'>
        <Card>
          <CardContent className="flex items-center justify-center">
            <div className="max-w-[530px]">
              <Image src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop" width={530} height={414} alt="item image" className="w-full object-cover" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="">
            <div className="p-5">
              <h3 className='mb-3 text-[#ACACAC] text-sm'>Transaction date</h3>
              <p className='text-[#FEFEFE] text-base'>27/07/2025</p>
            </div>
            <Separator className='bg-[#2F2F2F]' />
             <div className="p-5">
              <h3 className='mb-3 text-[#ACACAC] text-sm'>Payment method</h3>
              <p className='text-[#FEFEFE] text-base'>Card</p>
            </div>
            <Separator className='bg-[#2F2F2F]' />
             <div className="p-5">
              <h3 className='mb-3 text-[#ACACAC] text-sm'>Shipping Address</h3>
              <p className='text-[#FEFEFE] text-base'>No. 18 Atokwe Street, Ibaja</p>
            </div>
            <Separator className='bg-[#2F2F2F]'/>
             <div className="p-5">
              <h3 className='mb-3 text-[#ACACAC] text-sm'>Delivery date</h3>
              <p className='text-[#FEFEFE] text-base'>Delivered 25/05/2025</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </section>
  )
}

export default SingleCompletedPurchaseHistory