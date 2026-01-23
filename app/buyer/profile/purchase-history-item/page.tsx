'use client';
export const dynamic = 'force-dynamic';

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Separator } from '@/components/ui/separator'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const timeline = [
  {
    date: "20 Sep, 2024",
    time: "18:00 GMT",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore.",
    active: true,
  },
  {
    date: "20 Sep, 2024",
    time: "18:00 GMT",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore.",
    active: true,
  },
  {
    date: "20 Sep, 2024",
    time: "18:00 GMT",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore.",
    active: false,
  },
];

// TODO: Change the label on image and display the timeline depending on status of order

export default function PurchaseHistoryItem() {
  return (
    <section className=" py-10">
      <div className='w-fit flex items-center gap-2 mb-10 text-sm text-[#858585]'>
        <Link href="/buyer/profile" className='hover:text-[#DCDCDC] capitalize'>Home</Link>
        <ChevronRight size={16} />
        <Link href="/buyer/profile" className='hover:text-[#DCDCDC] capitalize'>Purchase History</Link>
        <ChevronRight size={16} />
        <span className='text-[#DCDCDC] capitalize'>item name</span>
      </div>

      <section className='flex flex-col gap-10 md:flex-row md:items-start w-full'>
        <Card className="bg-[#1A1A1A] w-full md:w-[40%] h-[500px]">
          <CardContent className="flex flex-col gap-3 h-full">
            <span className="ml-auto mb-3 px-5 py-2 rounded-full text-xs text-[#0AA953] border border-[#03948869]">Delivered 24-09</span>
            <div className="w-full h-full rounded-md overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop" width={530} height={414} alt="item image" className="w-full object-fit " />
            </div>
          </CardContent>
        </Card>

        <section className="flex-1 flex flex-col gap-10">
          <Card className="bg-[#1A1A1A] !p-0">
            <CardContent className="!p-0">
              <div className="p-5">
                <h3 className='mb-3 text-[#ACACAC] text-sm'>Transaction date</h3>
                <p className='text-[#FEFEFE] text-base'>27/07/2025</p>
              </div>
              <Separator className='bg-[#2F2F2F]' />
              <div className="p-5">
                <h3 className='mb-3 text-[#ACACAC] text-sm'>Payment method</h3>
                <p className='text-[#F2F2F2] text-base'>Card</p>
              </div>
              <Separator className='bg-[#2F2F2F]' />
              <div className="p-5">
                <h3 className='mb-3 text-[#ACACAC] text-sm'>Shipping Address</h3>
                <p className='text-[#F2F2F2] text-base'>No. 18 Atokwe Street, Ibaja</p>
              </div>
              <Separator className='bg-[#2F2F2F]' />
              <div className="p-5">
                <h3 className='mb-3 text-[#ACACAC] text-sm'>Delivery date</h3>
                <p className='text-[#F2F2F2] text-base'>Delivered 25/05/2025</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A]">
            <CardContent className="">
              <h2 className="text-lg font-semibold mb-10 text-[#F2F2F2]">Delivery timeline</h2>

              <div className="relative border-l border-gray-700 space-y-12">
                {timeline.map((item, i) => (
                  <div key={i} className="flex items-start relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[11px] flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${item.active
                            ? "border-[#A855F7] bg-black"
                            : "border-gray-600 bg-gray-800"
                          }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full mx-auto mt-[3px] ${item.active ? "bg-[#A855F7]" : "bg-gray-600"
                            }`}
                        />
                      </div>
                    </div>

                    {/* Text */}
                    <div className="ml-8 flex flex-col sm:flex-row sm:items-start sm:justify-between w-full">
                      <div className=''>
                        <p className="text-base font-medium text-[#F2F2F2]">
                          {item.date}
                        </p>
                        <p className="text-[#ACACAC] text-sm mt-[2px]">
                          {item.time}
                        </p>
                      </div>
                      <p className="text-[#F2F2F2] text-[15px] leading-relaxed max-w-lg mt-3 sm:mt-0">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </section>
  )
}