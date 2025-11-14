"use client";

import Image from "next/image";
import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

interface Feature {
  title: string;
  description: string;
  image: string;
}

const features: Feature[] = [
  {
    title: "Make Payment in Crypto and Local Currency",
    description:
      "Fast, secure, borderless payments on Luxela. Pay in crypto or local currency with just a 1% fee and ultra-low gas costs (less than $0.001).",
    image: "/images/payment-620x672.png",
  },
  {
    title: "Be Closer to Your Favorite Designer",
    description:
      "Connect with your favourite designers, explore their stories, and shop exclusive collections. Support the creators you love, all in one seamless fashion marketplace.",
    image: "/images/nft-620x672.png",
  },
  {
    title: "Verified Authenticity",
    description:
      "Every item is verified for quality and authenticity, ensuring you get real fashion from real creators — exactly as it appears.",
    image: "/images/nft-620x672.png",
  },
];

export default function Feature() {
  useEffect(() => {
    AOS.init({
      duration: 800, // Smooth but snappy
      easing: "ease-in-out", // Natural motion
      offset: 120, // Trigger earlier
      once: true, // Animate only once
    });
  }, []);

  return (
    <section
      id="feature"
      className="z-10 py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#1A1A1A]"
    >
      <main className="grid gap-12 sm:gap-20 lg:gap-32 xl:gap-40 layout mx-auto">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className={`w-full p-5 sm:p-8 lg:p-10 rounded-[20px] flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } items-center gap-6 sm:gap-8 lg:gap-[30px]`}
          >
            {/* Text Section */}
            <div
              className="flex-1 w-full"
              data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
              data-aos-delay="100"
            >
              <h3 className="text-xl sm:text-2xl lg:text-[1.75rem] xl:text-[2rem] font-semibold text-[#F9F9F9] leading-tight transition-transform duration-500 ease-out hover:translate-y-[-3px]">
                {feature.title}
              </h3>
              <p
                className="text-sm sm:text-base lg:text-lg text-[#BFBFBF] mt-4 sm:mt-6 lg:mt-9 leading-relaxed"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                {feature.description}
              </p>
            </div>

            {/* Image Section */}
            <div
              className="flex-1 w-full flex items-center justify-center"
              data-aos={index % 2 === 0 ? "fade-left" : "fade-right"}
              data-aos-delay="150"
            >
              <Image
                src={feature.image}
                width={620}
                height={672}
                alt={feature.title}
                className="w-full h-auto max-w-[400px] sm:max-w-[500px] lg:max-w-full rounded-lg shadow-lg transition-transform duration-700 ease-out hover:scale-105"
              />
            </div>
          </div>
        ))}
      </main>
    </section>
  );
}
