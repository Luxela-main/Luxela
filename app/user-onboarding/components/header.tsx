"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const navLinks = [
  { label: 'About Luxela', href: '/about' },
  { label: 'Become a Seller', href: '/become-a-seller' },
  { label: 'Help', href: '/help' },
  { label: 'Contact Support', href: '/support' },
];

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#23232B]">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center text-white font-semibold text-xl tracking-widest">
          <img src="/luxela.svg" alt="Luxela Logo" className="w-6 h-6 mr-2" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-gray-300 hover:text-white text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-200 hover:bg-[#23232B]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 px-6 pb-4 pt-2 space-y-2 border-t border-[#23232B]">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block text-gray-200 hover:text-white text-sm py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
