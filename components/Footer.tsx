import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface FooterLinkItem {
  name: string;
  route: string;
}

interface FooterLinkSection {
  title: string;
  links: FooterLinkItem[];
}


const footerLinks: FooterLinkSection[] = [
  {
    title: "Company",
    links: [
      { name: "About Us", route: "#about" },
      { name: "Features", route: "#" },
      { name: "Brands", route: "#brands" },
      { name: "FAQ", route: "#how-to" }
    ]
  },
  {
    title: "Contact Us",
    links: [
      { name: "Returns & Refunds", route: "#" },
      { name: "Shipping Info", route: "#" }
    ]
  },
  {
    title: "Legal",
    links: [
      { name: "Terms of Service", route: "#" },
      { name: "Privacy Policy", route: "#" },
      // { name: "Cookie Policy", route: "#" }
    ]
  }
];


export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] pt-20 pb-8 px-10">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className='max-w-[330px]'>
            {/* Logo */}
            <Link href="/" className="flex items-center w-[132px] md:w-[200px] h-[32px]">
              <Image src={"/images/Luxela-white-logo-200x32.svg"} width={200} height={32} className='w-full h-full' alt='Luxela logo' />
            </Link>
            <p className="text-[#BFBFBF] text-sm md:text-base my-9">
              Ready to share your fashion with the world? Join Luxela today to connect with a global audience, showcase your designs, and grow your brand.
            </p>

            <Link href={"/signup"} className='text-sm md:text-base text-[#FBFBFB]'><span className='underline'>Start Selling on LUXELA</span> <ArrowRight className='inline-block size-4 md:size-5' /></Link>
          </div>

          {/* newsletter */}
          <div className='max-w-[580px] '>
            <p className='text-xs md:text-sm text-[#DCDCDC] mb-2'>Subscribe to our newsletter</p>
            <div className="relative w-full max-w-md">
              <Input
                type="text"
                placeholder="Enter your email"
                className="w-full pr-[120px] h-[42px] rounded-[10px] border border-[#2F2F2F] focused:ring-0 focus-visible:ring-0 bg-[#2B2B2B] text-[#ACACAC] text-sm "
              />
              <Button
                className="absolute top-0 right-0 h-[42px] px-6 text-white bg-gradient-to-r from-[#9872DD] via-[#8451E1] to-[#5C2EAF] rounded-[10px] transition"
              >
                Subscribe
              </Button>
            </div>
            <div className='mt-10 grid grid-cols-2 md:grid-cols-3 gap-20 md:gap-10'>
              {footerLinks.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h3 className="text-sm md:text-base text-[#FBFBFB] font-semibold">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.name + link.route}>
                        <Link href={link.route} className="text-xs md:text-sm text-[#BFBFBF] hover:text-purple-500 transition">
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-40 mb-10">
          <div className='my-10'>
            <Image src='/images/LUXELA-1185x242.svg' width={1185} height={242} alt={'Luxela'} />
          </div>
          <p className="text-gray-500 text-sm mb-4 md:mb-0 text-center">© 2025 Luxela. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
