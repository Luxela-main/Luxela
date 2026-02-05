import Link from "next/link";
import React from "react";

export default function CTA() {
  return (
    <section id="join-luxela" className="relative py-24 px-4 overflow-hidden">
      <main className="layout mx-auto">
        <div
          className="text-center max-w-[1320px] mx-auto py-20 px-6 lg:px-32 rounded-[20px] border-2 shadow-[0_0_40px_-10px_#8451E1]/20 backdrop-blur-md transition-all duration-700 hover:shadow-[0_0_10px_-10px_#8451E1]/40 relative overflow-hidden group"
          style={{
            borderColor: "#6B7280",
            background: `linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(44, 43, 43, 0.95)), linear-gradient(to right, #6B728008, transparent)`,
          }}
        >
          {/* Accent decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700" style={{
            background: `radial-gradient(circle, #6B7280, transparent)`,
          }}></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-700" style={{
            background: `radial-gradient(circle, #D1D5DB, transparent)`,
          }}></div>

          {/* Content */}
          <div className="relative z-10">
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
              href="/buyer"
              className="relative inline-flex items-center justify-center px-8 h-[48px] text-white font-medium rounded-[10px] bg-gradient-to-b from-[#8451E1] via-[#8451E1] to-[#5C2EAF] shadow-[0_0_25px_#8451E1]/30 transition-all duration-500 hover:shadow-[0_0_10px_#8451E1]/50 hover:-translate-y-[0.5px] animate-fade-slide-up [animation-delay:400ms] border border-[#D1D5DB]/30 hover:border-[#D1D5DB]/60"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </main>
    </section>
  );
}