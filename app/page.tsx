"use client"

import { useState } from "react"
import Image from "next/image"
import {  ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import Partners from "@/components/Partners"
import About from "@/components/About"
import Feature from "@/components/Feature"
import Brand from "@/components/Brand"
import GettingStarted from "@/components/GettingStarted"

export default function LandingPage() {

  return (
    <main>
      {/* header */}
      <Header/>           

        {/* Partners Section */}
        <Partners />

        {/* About Section */}
        <About/>

        {/* Featured Brands Section */}
        <Feature />
        <Brand />

        {/* Getting Started Section */}
<GettingStarted />
      

        {/* FAQ Section */}
        <section id="how-to" className="py-20 px-4 bg-[#0D0D0D]">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <FaqItem
                question="How does Luxela verify product authenticity?"
                answer="Our team of experts reviews each item before it's listed. We use a combination of physical inspection, digital verification, and seller history to ensure all products are authentic."
              />
              <FaqItem
                question="Can I sell my own designer items on Luxela?"
                answer="Yes! You can apply to become a seller on Luxela. We'll guide you through the verification process to ensure a smooth onboarding experience."
              />
              <FaqItem
                question="What payment methods are accepted?"
                answer="We accept major credit cards, PayPal, and select cryptocurrencies including Bitcoin, Ethereum, and USDT."
              />
              <FaqItem
                question="How long does shipping take?"
                answer="Shipping times vary depending on your location and the seller's location. Typically, domestic orders arrive within 3-5 business days, while international orders may take 7-14 business days."
              />
              <FaqItem
                question="What is your return policy?"
                answer="We offer a 14-day return policy for most items. Items must be returned in their original condition with tags attached. Some limited edition or custom items may be final sale."
              />
              <FaqItem
                question="How do I contact customer support?"
                answer="You can reach our customer support team via email at support@luxela.com or through the chat feature in your account. We're available 24/7 to assist you."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Embrace the Future of Fashion</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of fashion enthusiasts already experiencing the next generation of online shopping.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 py-6 text-lg">
              Get started now
            </Button>
          </div>
        </section>
    

      {/* Footer */}
      <Footer/>
    </main>
  )
}

interface FaqItemProps {
  question: string
  answer: string
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-800 pb-4">
      <button className="flex justify-between items-center w-full text-left py-4" onClick={() => setIsOpen(!isOpen)}>
        <h3 className="font-medium">{question}</h3>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-400">
          <p>{answer}</p>
        </div>
      )}
    </div>
  )
}
