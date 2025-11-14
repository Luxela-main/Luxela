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
  { name: "S", image: "/images/s.svg" },
];

export default function Partners() {
  useAos();
  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section
      id="partner"
      className="z-10 py-20 relative w-full overflow-hidden"
    >
      <main className="container layout mx-auto text-center">
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
              className="flex-shrink-0 flex items-center justify-center w-[150px] h-[100px] mx-8"
            >
              <Image
                width={150}
                height={50}
                src={partner.image}
                alt={partner.name}
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </Marquee>
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
      <div className="pointer-events-none absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-[#0E0E0E] to-transparent z-10" />
      <div className="pointer-events-none absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-[#0E0E0E] to-transparent z-10" />

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
