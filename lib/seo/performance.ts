/**
 * SEO Performance Optimization Utilities
 * Includes Core Web Vitals monitoring and image optimization
 */

/**
 * Report Web Vitals for performance monitoring
 * Used for SEO ranking signals (LCP, FID, CLS)
 */
export interface WebVital {
  name: string;
  value: number;
  id: string;
  label: string;
  delta?: number;
}

export interface WebVitalThresholds {
  good: number;
  needsImprovement: number;
}

export const WEB_VITAL_THRESHOLDS: Record<string, WebVitalThresholds> = {
  'LCP': { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  'FID': { good: 100, needsImprovement: 300 }, // First Input Delay
  'CLS': { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  'INP': { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
  'TTFB': { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

/**
 * Get status badge for a web vital
 */
export function getVitalStatus(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITAL_THRESHOLDS[name];
  if (!thresholds) return 'good';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Image optimization hints for Next.js
 */
export interface ImageOptimizationConfig {
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  width?: number;
  height?: number;
}

/**
 * Get recommended image sizes for different contexts
 */
export const IMAGE_SIZES = {
  // Hero/Featured Images
  hero: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 100vw',
  
  // Product Cards
  product: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  
  // Thumbnails
  thumbnail: '(max-width: 640px) 100px, 150px',
  
  // Full Width
  fullWidth: '100vw',
  
  // Half Width
  halfWidth: '(max-width: 640px) 100vw, 50vw',
};

/**
 * Calculate aspect ratio for images
 */
export function calculateAspectRatio(
  width: number,
  height: number
): number {
  return (height / width) * 100;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  basePath: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map((width) => `${basePath}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Lazy loading strategy for images
 */
export function getImageLoadingStrategy(index: number): 'eager' | 'lazy' {
  // Load first 3 images eagerly (above the fold)
  return index < 3 ? 'eager' : 'lazy';
}

/**
 * Generate critical CSS for above-the-fold content
 */
export function getCriticalCSSPriority(): string {
  return `
    .hero { max-height: 100vh; }
    .header { position: sticky; top: 0; z-index: 50; }
    .hero-image { content-visibility: auto; }
  `;
}

/**
 * Performance budget configuration
 */
export const PERFORMANCE_BUDGET = {
  // Page load time budget (ms)
  pageLoad: 3000,
  // First Contentful Paint budget (ms)
  fcp: 1800,
  // Largest Contentful Paint budget (ms)
  lcp: 2500,
  // First Input Delay budget (ms)
  fid: 100,
  // Cumulative Layout Shift budget
  cls: 0.1,
  // JavaScript bundle size budget (bytes)
  jsBundle: 350000,
  // CSS bundle size budget (bytes)
  cssBundle: 50000,
  // Image size budget (bytes)
  imageSize: 100000,
};

/**
 * Monitor and log performance issues
 */
export function logPerformanceMetric(
  name: string,
  value: number,
  threshold: number
) {
  if (typeof window === 'undefined') return;

  const status = value <= threshold ? 'PASS' : 'FAIL';
  const message = `[${status}] ${name}: ${value.toFixed(2)}ms (threshold: ${threshold}ms)`;

  if (status === 'FAIL') {
    console.warn(`⚠️ ${message}`);
  } else {
    console.log(`✅ ${message}`);
  }

  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'performance_metric', {
      metric_name: name,
      metric_value: value,
      threshold,
      status,
    });
  }
}

/**
 * Get fetch priority hint based on resource type
 */
export function getFetchPriority(
  resourceType: 'image' | 'script' | 'style' | 'font'
): 'high' | 'low' | 'auto' {
  switch (resourceType) {
    case 'font':
      return 'high';
    case 'script':
      return 'low';
    case 'style':
      return 'high';
    case 'image':
      return 'auto';
  }
}

/**
 * Check if resource is critical for above-the-fold
 */
export function isCriticalResource(
  resourcePath: string,
  viewportIndex: number
): boolean {
  const criticalPatterns = [
    /^\/images\/hero/,
    /^\/images\/logo/,
    /fonts/,
  ];

  const isAboveFold = viewportIndex < 3;
  const isCritical = criticalPatterns.some((pattern) =>
    pattern.test(resourcePath)
  );

  return isAboveFold || isCritical;
}

/**
 * Generate Link prefetch hints for next navigation
 */
export function generatePrefetchHints(links: string[]): string {
  return links
    .map((link) => `<link rel="prefetch" href="${link}" />`)
    .join('\n');
}

/**
 * Generate dns-prefetch hints for external domains
 */
export function generateDnsPrefetchHints(domains: string[]): string {
  return domains
    .map((domain) => `<link rel="dns-prefetch" href="https://${domain}" />`)
    .join('\n');
}

/**
 * Preconnect hints for critical third-party resources
 */
export function generatePreconnectHints(origins: string[]): string {
  return origins
    .map(
      (origin) =>
        `<link rel="preconnect" href="${origin}" crossorigin="anonymous" />`
    )
    .join('\n');
}