/**
 * UNIFIED CARD CONFIGURATION
 * 
 * Centralized styling configuration for all listing cards across buyer pages
 * Ensures consistency in:
 * - Item height and container dimensions
 * - Grid arrangement and spacing
 * - Border colors and styling
 * - Responsive behavior
 */

// Premium border color palette
export const PREMIUM_COLORS = ['#ECBEE3', '#EA795B', '#ECE3BE', '#BEECE3', '#BEE3EC'];

// Card dimensions (consistent across all pages)
export const CARD_DIMENSIONS = {
  imageHeight: '280px',      // Fixed image container height
  contentMinHeight: '180px',  // Minimum content section height
  totalHeight: '460px',       // Total card height (280 + 180)
  borderRadius: 'xl',         // rounded-xl
  borderWidth: '2px',         // border-2
} as const;

// Grid layout configuration
export const GRID_LAYOUT = {
  desktop: 3,                 // 3 columns on desktop
  tablet: 3,                  // 3 columns on tablet
  mobile: 2,                  // 2 columns on mobile
  gap: {
    mobile: 'gap-4',
    tablet: 'gap-5 md:gap-5',
    desktop: 'lg:gap-6',
  },
} as const;

// Color map for named colors to hex values
export const UI_COLOR_MAP: { [key: string]: string } = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  pink: '#ec4899',
  purple: '#a855f7',
  orange: '#f97316',
  black: '#000000',
  white: '#ffffff',
  brown: '#78350f',
  gray: '#6b7280',
};

// Responsive padding
export const RESPONSIVE_PADDING = {
  mobile: 'px-4',
  tablet: 'px-4 md:px-6',
  desktop: 'lg:px-8',
} as const;

// Animation configuration
export const ANIMATIONS = {
  hoverScale: 'hover:scale-110',
  hoverTransition: 'transition-transform duration-700',
  shadowTransition: 'transition-shadow duration-300',
  borderTransition: 'transition-colors duration-300',
} as const;

// Utility function to get deterministic color for a listing
export function getCardBorderColor(listingId: string): string {
  const colorIndex = listingId.charCodeAt(0) % PREMIUM_COLORS.length;
  return PREMIUM_COLORS[colorIndex];
}

// Utility function to get grid class names
export function getGridClasses(): string {
  return `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-1 md:gap-3 lg:gap-6`;
}

// Utility function to get shadow color based on border color
export function getCardShadow(borderColor: string): string {
  return `0 4px 20px ${borderColor}10`;
}

export function getCardHoverShadow(borderColor: string): string {
  return `0 8px 40px ${borderColor}30`;
}