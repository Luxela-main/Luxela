"use client";

import Image from "next/image";
import React from "react";
import useAos from "./hooks/useAos";

export default function About() {
  useAos();
  return (
    <section id="about" className="z-10  py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center max-w-[1041px] mx-auto">
          <h2
            className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] -trackin-[3%] font-bold"
            data-aos="slide-right">
            About Luxela
          </h2>
          <p
            className="text-sm md:text-lg text-[#BFBFBF] mt-5 mb-16"
            data-aos="slide-left">
            Luxela is a fashion marketplace where buyers connect directly with
            designers and shop exclusive collections. Enjoy seamless payments
            with fiat or digital assets, low fees, and a secure,
            community-driven experience. We empower small creators with global
            access and offer a trusted space for discovering authentic style. 
          </p>
        </div>
        <div className="max-w-[1240px] mx-auto" data-aos="flip-right">
          <Image
            src={"/images/about-1240x802.png"}
            width={1240}
            height={802}
            alt="Luxela."
          />
        </div>
      </div>
    </section>
  );
}
