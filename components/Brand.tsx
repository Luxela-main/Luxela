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
      "We do not exist as a singular element. Our genetic make up is a stepping stone to our individuality, but even then, our genetic make up is not a singular entity.",
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
    <section
      id="brands"
      className=" py-12 md:py-20 px-4 bg-black overflow-hidden"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <main className="relative z-10 layout  mx-auto">
        {/* --- Title + Mobile Controls --- */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-6 md:mb-0"
        >
          <h2 className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] tracking-[-0.03em] font-bold">
            Featured Brands on Luxela
          </h2>

          {/* Mobile-only Controls (sticky) */}
          <div className="flex items-center gap-3 sticky top-2 z-20 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-[#8451E1] bg-black/40 text-[#F9F9F9] hover:bg-[#8451E1]/30 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-[#8451E1] bg-black/40 text-[#F9F9F9] hover:bg-[#8451E1]/30 transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>

        {/* --- Scrollable Cards --- */}
        <motion.div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth mt-6 md:mt-12 pb-4 scrollbar-hide"
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
              className="min-w-[90%] md:min-w-[800px] p-4 md:p-6 bg-gradient-to-t from-[#141414] to-[#2c2b2b] rounded-[16px] md:rounded-[20px] flex flex-col md:flex-row items-center border border-[#8451E1]/60 hover:border-[#8451E1] hover:shadow-[0_0_20px_#8451E1]/30 transition-all duration-300"
            >
              <div className="md:w-[500px] flex-1">
                <motion.h3
                  className="text-lg md:text-[2rem] font-semibold text-[#F9F9F9]"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  {brand.title}
                </motion.h3>

                <motion.p
                  className="text-sm md:text-lg text-[#BFBFBF] my-4 md:pr-2 md:my-9"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {brand.description}
                </motion.p>

                <Link
                  href="/signup"
                  className="hidden md:inline-flex cursor-pointer items-center justify-center mt-4 md:mt-6 h-[38px] md:h-[42px] bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] hover:shadow-[0_0_20px_#8451E1]/30 transition text-white rounded-[6px] px-5 md:px-6"
                >
                  {brand.cta}
                </Link>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="max-w-[400px] "
              >
                <Image
                  src={brand.image}
                  width={500}
                  height={402}
                  alt={`Photo of ${brand.title}`}
                  className="rounded-xl object-cover aspect-[4/3] w-full"
                />
              </motion.div>

              {/* Mobile CTA */}
              <Link
                href="/signup"
                className="md:hidden w-full flex items-center justify-center mt-4 h-[38px] bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] hover:shadow-[0_0_20px_#8451E1]/30 transition text-white rounded-[6px] px-5"
              >
                {brand.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </section>
  );
}
