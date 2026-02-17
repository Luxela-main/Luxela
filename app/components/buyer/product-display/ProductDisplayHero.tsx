'use client';

interface ProductDisplayHeroProps {
  title: string;
  description: string;
  subtitle?: string;
  showSearch?: boolean;
}

export function ProductDisplayHero({
  title,
  description,
  subtitle,
  showSearch = true,
}: ProductDisplayHeroProps) {
  return (
    <div className="relative overflow-hidden pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12 md:pb-16 bg-gradient-to-b from-[#8451E1]/10 via-transparent to-transparent">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#8451E1]/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-[#8451E1]/25 rounded-full blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute top-40 right-1/4 w-80 h-80 bg-[#5C2EAF]/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {subtitle && (
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#8451E1]/10 border border-[#8451E1]/30 mb-4 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-[#8451E1]"></span>
            <span className="text-[#8451E1] text-xs sm:text-sm font-semibold tracking-wider uppercase">{subtitle}</span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-3 sm:mb-4 md:mb-6 max-w-3xl leading-tight">
          {title}
        </h1>

        <p className="text-[#999] text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed mb-6 sm:mb-8 md:mb-10">
          {description}
        </p>

        {showSearch && (
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 md:py-3.5 rounded-xl bg-[#1a1a2e] border border-[#8451E1]/30 text-white placeholder-[#666] text-sm sm:text-base focus:outline-none focus:border-[#8451E1]/80 focus:ring-2 focus:ring-[#8451E1]/20 transition-all"
            />
            <button className="px-4 sm:px-6 py-2.5 sm:py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-[#8451E1] to-[#a575ff] text-white font-semibold text-sm sm:text-base hover:shadow-lg hover:shadow-[#8451E1]/30 transition-all active:scale-95">
              Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}