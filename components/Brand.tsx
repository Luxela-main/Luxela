"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      "HONORAH creates timeless pieces that elevate everyday moments and empower self-expression. Rooted in elegance and simplicity — Style Forward.",
    image: "/images/baz-500x402.png",
    cta: "Shop Now",
  },
  {
    title: "LUXE BEAUTY",
    description:
      "A curated selection of modern beauty essentials that celebrate natural radiance and timeless confidence.",
    image: "/images/baz-500x402.png",
    cta: "Discover",
  },
];

export default function Brand() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = direction === "left" ? -clientWidth : clientWidth;
      scrollRef.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
<<<<<<< HEAD
    <section
      id="brands"
      className="relative z-10 py-20 px-4 bg-black overflow-hidden"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <main className="max-w-6xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center max-w-[1041px] mx-auto"
        >
          <h2 className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] tracking-[-0.03em] font-bold">
            Featured Brands on Luxela
          </h2>
        </motion.div>

        {/* Scrollable Cards */}
        <motion.div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth mt-12 pb-4 scrollbar-hide"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.25 } },
          }}
        >
          {brands.map((brand) => (
            <motion.div
              key={brand.title}
              variants={{
                hidden: { opacity: 0, y: 60 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="min-w-[80%] lg:min-w-[800px] min-h-[417px] p-6 bg-gradient-to-t from-[#141414] to-[#2c2b2b] rounded-[20px] flex flex-col lg:flex-row items-center space-x-6 border border-[#8451E1]/60 hover:border-[#8451E1] hover:shadow-[0_0_20px_#8451E1]/30 transition-all duration-300"
            >
              <div className="lg:w-[500px]">
                <motion.h3
                  className="text-lg lg:text-[2rem] font-semibold text-[#F9F9F9]"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  {brand.title}
                </motion.h3>

                <motion.p
                  className="text-sm lg:text-lg text-[#BFBFBF] my-9"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {brand.description}
                </motion.p>

                <Link
                  href="/signup"
                  className="hidden lg:inline-flex cursor-pointer items-center justify-center mt-6 h-[42px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] hover:shadow-[0_0_20px_#8451E1]/30 transition text-white rounded-[6px] px-6"
                >
                  {brand.cta}
                </Link>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Image
                  src={brand.image}
                  width={500}
                  height={402}
                  alt={`Photo of ${brand.title}`}
                  className="my-9 lg:my-0 rounded-xl"
                />
              </motion.div>

              {/* CTA (mobile) */}
              <Link
                href="/signup"
                className="lg:hidden w-full flex items-center cursor-pointer justify-center mt-6 h-[42px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] hover:shadow-[0_0_20px_#8451E1]/30 transition text-white rounded-[6px] px-6"
              >
=======
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
>>>>>>> 1fe315a3957820117c309504e2a48311af9fb691
                {brand.cta}
              </Link>
            </motion.div>
          ))}
<<<<<<< HEAD
        </motion.div>

        {/* Navigation Buttons (overlayed) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovering ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-1/2 left-0 right-0 flex justify-between px-4 -translate-y-1/2 pointer-events-none"
        >
          <button
            onClick={() => scroll("left")}
            className="pointer-events-auto p-3 rounded-full border border-[#8451E1] bg-black/40 text-[#F9F9F9] hover:bg-[#8451E1]/30 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="pointer-events-auto p-3 rounded-full border border-[#8451E1] bg-black/40 text-[#F9F9F9] hover:bg-[#8451E1]/30 transition"
          >
            <ChevronRight size={24} />
          </button>
        </motion.div>
=======
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
>>>>>>> 1fe315a3957820117c309504e2a48311af9fb691
      </main>
    </section>
  );
}
