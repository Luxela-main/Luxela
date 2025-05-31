import Image from 'next/image';
import React from 'react'

interface Feature {
  title: string;
  description: string;
  image: string
}

const features: Feature[] = [
  {
    title: 'Make Payment in Crypto and Local Currency',
    description: 'Fast, secure, borderless payments on Luxela. Pay in crypto or local currency with just a 1% fee and ultra-low gas costs (less than $0.001).',
    image: '/images/payment-620x672.png'
  },
  {
    title: 'Be Closer to Your Favorite Designer',
    description: 'Connect with your favourite designers, explore their stories, and shop exclusive collections. Support the creators you love, all in one seamless fashion marketplace.',
    image: '/images/nft-620x672.png'
  },
  {
    title: 'Verified Authenticity',
    description: 'Every item is verified for quality and authenticity, ensuring you get real fashion from real creators — exactly as it appears.',
    image: '/images/nft-620x672.png'
  },
]

export default function Feature() {
  return (
    <section id='feature' className='z-10 py-20 px-4'>
      <main className='grid gap-40 container max-w-6xl mx-auto'>
        {features.map((feature) => (
          <div key={feature.title} className='max-w-[1240px] mx-auto min-h-[720px] p-6 bg-[#1A1A1A] rounded-[20px] flex flex-col lg:flex-row items-center gap-[30px]'>
            <div>
              <h3 className='text-lg lg:text-[2rem] font-semibold text-[#F9F9F9]'>{feature.title}</h3>
              <p className='text-sm lg:text-lg text-[#BFBFBF] mt-9'>{ feature.description }</p>
            </div>
            <Image src={feature.image} width={620} height={672} alt='Luxela.' />
          </div>
        ))}
      </main>
    </section>
  )
}
