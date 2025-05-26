import React, {useEffect, useState} from 'react'
import Link from "next/link"
import { Menu, ShoppingCart } from "lucide-react"
import { Button } from './ui/Button'
import Image from 'next/image'

interface NavItem {
  name: string;
  route: string;
}

const navItems: NavItem[] = [
  {name: 'About Us', route: "#about"},
  {name: 'Featured Brands', route: "#brands"},
  {name: 'How To?', route: "#how-to"},
]

export default function Navbar() {
  const [sticky, setSticky] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setSticky(true);
      } else {
        setSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <nav className={`z-50 transition-all duration-300 text-white ${sticky ? 'sticky top-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-md' : 'relative bg-transparent'}`}>
      {/* Decorative lights/images */}
      <Image src={'/images/Light-852x785.svg'} width={852} height={785} alt="light effect" className="z-10 absolute top-0 right-0 " />
      <div className="container mx-auto px-10 py-4 flex justify-between items-center">
        <ul className="flex items-center space-x-9">
        {navItems.map((item) => (
          <li key={item.name + item.route} >
            <Link href={item.route} className="text-sm hover:text-purple-500 transition">
              {item.name}
          </Link>
          </li>
        ))}           
        </ul>

        {/* logo */}
        <Link href="/" className="flex items-center w-[200px] h-[32px]">
          <Image src={"/images/Luxela-white-logo-200x32.svg"} width={200} height={32} className='w-full h-full' alt='Luexal logo.' />
        </Link>

        {/* cta */}
        <div className="flex items-center space-x-2">
          <Link href="/login" className="h-[42px] flex items-center  text-sm hover:text-purple-500 transition-all duration-300 ease-in-out px-6">
            Sell
          </Link>
          <Link href="#" className="h-[42px]  flex items-center space-x-2 border border-[#FFFFFF66]/40 hover:border-purple-500 transition-all duration-300 ease-in-out text-white rounded-[4px] px-6">
            Shop now <ShoppingCart className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
         <Menu className="h-6 w-6" />
        </button>
      </div>
    </nav>
  )
}
