import Image from 'next/image';
import React from 'react'

interface GettingStarted {
  title: string;
  description: string;
  image: string
}

const gettingStarted: GettingStarted[] = [
  {
    title: 'Sign Up as a Seller',
    description: 'Ready to go global? Join as an independent brand and get discovered by fashion lovers around the world.',
    image: '/images/gs1-432x349.png'
  },
  {
    title: 'Sign Up as a Buyer',
    description: 'Love fashion? Create an account to discover unique styles and enjoy secure, borderless transactions with exclusive perks on every purchase.',
    image: '/images/gs2-432x349.png'
  },
  {
    title: 'Explore the Marketplace',
    description: 'Browse unique, verified pieces from your favorite local brands and discover one-of-a-kind fashion that connects you to creators around the world.',
    image: '/images/gs3-432x349.png'
  }

]
export default function GettingStarted() {
  return (
    <section id="brands" className='py-20 px-4'>
      <main className='max-w-6xl mx-auto'>
        <div className='text-center max-w-[1041px] mx-auto'>
          <h2 className='text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] -tracking-[3%] font-bold'>
            Getting Started with Luxela
          </h2>
          <p className='text-[#BFBFBF] mt-5 mb-12 text-sm md:text-base '>Join Luxela, the fashion marketplace where fashion creators and fashion lovers come together. Sign up, connect with passionate designers and be part of a global community that celebrates authenticity and creativity in fashion.</p>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-9">
          {gettingStarted.map((started, index) => (
            <div key={index} className="flex flex-col items-center justify-center h-[538px] rounded-[12px] bg-[#1A1A1A]">
              <Image width={432} height={71} src={started.image} alt={'Luxela'} className="object-cover h-full rounded-tr-[12px] rounded-tl-[12px]" />
              <div className='mt-12 max-w-[392px] px-5'>
                <h3 className='mb-3 text-lg text-[#F6F6F6] font-semibold'>{started.title}</h3>
                <p className='text-sm text-[#BFBFBF] mb-10'>{started.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </section>
  )
}
