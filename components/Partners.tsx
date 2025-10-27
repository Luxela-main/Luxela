"use client";

import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import useAos from "./hooks/useAos";

interface Partner {
  name: string;
  image: string;
}

const partners: Partner[] = [
  { name: "Solana Foundation", image: "/images/solana-foundation-432x71.svg" },
  { name: "Solana", image: "/images/solana-sol-logo-horizontal 1-283x70.svg" },
  { name: "Superteam", image: "/images/superteam.svg" },
];

export default function Partners() {
  useAos();
  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section
<<<<<<< HEAD
      id="partner"
      className="z-10 pt-40 pb-20 relative w-full overflow-hidden bg-black"
    >
      <main className="container max-w-6xl mx-auto text-center">
        <h2
          className="text-[#F9F9F9] text-2xl md:text-[2rem] font-bold -tracking-[3%] mb-16"
          data-aos="slide-down"
        >
          Our Trusted Partners
        </h2>

        <Marquee speed={80}>
          {duplicatedPartners.map((partner, index) => (
            <div
              key={index}
              className="flex-shrink-0 flex items-center justify-center h-[50px] mx-8"
            >
              <Image
                width={140}
                height={50}
                src={partner.image}
                alt={partner.name}
                className="h-full w-auto object-contain"
              />
            </div>
          ))}
        </Marquee>
=======
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
>>>>>>> 1fe315a3957820117c309504e2a48311af9fb691
      </main>
    </section>
  );
}

/**
 * Infinite scrolling marquee with hover pause
 */
function Marquee({
  children,
  speed = 100,
}: {
  children: React.ReactNode;
  speed?: number;
}) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [paused, setPaused] = useState(false);

  // Measure container width after render
  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.scrollWidth / 2);
    }
  }, [children]);

  // Continuous scroll animation
  useAnimationFrame((_, delta) => {
    if (paused || width === 0) return;
    let moveBy = (speed / 1000) * delta;
    let currentX = x.get();
    if (currentX <= -width) currentX = 0;
    x.set(currentX - moveBy);
  });

  return (
    <div
      className="relative flex overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* fade mask edges */}
      <div className="pointer-events-none absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-black to-transparent z-10" />
      <div className="pointer-events-none absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-black to-transparent z-10" />

      <motion.div
        ref={containerRef}
        className="flex whitespace-nowrap"
        style={{ x }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
