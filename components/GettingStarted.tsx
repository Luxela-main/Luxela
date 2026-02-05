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
    href: "/signup",
  },
  {
    title: "Sign Up as a Buyer",
    description:
      "Love fashion? Create an account to discover unique styles and enjoy secure, borderless transactions with exclusive perks on every purchase.",
    image: "/images/gs2-432x349.png",
    cta: "Join as Buyer",
    href: "/signup",
  },
  {
    title: "Explore the Marketplace",
    description:
      "Browse unique, verified pieces from your favorite local brands and discover one-of-a-kind fashion that connects you to creators around the world.",
    image: "/images/gs3-432x349.png",
    cta: "Start Exploring",
    href: "/buyer",
  },
];

export default function GettingStarted() {
  return (
    <section id="getting-started" className="py-20 px-4 bg-black">
      <main className="layout mx-auto">
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
        <div className="flex flex-wrap justify-center md:justify-start lg:justify-between gap-4">
          {gettingStarted.map((started, index) => {
            const accentColors = ["#E5E7EB", "#6B7280", "#D1D5DB"];
            const accentColor = accentColors[index % accentColors.length];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.3 }}
                className="flex flex-col justify-between rounded-[12px] bg-[#1A1A1A] overflow-hidden text-center border-2 hover:shadow-lg transition-all duration-300 w-full sm:w-[calc(50%-1.125rem)] lg:w-[calc(33.333%-1.125rem)] group relative"
                style={{
                  borderColor: accentColor + "40",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    accentColor + "80";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 30px ${accentColor}30`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    accentColor + "40";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Accent corner decoration */}
                <div
                  className="absolute top-0 right-0 w-1 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
                  }}
                ></div>
                <div
                  className="absolute bottom-0 left-0 w-12 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(to right, ${accentColor}, transparent)`,
                  }}
                ></div>

                {/* Image */}
                <div className="max-w-[432px] overflow-hidden">
                  <Image
                    width={432}
                    height={349}
                    src={started.image}
                    alt={started.title}
                    className="w-full h-[349px] object-cover object-center transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Content */}
                <div className="px-6 py-8 h-full flex flex-col gap-3 justify-start">
                  <h3 className="text-lg text-[#F6F6F6] font-semibold relative pb-2">
                    {started.title}
                    <span
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-0 group-hover:w-12 transition-all duration-300"
                      style={{
                        backgroundColor: accentColor,
                      }}
                    ></span>
                  </h3>
                  <p className="text-sm text-[#BFBFBF]">{started.description}</p>
                  {started.href && (
                    <Link
                      href={started.href}
                      className="mt-auto inline-flex items-center justify-center w-full h-[42px] bg-gradient-to-b from-[#8451E1] via-[#8451E1] to-[#5C2EAF] text-white font-medium rounded-[6px] hover:shadow-[0_0_20px_#8451E1]/30 transition border border-[#8451E1]/30 hover:border-[#8451E1]/60"
                      style={{
                        boxShadow: `inset 0 0 10px ${accentColor}15`,
                      }}
                    >
                      {started.cta}
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </section>
  );
}