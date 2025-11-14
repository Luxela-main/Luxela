'use client'

import { useState, useRef, useEffect } from "react"


interface Collection {
  id: number
  badge: string
  title: string
  brand: string
  brandHref: string
  image: string
  description: string
}

type ScrollDirection = 'left' | 'right'

type BadgeType = "Limited Edition" | "New Drop" | "Trending" | "Exclusive" | string

const COLLECTIONS: Collection[] = [
  {
    id: 1,
    badge: "Limited Edition",
    title: "Wrangler Collection",
    brand: "BAZ Fashion",
    brandHref: "#",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop",
    description: "Rugged meets refined in this exclusive denim collection"
  },
  {
    id: 2,
    badge: "New Drop",
    title: "Prime Collection",
    brand: "RIO Jewels",
    brandHref: "#",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=500&fit=crop",
    description: "Luxury jewelry pieces that capture timeless elegance"
  },
  {
    id: 3,
    badge: "Limited Edition",
    title: "The Black Atlas Collection",
    brand: "SHU",
    brandHref: "#",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop",
    description: "Premium footwear crafted for the modern adventurer"
  },
  {
    id: 4,
    badge: "Trending",
    title: "Valor Collection",
    brand: "BAZ Fashion",
    brandHref: "#",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop",
    description: "Bold statement pieces for the confident individual"
  },
  {
    id: 5,
    badge: "Exclusive",
    title: "Aurora Series",
    brand: "LUXE Co.",
    brandHref: "#",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop",
    description: "Ethereal designs inspired by natural beauty"
  },
]


const getBadgeColor = (badge: BadgeType): string => {
  const colors: Record<string, string> = {
    "Limited Edition": "bg-gradient-to-r from-red-500 to-red-600",
    "New Drop": "bg-gradient-to-r from-green-500 to-green-600",
    "Trending": "bg-gradient-to-r from-orange-500 to-orange-600",
    "Exclusive": "bg-gradient-to-r from-purple-500 to-purple-600",
  }
  return colors[badge] || "bg-gradient-to-r from-[#9872DD] to-[#8451E1]"
}

const FeaturedCollection = () => {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollButtons)
      return () => carousel.removeEventListener('scroll', checkScrollButtons)
    }
  }, [])

  const scroll = (direction: ScrollDirection) => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current?.offsetWidth
        ? carouselRef.current.offsetWidth * 0.8 // scroll 80% of viewport width
        : 320

      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="mt-16">
      <section className="px-6">
        {/* Header */}
        <div className="md:flex items-center md:justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Featured Collections</h2>
            <p className="text-gray-400 text-sm">Discover our curated selection of premium collections</p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center  gap-4">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full transition-all ${canScrollLeft
                  ? 'bg-[#9872DD] text-white hover:bg-[#8451E1] shadow-lg'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-full transition-all ${canScrollRight
                  ? 'bg-[#9872DD] text-white hover:bg-[#8451E1] shadow-lg'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <a
              href="#"
              className="text-sm text-[#9872DD] hover:text-[#8451E1] transition-colors flex items-center gap-1 ml-auto group"
            >
              See all
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Scrollable Cards */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-4 md:gap-6 scrollbar-hide snap-x snap-mandatory py-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {COLLECTIONS.map((col, index) => (
              <div
                key={col.id}
                className="w-[85%] sm:w-[70%] md:w-[320px] lg:w-[360px] snap-start group"
                onMouseEnter={() => setHoveredId(col.id)}
                onMouseLeave={() => setHoveredId(null)}
              >

                {/* Card Container */}
                <div className="bg-[#161616] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] border border-gray-800 hover:border-[#9872DD]/30">
                  {/* Image with badge and overlay */}
                  <div className="relative w-full h-[300px] overflow-hidden">
                    <img
                      src={col.image}
                      alt={col.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Badge */}
                    <span className={`absolute top-4 left-4 ${getBadgeColor(col.badge)} text-white text-xs px-3 py-2 rounded-full font-semibold shadow-lg backdrop-blur-sm`}>
                      {col.badge}
                    </span>

                    {/* Quick View Button (appears on hover) */}
                    {/* <button
                      className={`absolute top-4 right-4 bg-white/10 backdrop-blur-md text-white p-2 rounded-full transition-all duration-300 ${hoveredId === col.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                        }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button> */}

                    {/* Bottom text overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg capitalize leading-tight mb-1">
                        {col.title}
                      </h3>
                      <p className="text-gray-300 text-xs mb-2 opacity-80">
                        {col.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    {/* Brand */}
                    <a
                      href={col.brandHref}
                      className="text-[#9872DD] hover:text-[#8451E1] text-sm font-medium transition-colors inline-block mb-4 group/brand"
                    >
                      <span className="group-hover/brand:underline">{col.brand}</span>
                      <svg className="inline w-3 h-3 ml-1 group-hover/brand:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>

                    {/* CTA Button */}
                    <button
                      className="cursor-pointer flex items-center justify-between w-full bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] text-white text-sm p-2.5 rounded-lg font-semibold hover:from-[#8451E1] hover:via-[#7240D0] hover:to-[#4A1E8F] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group/button"
                    >
                      <span className="text-xs md:text-sm">View Collection</span>
                      <span className="group-hover/button:translate-x-1 transition-transform flex items-center justify-center rounded-[4px] bg-black w-8 h-8">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="white"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </span>
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Indicators */}
          {/* <div className="flex justify-center mt-6 gap-2">
            {COLLECTIONS.map((_, index) => (
              <button
                key={index}
                className="w-2 h-2 rounded-full bg-gray-600 hover:bg-[#9872DD] transition-all duration-300 hover:scale-125"
                onClick={() => {
                  if (carouselRef.current) {
                    carouselRef.current.scrollTo({
                      left: index * 320,
                      behavior: 'smooth'
                    })
                  }
                }}
              />
            ))}
          </div> */}
        </div>

        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>
    </div>
  )
}

export default FeaturedCollection