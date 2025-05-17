"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, ChevronDown, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/Button"
import MobileMenu from "@/components/mobile-menu"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="landing-page min-h-screen">
      {/* Mobile Menu Overlay */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
              <div className="w-6 h-6 bg-[#0A0A0A] rounded-full"></div>
            </div>
            <span className="text-xl font-semibold tracking-wider">LUXELA</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-6">
              <Link href="#about" className="text-sm hover:text-purple-500 transition">
                About Us
              </Link>
              <Link href="#brands" className="text-sm hover:text-purple-500 transition">
                Featured Brands
              </Link>
              <Link href="#features" className="text-sm hover:text-purple-500 transition">
                Features
              </Link>
              <Link href="#how-to" className="text-sm hover:text-purple-500 transition">
                How to?
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-sm hover:text-purple-500 transition">
                Sign In
              </Link>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6">
                Shop now <ShoppingCart className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

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
      <footer className="bg-[#0D0D0D] pt-16 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center mb-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
                  <div className="w-6 h-6 bg-[#0D0D0D] rounded-full"></div>
                </div>
                <span className="text-xl font-semibold tracking-wider">LUXELA</span>
              </Link>
              <p className="text-gray-400 text-sm">
                Redefining fashion e-commerce with authenticity, security, and global reach.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Shipping Info
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-500 transition">
                    Seller Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">© 2025 Luxela. All rights reserved.</p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-purple-500 transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-purple-500 transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-purple-500 transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
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
