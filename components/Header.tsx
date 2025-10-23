import React from "react";
import Navbar from "./Navbar";
import { ClientOnly } from "./client-only";

export default function Header() {
  return (
    <>
      <ClientOnly>
        <Navbar />
      </ClientOnly>

      <header className="bg-gradient-to-b from-gray-900 to-black bg-cover bg-center bg-no-repeat min-h-screen 2xl:min-h-[1024px] mx-auto w-full relative overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gradient-radial from-purple-500/20 via-purple-700/10 to-transparent h-[760px] w-full max-w-[1321px] pointer-events-none blur-3xl"></div>

        <div className="absolute inset-0 bg-[#0E0E0E] opacity-35 z-5"></div>

        <div className="z-10 absolute top-0 right-0 w-[200px] h-[200px] lg:w-[400px] lg:h-[400px] bg-gradient-to-bl from-purple-500/30 to-transparent rounded-full blur-3xl"></div>

        <div className="z-10 absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-50">
          <svg
            width="40"
            height="20"
            viewBox="0 0 40 20"
            fill="none"
            className="animate-bounce">
            <path
              d="M5 5L20 15L35 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative flex flex-col pt-32 lg:pt-40 items-center justify-center px-4">
          <div className="relative w-[194px] h-12">
            <div className="rounded-full h-full bg-gradient-to-r from-[#6F42C1] via-[#9675D2] to-[#B8A3E1] p-0.5">
              <div className="rounded-full h-full text-sm font-medium bg-[#1C1111] flex items-center justify-center">
                <span className="bg-gradient-to-r h-full flex items-center from-[#F8DFFC] to-[#FEC5F3] text-center font-[400] leading-[100%] text-transparent bg-clip-text">
                  Pay With Crypto
                </span>
              </div>
            </div>
          </div>

          <div className="text-center w-full max-w-[793px] px-4 lg:px-0 mt-6 z-20">
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[120%]">
              Authentic Fashion,{" "}
              <span className="text-[#8451E1]">Global Reach</span>
              <br /> A New Era of E-commerce
            </h1>
            <p className="text-sm md:text-base text-[#BFBFBF] my-5 max-w-2xl mx-auto">
              An e-commerce platform where you can buy and sell authentic
              fashion products easily. Pay with local currencies or digital
              assets, and experience seamless, affordable fashion like never
              before.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[338px] mx-auto">
              <a
                href="/cart"
                className="cursor-pointer rounded-md text-white bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] p-0.5 transition-transform hover:scale-105 active:scale-95">
                <div className="rounded-md w-full h-12 flex items-center justify-center font-medium">
                  <span>Shop Now</span>
                </div>
              </a>
              <a
                href="/sellers/dashboard"
                className="cursor-pointer rounded-md text-white bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] p-0.5 transition-transform hover:scale-105 active:scale-95">
                <div className="rounded-md w-full h-12 bg-[#0E0E0E] flex items-center justify-center font-medium">
                  <span>Sell Now</span>
                </div>
              </a>
            </div>
          </div>

          <div className="z-10 mt-10 lg:mt-16 w-full max-w-[1440px] mx-auto px-4 lg:px-8">
            <div className="hidden lg:grid grid-cols-5 gap-4 xl:gap-8 relative">
              <div className="rounded-2xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20 transform -translate-y-8">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop"
                  alt="Fashion item 1"
                  className="w-full h-[280px] xl:h-[375px] object-cover"
                />
              </div>
              <div className="rounded-2xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20 transform translate-y-4">
                <img
                  src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop"
                  alt="Fashion item 2"
                  className="w-full h-[280px] xl:h-[375px] object-cover"
                />
              </div>
              <div className="rounded-2xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20 transform translate-y-16">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop"
                  alt="Fashion item 3"
                  className="w-full h-[280px] xl:h-[375px] object-cover"
                />
              </div>
              <div className="rounded-2xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20 transform translate-y-4">
                <img
                  src="https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400&h=500&fit=crop"
                  alt="Fashion item 4"
                  className="w-full h-[280px] xl:h-[375px] object-cover"
                />
              </div>
              <div className="rounded-2xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20 transform -translate-y-8">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop"
                  alt="Fashion item 5"
                  className="w-full h-[280px] xl:h-[375px] object-cover"
                />
              </div>
            </div>

            <div className="hidden md:grid lg:hidden grid-cols-3 gap-4 relative">
              <div className="rounded-2xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop"
                  alt="Fashion item 1"
                  className="w-full h-[240px] object-cover"
                />
              </div>
              <div className="rounded-2xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20 transform translate-y-8">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop"
                  alt="Fashion item 3"
                  className="w-full h-[240px] object-cover"
                />
              </div>
              <div className="rounded-2xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop"
                  alt="Fashion item 5"
                  className="w-full h-[240px] object-cover"
                />
              </div>
            </div>

            <div className="grid md:hidden grid-cols-2 gap-3 max-w-[280px] mx-auto relative">
              <div className="rounded-xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop"
                  alt="Fashion item 1"
                  className="w-full h-[160px] object-cover"
                />
              </div>
              <div className="rounded-xl border border-[#8451E1] overflow-hidden shadow-lg shadow-purple-500/20 transform translate-y-6">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=400&fit=crop"
                  alt="Fashion item 3"
                  className="w-full h-[160px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
