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
    <section id="brands" className="z-10  py-20 px-4">
      <main className="max-w-6xl mx-auto">
        <div className="text-center max-w-[1041px] mx-auto">
          <h2
            className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] -tracking-[3%] font-bold"
            data-aos="slide-up">
            Featured Brands on Luxela
          </h2>
        </div>
        <div className="flex space-x-6 overflow-x-hidden w-full mt-12">
          {brands.map((brand, index) => (
            <div
              key={brand.description}
              className={`${
                index === 0
                  ? "min-w-[80%] lg:min-w-[1010px]"
                  : "w-full lg:min-w-[500px]"
              } min-h-[617px] p-6 bg-gradient-to-t from-[#141414] to-[#2c2b2b] rounded-[20px] py-3 lg:py-24 px-6 flex flex-col lg:flex-row items-center space-x-6 border-[0.75px] border-[#8451E1] ${
                index === brands.length - 1 ? "mr-[250px]" : ""
              }`}>
              <div className={`lg:w-[500px]`}>
                <h3 className="text-lg lg:text-[2rem] font-semibold text-[#F9F9F9]">
                  {brand.title}
                </h3>
                <p className="text-sm lg:text-lg text-[#BFBFBF] my-9">
                  {brand.description}
                </p>
                <Link
                  href="#"
                  className="hidden lg:inline-flex cursor-pointer items-center justify-center mt-6 h-[42px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] transition text-white rounded-[6px] px-6">
                  Shop now
                </Link>
              </div>
              {/* image */}
              <Image
                src={brand.image}
                width={500}
                height={402}
                alt={`Photo of ${brand.title}`}
                className="my-9 lg:my-0"
              />
              {/* cta */}
              <Link
                href="#"
                className="lg:hidden w-full flex items-center cursor-pointer justify-center mt-6 h-[42px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] transition text-white rounded-[6px] px-6">
                Shop now
              </Link>
            </div>
          ))}
        </div>
      </main>
    </section>
  );
}
