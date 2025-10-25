import Image from "next/image";
import React from "react";

interface GettingStarted {
  title: string;
  description: string;
  image: string;
}

const gettingStarted: GettingStarted[] = [
  {
    title: "Sign Up as a Seller",
    description:
      "Ready to go global? Join as an independent brand and get discovered by fashion lovers around the world.",
    image: "/images/gs1-432x349.png",
  },
  {
    title: "Sign Up as a Buyer",
    description:
      "Love fashion? Create an account to discover unique styles and enjoy secure, borderless transactions with exclusive perks on every purchase.",
    image: "/images/gs2-432x349.png",
  },
  {
    title: "Explore the Marketplace",
    description:
      "Browse unique, verified pieces from your favorite local brands and discover one-of-a-kind fashion that connects you to creators around the world.",
    image: "/images/gs3-432x349.png",
  },
];

export default function GettingStarted() {
  return (
    <section
      id="getting-started"
      className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <main className="max-w-6xl mx-auto">
        <div className="text-center max-w-[1041px] mx-auto mb-8 sm:mb-12 lg:mb-16">
          <h2
            className="text-[#F9F9F9] leading-[120%] text-xl sm:text-2xl md:text-[2rem] -tracking-[3%] font-bold"
            data-aos="slide-right">
            Getting Started with Luxela
          </h2>
          <p
            className="text-[#BFBFBF] mt-4 sm:mt-5 text-sm sm:text-base md:text-lg max-w-[900px] mx-auto leading-relaxed"
            data-aos="fade-up">
            Join Luxela, the fashion marketplace where fashion creators and
            fashion lovers come together. Sign up, connect with passionate
            designers and be part of a global community that celebrates
            authenticity and creativity in fashion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-9">
          {gettingStarted.map((started, index) => (
            <div
              key={index}
              className="flex flex-col rounded-[12px] bg-[#1A1A1A] overflow-hidden hover:transform hover:scale-105 transition-transform duration-300"
              data-aos={index % 2 === 0 ? "fade-up" : "fade-down"}
              data-aos-delay={index * 100}>
              <div className="relative w-full aspect-[432/349] overflow-hidden">
                <Image
                  width={432}
                  height={349}
                  src={started.image}
                  alt={started.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <h3 className="mb-3 text-base sm:text-lg lg:text-xl text-[#F6F6F6] font-semibold leading-tight">
                  {started.title}
                </h3>
                <p className="text-sm sm:text-base text-[#BFBFBF] leading-relaxed">
                  {started.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </section>
  );
}
