"use client";

import Image from "next/image";
import React from "react";
import useAos from "./hooks/useAos";

interface Partner {
  name: string;
  image: string;
}

const partners: Partner[] = [
  { name: "Solana", image: "/images/solana-foundation-432x71.svg" },
  { name: "Solana", image: "/images/solana-sol-logo-horizontal 1-283x70.svg" },
  { name: "Solana", image: "/images/superteam.svg" },
];

export default function Partners() {
  useAos();
  return (
    <section
      id="#partner"
      className="z-10 py-12 md:py-20 relative w-full overflow-hidden">
      <main className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-20 lg:mt-[150px] 2xl:mt-20">
        <div>
          <h2
            className="text-[#F9F9F9] text-center text-xl sm:text-2xl md:text-[2rem] font-bold -tracking-[3%] mb-8 sm:mb-12 md:mb-16"
            data-aos="slide-down">
            Our Trusted Partners
          </h2>

          <div className="flex flex-col sm:hidden items-center space-y-8">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-full max-w-[280px]"
                data-aos="fade-up"
                data-aos-delay={index * 100}>
                <Image
                  width={432}
                  height={71}
                  src={partner.image}
                  alt={partner.name}
                  className="w-full h-auto max-h-[60px] object-contain"
                />
              </div>
            ))}
          </div>

          {/* Tablet: 2 columns grid */}
          <div className="hidden sm:grid md:hidden grid-cols-2 gap-8 items-center justify-items-center max-w-xl mx-auto">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-full max-w-[240px]"
                data-aos="flip-right"
                data-aos-delay={index * 100}>
                <Image
                  width={432}
                  height={71}
                  src={partner.image}
                  alt={partner.name}
                  className="w-full h-auto max-h-[65px] object-contain"
                />
              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-9 flex-wrap">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="flex items-center justify-center h-[50px] lg:h-[65px] xl:h-[71px] w-[200px] lg:w-[280px] xl:w-[350px]"
                data-aos={index % 2 === 0 ? "flip-right" : "flip-left"}
                data-aos-delay={index * 100}>
                <Image
                  width={432}
                  height={71}
                  src={partner.image}
                  alt={partner.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </section>
  );
}
