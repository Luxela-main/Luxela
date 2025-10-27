"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import React from "react";

interface GettingStarted {
  title: string;
  description: string;
  image: string;
  cta: string;
  href?: string;
}

const gettingStarted: GettingStarted[] = [
  {
    title: "Sign Up as a Seller",
    description:
      "Ready to go global? Join as an independent brand and get discovered by fashion lovers around the world.",
    image: "/images/gs1-432x349.png",
    cta: "Join as Seller",
    // href: "/signup/seller",
  },
  {
    title: "Sign Up as a Buyer",
    description:
      "Love fashion? Create an account to discover unique styles and enjoy secure, borderless transactions with exclusive perks on every purchase.",
    image: "/images/gs2-432x349.png",
    cta: "Join as Buyer",
    href: "/buyer",
  },
  {
    title: "Explore the Marketplace",
    description:
      "Browse unique, verified pieces from your favorite local brands and discover one-of-a-kind fashion that connects you to creators around the world.",
    image: "/images/gs3-432x349.png",
    cta: "Start Exploring",
    // href: "/marketplace",
  },
];

export default function GettingStarted() {
  return (
    <section id="getting-started" className="py-20 px-4 bg-black">
      <main className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center max-w-[1041px] mx-auto"
        >
          <h2 className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] tracking-[-0.03em] font-bold">
            Getting Started with Luxela
          </h2>
          <p className="text-[#BFBFBF] mt-5 mb-12 text-sm md:text-base">
            Join Luxela, the fashion marketplace where creators and fashion
            lovers come together. Sign up, connect with designers, and be part
            of a global community celebrating authenticity and creativity.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-9 items-stretch">
          {gettingStarted.map((started, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col justify-between rounded-[12px] bg-[#1A1A1A] overflow-hidden text-center border border-[#8451E1]/20 hover:border-[#8451E1]/40 transition-all duration-300"
            >
              <div className="w-full">
                <Image
                  width={432}
                  height={349}
                  src={started.image}
                  alt={started.title}
                  className="w-[432px] h-[349px] object-cover"
                />
              </div>

              <div className="px-6 py-8 h-full flex flex-col gap-3 justify-start">
                <h3 className="text-lg text-[#F6F6F6] font-semibold">
                  {started.title}
                </h3>
                <p className="text-sm text-[#BFBFBF]">
                  {started.description}
                </p>
                {started.href && (
                  <Link
                    href={started.href}
                    className="inline-flex items-center justify-center w-full h-[42px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] text-white font-medium rounded-[6px] hover:shadow-[0_0_20px_#8451E1]/30 transition"
                  >
                    {started.cta}
                  </Link>
                )}
              </div>

            </motion.div>
          ))}
        </div>
      </main>
    </section>
  );
}
