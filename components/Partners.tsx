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
      className="z-10 py-20 relative  w-full overflow-hidden">
      <main className="container max-w-6xl mx-auto 2xl:mt-20 mt-[150px] lg:mt-[400px]">
        <div className="">
          <h2
            className="text-[#F9F9F9] text-center text-2xl md:text-[2rem] font-bold -tracking-[3%] mb-16"
            data-aos="slide-down">
            Our Trusted Partners
          </h2>
          <div className="flex items-center space-x-9">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={index}
                className="flex items-center justify-center h-[71px]"
                data-aos={index / 2 === 0 ? "flip-right" : "flip-left"}>
                <Image
                  width={432}
                  height={71}
                  src={partner.image}
                  alt={partner.name}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </section>
  );
}
