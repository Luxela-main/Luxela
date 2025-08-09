"use client";

import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

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
    <section id="how-to" className="z-10  py-20 px-4">
      <main className="container max-w-6xl mx-auto">
        <div className="text-center max-w-[1041px] mx-auto">
          <h2
            className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] -tracking-[3%] font-bold"
            data-aos="slide-right">
            Frequently Asked Questions
          </h2>
          <p
            className="text-sm md:text-lg text-[#BFBFBF] mt-5 mb-16"
            data-aos="slide-left">
            Get answers to common questions about shopping and selling on
            Luxela, the fashion marketplace built for creators and fashion
            lovers.
          </p>
        </div>
        <div className="grid gap-9">
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

interface FaqItemProps {
  question: string;
  answer: string;
}

interface FaqItemComponentProps {
  faq: FaqItemProps;
  index: number;
  isOpen: boolean;
  onToggle: (index: number) => void;
}

function FaqItem({ faq, index, isOpen, onToggle }: FaqItemComponentProps) {
  return (
    <div className="w-full">
      <div
        data-aos={`${index / 2 === 0 ? "flip-down" : "flip-up"}`}
        className="rounded-[16px] text-[#F6F6F6]  bg-gradient-to-t from-[#141414] to-[#2e2d2d] flex items-center py-4 cursor-pointer px-4"
        onClick={() => onToggle(index)}>
        <h3 className="font-medium text-sm md:text-base flex-1">
          {faq.question}
        </h3>

        <ChevronDown
          className={`h-5 w-5 ml-auto transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="p-4 text-[#BFBFBF] text-xs md:text-sm max-w-[1106px]">
          <p>{faq.answer}</p>
        </div>
      )}
    </div>
  );
}
