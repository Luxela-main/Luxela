import Link from "next/link";
import React from "react";

export default function CTA() {
  return (
    <section id="join-luxela" className="relative py-24 px-4 overflow-hidden">
      <main className="layout mx-auto">
        <div
          className="text-center max-w-[1320px] mx-auto py-20 px-6 lg:px-32 rounded-[20px] border border-[#8451E1]/20 shadow-[0_0_40px_-10px_#8451E1]/20 backdrop-blur-md transition-all duration-700 hover:border-[#8451E1]/40 hover:shadow-[0_0_10px_-10px_#8451E1]/40"
        >
          <h2
            className="text-[#F9F9F9] text-3xl md:text-[2.5rem] font-bold tracking-tight leading-[120%]
            animate-fade-slide-up"
          >
            Embrace the Future of Fashion
          </h2>

          <p
            className="text-[#BFBFBF] text-base md:text-lg mt-5 mb-14 max-w-2xl mx-auto
            animate-fade-slide-up [animation-delay:200ms]"
          >
            Step into the world where digital meets couture. Discover authentic,
            verified luxury pieces and support visionary designers shaping the
            decentralized fashion movement.
          </p>

          <Link
            href="/signup"
            className="relative inline-flex items-center justify-center px-8 h-[48px] text-white font-medium rounded-[10px] bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] shadow-[0_0_25px_#8451E1]/30 transition-all duration-500 hover:shadow-[0_0_10px_#8451E1]/50 hover:-translate-y-[0.5px] animate-fade-slide-up [animation-delay:400ms]"
          >
            Shop Now
          </Link>
        </div>
      </main>

    </section>
  );
}
