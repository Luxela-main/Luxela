import React from "react";
import { ClientOnly } from "./client-only";
import Navbar from './Navbar'
import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <>
      <ClientOnly>
        <Navbar />
      </ClientOnly>

      <header className="pt-10 lg:pt-20 bg-[url('/images/hero-bg-1440x1066.png')] bg-cover bg-center bg-no-repeat min-h-screen mx-auto w-full relative">
        {/* Glare background image */}
        <div className="absolute top-0 left-0 2xl:left-1/2 transform -translate-x-1/2 bg-[url('/images/Glare-1321x760.png')] h-[760px] w-[200px] bg-center lg:w-[1321px] pointer-events-none"></div>

        {/* Optional dark overlay */}
        <div className="absolute inset-0 bg-[#0E0E0E] opacity-35 z-5"></div>

        {/* Decorative lights/images */}
        <Image src={'/images/Light-852x785.svg'} width={852} height={785} alt="light effect" className="z-10 absolute top-0 right-0 " />


        {/* content */}
        <div className="z-10 px-2 relative flex flex-col pt-20 items-center justify-center">
          <div className="relative w-[194px] !h-12">
            {/* Gradient border container */}
            <div className="rounded-full h-full bg-gradient-to-r from-[#6F42C1] via-[#9675D2] to-[#B8A3E1] p-0.5">
              {/* btn Content */}
              <div className=" rounded-full h-full  text-sm font-medium bg-[#1C1111] flex items-center justify-center">
                <span className='bg-gradient-to-r h-full flex items-center from-[#F8DFFC] to-[#FEC5F3] text-center font-[400] leading-[100%] text-transparent bg-clip-text'>
                  Pay With Crypto
                </span>
              </div>
            </div>
          </div>
          {/* main content with cta */}
          <div className='text-center w-full max-w-[793px] px-8 lg:px-0 mt-6'>
            <h1 className="text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[120%]">
              Authentic Fashion,{" "}
              <span className="text-[#8451E1]">Global Reach</span>
              <br /> A New Era of E-commerce
            </h1>
            <p className="text-sm md:text-base text-[#BFBFBF] my-5 max-w-3xl mx-auto">
              Buy, sell and pay for authentic fashion products easily using your local or digital currency
            </p>

            <div className='grid grid-cols-2 gap-5 w-full h-12 max-w-[338px] mx-auto'>
              <Link href={'/buyer'} className="!cursor-pointer rounded-md text-white bg-gradient-to-b from-[#9872DD] via-#8451E1] to-[#5C2EAF] p-0.5">
                <div className='rounded-md w-full h-full flex items-center justify-center '>
                  <span>Shop Now</span>
                </div>
              </Link>
              <Link href={'/signin'} className="!cursor-pointer rounded-md text-white bg-gradient-to-b from-[#9872DD] via-#8451E1] to-[#5C2EAF] p-0.5">
                <div className='rounded-md w-full h-full bg-[#0E0E0E] flex items-center justify-center '>
                  <span>Sell</span>
                </div>
              </Link>
            </div>
            <Image src={'/images/Bgs-120x60.svg'} width={120} height={60} alt="chevron down" className="z-10 mx-auto mt-20 animate-bounce" />
          </div>
          {/* samples lg screen */}
          <div className="-mt-10 grid grid-cols-5 gap-5  mx-auto h-full overflow-x-hidden">
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] h-[375px]'>
              <Image src="/images/hero/1st.png" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] mt-40 h-[375px]'>
              <Image src="/images/hero/2nd.jpg" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] mt-72 h-[375px]'>
              <Image src="/images/hero/3rd.png" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1]  mt-40 h-[375px]'>
              <Image src="/images/hero/4th.png" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] h-[375px] '>
              <Image src="/images/hero/5th.png" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
