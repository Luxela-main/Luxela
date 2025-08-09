import Link from "next/link";
import React from "react";

export default function CTA() {
  return (
    <section id="how-to" className="relative py-20 px-4">
      <main className="container max-w-6xl mx-auto">
        <div
          className="text-center max-w-[1320px] bg-[#1A1A1A] mx-auto py-20 px-6 lg:px-32"
          data-aos="flip-up">
          <h2
            className="text-[#F9F9F9] leading-[120%] text-2xl md:text-[2rem] -tracking-[3%] font-bold"
            data-aos="slide-up">
            Embrace the Future of Fashion
          </h2>
          <p
            className="text-sm md:text-lg text-[#BFBFBF] mt-5 mb-16"
            data-aos="slide-down">
            Ready to discover fashion in a new way? Join Luxela today to explore
            exclusive styles, support your favorite designers, and connect with
            a global community.
          </p>
          {/* cta */}
          <Link
            href="#"
            className="cursor-pointer w-full max-w-[230px] mx-auto flex items-center justify-center mt-6 h-[42px] bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] transition text-white rounded-[10px] px-6"
            data-aos="fade-up">
            Shop now
          </Link>
        </div>
      </main>
    </section>
  );
}
