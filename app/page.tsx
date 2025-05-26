"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, ChevronDown, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/Button"
import MobileMenu from "@/components/mobile-menu"
import Footer from "@/components/Footer"
import Header from "@/components/Header"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className=" ">
      
      {/* Mobile Menu Overlay */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {/* header */}
      <Header/>
     

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-28">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  Authentic Fashion, <span className="text-purple-500">Global Reach</span>
                </h1>
                <p className="text-gray-400 mb-8 max-w-lg">
                  A New Era of E-commerce where fashion meets technology. Shop authentic designer pieces from around the
                  world with secure payments and verified authenticity.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 py-6">
                    Shop now
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800 text-white rounded-full px-8 py-6"
                  >
                    Sell with us
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden h-48 md:h-64 relative">
                    <Image
                      src="/placeholder.svg?height=400&width=300"
                      alt="Fashion item"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden h-48 md:h-64 relative">
                    <Image
                      src="/placeholder.svg?height=400&width=300"
                      alt="Fashion item"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="mt-8">
                  <div className="rounded-xl overflow-hidden h-48 md:h-64 relative">
                    <Image
                      src="/placeholder.svg?height=400&width=300"
                      alt="Fashion item"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden h-48 md:h-64 relative mt-4">
                    <Image
                      src="/placeholder.svg?height=400&width=300"
                      alt="Fashion item"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="py-16 bg-[#0D0D0D]">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-lg text-gray-400 mb-10">Our Trusted Partners</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="flex justify-center">
                <Image src="/placeholder.svg?height=50&width=150" alt="Partner logo" width={150} height={50} />
              </div>
              <div className="flex justify-center">
                <Image src="/placeholder.svg?height=50&width=150" alt="Partner logo" width={150} height={50} />
              </div>
              <div className="flex justify-center">
                <Image src="/placeholder.svg?height=50&width=150" alt="Partner logo" width={150} height={50} />
              </div>
              <div className="flex justify-center">
                <Image src="/placeholder.svg?height=50&width=150" alt="Partner logo" width={150} height={50} />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">About Luxela</h2>
            <p className="text-gray-400 max-w-3xl mb-16">
              Luxela is a revolutionary e-commerce platform connecting fashion enthusiasts with authentic designer
              pieces from around the world. Our platform ensures secure transactions, verified authenticity, and a
              seamless shopping experience for both buyers and sellers.
            </p>

            {/* Feature 1: Platform Preview */}
            <div className="mb-24">
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6 md:p-10">
                <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=800&width=1200"
                    alt="Luxela platform preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Feature 2: Payment Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 items-center">
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">Make Payments in Crypto and Local Currency</h3>
                <p className="text-gray-400 mb-6">
                  Flexible payment options to suit your preferences. Pay with popular cryptocurrencies or your local
                  currency, making transactions seamless no matter where you are in the world.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6">Learn more</Button>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6">
                <div className="relative h-[250px] rounded-xl overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=500&width=600"
                    alt="Payment options"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Feature 3: Designers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 items-center">
              <div className="order-2 md:order-1 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6">
                <div className="relative h-[250px] rounded-xl overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=500&width=600"
                    alt="Designer collections"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-xl md:text-2xl font-bold mb-4">Get Closer to Your Favorite Designers</h3>
                <p className="text-gray-400 mb-6">
                  Connect with top fashion designers from around the world. Discover exclusive collections and limited
                  edition pieces that you won't find anywhere else.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6">
                  Explore designers
                </Button>
              </div>
            </div>

            {/* Feature 4: Authenticity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 items-center">
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-4">Verified Authenticity</h3>
                <p className="text-gray-400 mb-6">
                  Every item on Luxela goes through a rigorous authentication process. Shop with confidence knowing that
                  what you're buying is 100% authentic and as described.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6">
                  Our verification process
                </Button>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6">
                <div className="relative h-[250px] rounded-xl overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=500&width=600"
                    alt="Authenticity verification"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Brands Section */}
        <section id="brands" className="py-20 px-4 bg-[#0D0D0D]">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">Featured Brands on Luxela</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#121212] rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full mr-4"></div>
                  <div>
                    <h3 className="font-bold">NYLON</h3>
                    <p className="text-sm text-gray-400">Premium Streetwear</p>
                  </div>
                </div>
                <div className="relative h-[300px] rounded-lg overflow-hidden mb-4">
                  <Image src="/placeholder.svg?height=600&width=800" alt="NYLON brand" fill className="object-cover" />
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Cutting-edge streetwear with a focus on sustainable materials and bold designs. NYLON has been at the
                  forefront of urban fashion since 2015.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-full">
                  Shop collection
                </Button>
              </div>

              <div className="bg-[#121212] rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full mr-4"></div>
                  <div>
                    <h3 className="font-bold">ELEVATION</h3>
                    <p className="text-sm text-gray-400">Luxury Essentials</p>
                  </div>
                </div>
                <div className="relative h-[300px] rounded-lg overflow-hidden mb-4">
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    alt="ELEVATION brand"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Minimalist luxury with attention to detail. ELEVATION creates timeless pieces that elevate any
                  wardrobe with subtle sophistication.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-full">
                  Shop collection
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section id="features" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">Getting Started with Luxela</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative h-[200px] rounded-xl overflow-hidden mb-6">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    alt="Create account"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-bold mb-2">Create an Account</h3>
                <p className="text-gray-400 text-sm">
                  Sign up in minutes with just your email. Verify your identity to unlock all features and start
                  shopping.
                </p>
              </div>

              <div className="text-center">
                <div className="relative h-[200px] rounded-xl overflow-hidden mb-6">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    alt="Browse collections"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-bold mb-2">Browse Collections</h3>
                <p className="text-gray-400 text-sm">
                  Explore thousands of authentic items from top designers and brands from around the world.
                </p>
              </div>

              <div className="text-center">
                <div className="relative h-[200px] rounded-xl overflow-hidden mb-6">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    alt="Secure checkout"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-bold mb-2">Secure Checkout</h3>
                <p className="text-gray-400 text-sm">
                  Choose your payment method and complete your purchase with our secure checkout process.
                </p>
              </div>
            </div>
          </div>
        </section>

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
      </main>

      {/* Footer */}
      <Footer/>
    </header>
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
