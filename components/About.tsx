"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import React from "react";

export default function About() {
  return (
    <section id="about" className="z-10 py-20 px-4 mt-20">
      <div className="container layout mx-auto">
        {/* Heading + Paragraph */}
        <div className="text-center max-w-[1041px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] tracking-[-0.03em] font-bold"
          >
            About Luxela
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-sm md:text-lg lg:w-[80%] mx-auto text-[#BFBFBF] mt-5 mb-16"
          >
            Luxela is a fashion marketplace where buyers connect directly with
            designers and shop exclusive collections. Enjoy seamless payments
            with fiat or digital assets, low fees, and a secure,
            community-driven experience. We empower small creators with global
            access and offer a trusted space for discovering authentic style.
          </motion.p>
        </div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
          whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
          className="w-full flex justify-center"
        >
          <Image
            src="/images/about-1240x802.png"
            width={1440}
            height={802}
            alt="Luxela."
            className="rounded-2xl shadow-lg"
          />
        </motion.div>
      </div>
    </section>
  );
}
