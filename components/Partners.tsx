import Image from 'next/image'
import React from 'react'


interface Partner {
  name: string;
  image: string
}

const partners: Partner[] = [
  {name: 'Solana', image:'/images/solana-foundation-432x71.svg'},
  {name: 'Solana', image:'/images/solana-sol-logo-horizontal 1-283x70.svg'},
  { name: 'Solana', image:'/images/superteam.svg'},
]
export default function Partners() {
  return (
    <section id="#partner" className='container mx-auto relative  w-full overflow-hidden'>
      <div className="mt-[150px] lg:mt-[400px] 2xl:mt-20 py-20">
        <div className="mx-auto ">
          <h2 className="text-[#F9F9F9] text-center text-2xl md:text-[2rem] font-bold -tracking-[3%] mb-16">Our Trusted Partners</h2>
          <div className="flex items-center space-x-9">
          {[...partners, ...partners].map((partner, index) => (
            <div key={index} className="flex items-center justify-center h-[71px]">
              <Image width={432} height={71} src={partner.image} alt={partner.name} className="h-full" />
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
