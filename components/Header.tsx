"use client";

import React, { useState, useEffect } from "react";
import { ClientOnly } from "./client-only";
import Navbar from './Navbar'
import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = [
    "/images/hero/1st.png",
    "/images/hero/2nd.jpg",
    "/images/hero/3rd.png",
    "/images/hero/4th.png",
    "/images/hero/5th.png"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length]);

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
            <div className="rounded-full h-full bg-gradient-to-r from-[#8451E1] via-[#E5E7EB] to-[#8451E1] p-0.5">
              {/* btn Content */}
              <div className="rounded-full h-full text-sm font-medium bg-[#1C1111] flex items-center justify-center">
                <span className='bg-gradient-to-r h-full flex items-center from-[#E5E7EB] to-[#E5E7EB] text-center font-[400] leading-[100%] text-transparent bg-clip-text'>
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
              <Link href={'/buyer'} prefetch={true} className="!cursor-pointer rounded-md text-white bg-gradient-to-b from-[#8451E1] via-#8451E1] to-[#5C2EAF] p-0.5">
                <div className='rounded-md w-full h-full flex items-center justify-center '>
                  <span>Shop Now</span>
                </div>
              </Link>
              <Link href={'/signin'} prefetch={true} className="!cursor-pointer rounded-md text-white bg-gradient-to-b from-[#8451E1] via-#8451E1] to-[#5C2EAF] p-0.5">
                <div className='rounded-md w-full h-full bg-[#0E0E0E] flex items-center justify-center '>
                  <span>Sell</span>
                </div>
              </Link>
            </div>
            <Image src={'/images/Bgs-120x60.svg'} width={120} height={60} alt="chevron down" className="z-10 mx-auto mt-20 animate-bounce" />
          </div>

          {/* Mobile/Tablet Slider*/}
          <div className="lg:hidden w-full mt-10 mb-10 overflow-visible relative">
            <div className="relative h-[500px] sm:h-[600px] flex items-center justify-center perspective-1000">
              <div className="relative w-full h-full flex items-center justify-center">
                {images.map((img, index) => {
                  const position = index - currentSlide;
                  const absPosition = Math.abs(position);
                  
                  const isActive = position === 0;
                  const isPrev = position === -1;
                  const isNext = position === 1;
                  const isVisible = absPosition <= 1;
                  
                  let transform = 'translateX(0%) scale(0.8)';
                  let zIndex = 0;
                  let opacity = 0;
                  
                  if (isActive) {
                    transform = 'translateX(0%) scale(1) rotateY(0deg)';
                    zIndex = 30;
                    opacity = 1;
                  } else if (isPrev) {
                    transform = 'translateX(-80%) scale(0.85) rotateY(25deg)';
                    zIndex = 20;
                    opacity = 0.6;
                  } else if (isNext) {
                    transform = 'translateX(80%) scale(0.85) rotateY(-25deg)';
                    zIndex = 20;
                    opacity = 0.6;
                  }
                  
                  return (
                    <div
                      key={index}
                      className="absolute w-[85%] sm:w-[70%] md:w-[60%] transition-all duration-700 ease-out"
                      style={{
                        transform,
                        zIndex,
                        opacity: isVisible ? opacity : 0,
                        pointerEvents: isActive ? 'auto' : 'none'
                      }}
                    >
                      <div className="relative group">
                        {/* Glowing border effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#8451E1] via-[#B794F6] to-[#8451E1] rounded-[20px] blur-lg opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                        
                        {/* Image container */}
                        <div className="relative rounded-[16px] border-2 border-[#8451E1] h-[450px] sm:h-[550px] overflow-hidden bg-black">
                          <Image 
                            src={img} 
                            width={500} 
                            height={600} 
                            alt={`Fashion item ${index + 1}`} 
                            className="rounded-[16px] w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#8451E1]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation arrows */}
              {/* <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-[#8451E1] to-[#8451E1] flex items-center justify-center text-[#8451E1] hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#8451E1]/50"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % images.length)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-[#8451E1] to-[#8451E1] flex items-center justify-center text-[#8451E1] hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#8451E1]/50"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button> */}
            </div>

            <div className="mt-8 px-8">
              <div className="relative w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-[#8451E1] via-[#B794F6] to-[#8451E1] rounded-full transition-all duration-700 shadow-lg shadow-[#8451E1]/50"
                  style={{ width: `${((currentSlide + 1) / images.length) * 100}%` }}
                ></div>
              </div>
              {/* <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{currentSlide + 1} / {images.length}</span>
                <span className="text-[#8451E1]">Swipe to explore</span>
              </div> */}
            </div>
          </div>

          {/* Desktop Grid - visible on lg screens */}
          <div className="hidden lg:block w-full mt-10 pb-20">
            <div className="grid grid-cols-5 gap-5 mx-auto max-w-[1400px] px-4">
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] h-[375px]'>
              <Image src="/images/hero/1st.png" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] mt-40 h-[375px]'>
              <Image src="/images/hero/2nd.jpg" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] mt-72 h-[375px]'>
              <Image src="/images/hero/3rd.png" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] mt-40 h-[375px]'>
              <Image src="/images/hero/4th.png" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            <div className='rounded-[16px] border-[0.75px] border-[#8451E1] h-[375px]'>
              <Image src="/images/hero/5th.png" width={300} height={375} alt="Image of cloth" className="rounded-[16px] w-full h-full object-cover" />
            </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}