"use client";

import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItemProps {
  question: string;
  answer: string;
}

const faqs: FaqItemProps[] = [
  {
    question: "How does Luxela verify product authenticity?",
    answer:
      "Our team of experts reviews each item before it's listed. We use a combination of physical inspection, digital verification, and seller history to ensure all products are authentic.",
  },
  {
    question: "Can I sell my own designer items on Luxela?",
    answer:
      "Yes! You can apply to become a seller on Luxela. We'll guide you through the verification process to ensure a smooth onboarding experience.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept major credit cards, PayPal, and select cryptocurrencies including Bitcoin, Ethereum, and USDT.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Shipping times vary depending on your location and the seller's location. Typically, domestic orders arrive within 3-5 business days, while international orders may take 7-14 business days.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 14-day return policy for most items. Items must be returned in their original condition with tags attached. Some limited edition or custom items may be final sale.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can reach our customer support team via email at support@luxela.com or through the chat feature in your account. We're available 24/7 to assist you.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="how-to" className="z-10 py-20 px-4 bg-black relative">
      <main className="container layout mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center max-w-[1041px] mx-auto"
        >
          <h2 className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] -tracking-[3%] font-bold">
            Frequently Asked Questions
          </h2>
          <p className="text-sm md:text-lg text-[#BFBFBF] mt-5 mb-16">
            Get answers to common questions about shopping and selling on
            Luxela — the fashion marketplace redefining style through Web3 and
            digital ownership.
          </p>
        </motion.div>

        <div className="grid gap-6">
          {faqs.map((faq, index) => (
            <FaqItem
              key={index}
              faq={faq}
              index={index}
              isOpen={activeIndex === index}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </main>
    </section>
  );
}

interface FaqItemComponentProps {
  faq: FaqItemProps;
  index: number;
  isOpen: boolean;
  onToggle: (index: number) => void;
}

function FaqItem({ faq, index, isOpen, onToggle }: FaqItemComponentProps) {
  const accentColors = ["#E5E7EB", "#9CA3AF", "#E5E7EB", "#6B7280", "#D1D5DB"];
  const accentColor = accentColors[index % accentColors.length];
  const accentColorLight = accentColor + "15";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="w-full"
    >
      <div
        className="rounded-[16px] bg-gradient-to-t from-[#141414] to-[#2e2d2d] text-[#F6F6F6] flex items-center py-5 px-5 cursor-pointer border-2 transition-all duration-300 hover:shadow-lg group"
        style={{
          borderColor: isOpen ? accentColor : accentColor + "50",
          boxShadow: isOpen
            ? `0 0 15px ${accentColor}30, inset 0 0 10px ${accentColorLight}`
            : "none",
          background: `linear-gradient(to right, #141414, #2e2d2d), linear-gradient(to right, ${accentColorLight}, transparent)`,
        }}
        onClick={() => onToggle(index)}
      >
        <h3 className="font-medium text-sm md:text-base flex-1 tracking-tight">
          {faq.question}
        </h3>

        <ChevronDown
          className={`h-5 w-5 ml-auto transition-all duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{
            color: isOpen ? accentColor : "#BFBFBF",
          }}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="px-5 pt-3 text-[#BFBFBF] text-xs md:text-sm overflow-hidden ml-2 border-l-2 border-b-2 rounded-b-lg"
            style={{
              borderColor: accentColor,
              backgroundColor: accentColorLight,
            }}
          >
            <p className="pb-4">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}