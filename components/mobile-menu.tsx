"use client"

import { X, ChevronRight, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "./ui/button"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
            <div className="w-6 h-6 bg-[#0A0A0A] rounded-full"></div>
          </div>
          <span className="text-xl font-semibold tracking-wider">LUXELA</span>
        </div>
        <button onClick={onClose}>
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="p-6">
        <ul className="space-y-6">
          <li>
            <Link href="#about" className="flex justify-between items-center py-2" onClick={onClose}>
              <span className="text-lg">About Us</span>
              <ChevronRight className="h-5 w-5 text-purple-500" />
            </Link>
          </li>
          <li>
            <Link href="#brands" className="flex justify-between items-center py-2" onClick={onClose}>
              <span className="text-lg">Featured Brands</span>
              <ChevronRight className="h-5 w-5 text-purple-500" />
            </Link>
          </li>
          <li>
            <Link href="#features" className="flex justify-between items-center py-2" onClick={onClose}>
              <span className="text-lg">Features</span>
              <ChevronRight className="h-5 w-5 text-purple-500" />
            </Link>
          </li>
          <li>
            <Link href="#how-to" className="flex justify-between items-center py-2" onClick={onClose}>
              <span className="text-lg">How to?</span>
              <ChevronRight className="h-5 w-5 text-purple-500" />
            </Link>
          </li>
        </ul>
      </nav>

      <div className="absolute bottom-8 left-0 right-0 px-6">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-full py-6 flex items-center justify-center">
          Shop now <ShoppingCart className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
