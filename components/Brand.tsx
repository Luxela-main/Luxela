"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import useAos from "./hooks/useAos";

interface Brand {
  title: string;
  description: string;
  image: string;
  cta: string;
}

const brands: Brand[] = [
  {
    title: "BAZ.NG",
    description:
      "We do not exist as a singular element. Our genetic make up is a stepping stone to our individuality, but even then, our genetic make up is not a singular entity. As we grow, we learn and unlearn, we experience and we forget, we take and we give back. There's more variation in our individuality per day.",
    image: "/images/baz-500x402.png",
    cta: "Shop Now",
  },
  {
    title: "HONORAH",
    description:
      "HONORAH- creates timeless pieces that elevate everyday moments and empower self-expression, Rooted in elegance and simplicity, as you Style Forward.",
    image: "/images/baz-500x402.png",
    cta: "Shop Now",
  },
];

export default function Brand() {
  useAos();
  return (
    <section id="brands" className="z-10 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <main className="max-w-6xl mx-auto">
        <div className="text-center max-w-[1041px] mx-auto mb-8 sm:mb-12 lg:mb-16">
          <h2
            className="text-[#F9F9F9] leading-[120%] text-xl sm:text-2xl md:text-[2rem] -tracking-[3%] font-bold"
            data-aos="slide-up">
            Featured Brands on Luxela
          </h2>
        </div>

        <div className="flex flex-col gap-6 lg:hidden">
          {brands.map((brand, index) => (
            <div
              key={brand.title}
              className="w-full bg-gradient-to-t from-[#141414] to-[#2c2b2b] rounded-[20px] p-5 sm:p-6 border-[0.75px] border-[#8451E1]"
              data-aos="fade-up"
              data-aos-delay={index * 100}>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#F9F9F9]">
                {brand.title}
              </h3>
              <p className="text-sm sm:text-base text-[#BFBFBF] mt-4 mb-6 leading-relaxed">
                {brand.description}
              </p>
              <div className="flex items-center justify-center mb-6">
                <Image
                  src={brand.image}
                  width={500}
                  height={402}
                  alt={`Photo of ${brand.title}`}
                  className="w-full h-auto max-w-[400px] rounded-lg"
                />
              </div>
              <Link
                href="#"
                className="w-full flex items-center cursor-pointer justify-center h-[42px] sm:h-[48px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] hover:opacity-90 transition text-white rounded-[6px] px-6 font-medium">
                {brand.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Desktop: Horizontal scroll */}
        <div className="hidden lg:block overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {brands.map((brand, index) => (
              <div
                key={brand.title}
                className={`${
                  index === 0
                    ? "w-[880px] xl:w-[1010px]"
                    : "w-[480px] xl:w-[500px]"
                } bg-gradient-to-t from-[#141414] to-[#2c2b2b] rounded-[20px] p-8 xl:p-10 flex flex-col ${
                  index === 0 ? "xl:flex-row" : ""
                } items-center gap-6 border-[0.75px] border-[#8451E1]`}
                data-aos="fade-up"
                data-aos-delay={index * 100}>
                <div className={index === 0 ? "xl:flex-1" : "w-full"}>
                  <h3 className="text-2xl xl:text-[2rem] font-semibold text-[#F9F9F9]">
                    {brand.title}
                  </h3>
                  <p className="text-base xl:text-lg text-[#BFBFBF] mt-6 mb-8 leading-relaxed">
                    {brand.description}
                  </p>
                  <Link
                    href="#"
                    className="inline-flex items-center cursor-pointer justify-center h-[48px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] hover:opacity-90 transition text-white rounded-[6px] px-8 font-medium">
                    {brand.cta}
                  </Link>
                </div>
                <div
                  className={
                    index === 0 ? "xl:flex-1 flex justify-center" : "w-full"
                  }>
                  <Image
                    src={brand.image}
                    width={500}
                    height={402}
                    alt={`Photo of ${brand.title}`}
                    className="w-full h-auto max-w-[450px] rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </section>
  );
}
