#!/bin/bash

# ⚡ LUXELA PROJECT - SUPER SPEED SETUP
# This script sets up all performance optimization tools and configurations
# Run with: bash SPEED_SETUP.sh

set -e

echo "🚀 Starting LUXELA Performance Optimization Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Install dependencies
echo -e "${BLUE}📦 Phase 1: Installing Performance Tools${NC}"
echo "-------------------------------------------"
echo "Installing bundle analyzer..."
pnpm add -D @next/bundle-analyzer

echo "Installing analytics packages..."
pnpm add @vercel/analytics @vercel/speed-insights

echo "Installing optional performance packages..."
pnpm add -D lighthouse

echo -e "${GREEN}✅ All packages installed${NC}"
echo ""

# 2. Create fonts file
echo -e "${BLUE}🔤 Phase 2: Setting Up Google Fonts${NC}"
echo "-------------------------------------"

if [ ! -f "app/fonts.ts" ]; then
  mkdir -p app
  cat > app/fonts.ts << 'EOF'
import { Inter, Poppins } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});
EOF
  echo -e "${GREEN}✅ Created app/fonts.ts${NC}"
else
  echo -e "${YELLOW}⚠️  app/fonts.ts already exists${NC}"
fi
echo ""

# 3. Performance checks
echo -e "${BLUE}🔍 Phase 3: Running Performance Checks${NC}"
echo "--------------------------------------"

echo "Checking TypeScript..."
pnpm run type-check

echo "Running linter..."
pnpm run lint || true

echo ""

# 4. Build and analyze
echo -e "${BLUE}📊 Phase 4: Building & Analyzing Bundle${NC}"
echo "-----------------------------------------"

echo "This may take a few minutes..."
ANALYZE=true pnpm run build

echo ""

# 5. Summary
echo -e "${GREEN}=================================================="
echo "✅ PERFORMANCE SETUP COMPLETE!"
echo "==================================================${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Review the bundle analysis:"
echo "   - Check .next/analyze for visualization"
echo "   - Look for large/duplicate dependencies"
echo ""
echo "2. Update your app/layout.tsx:"
echo "   - Import Analytics and SpeedInsights"
echo "   - Add fonts to the html className"
echo ""
echo "3. Monitor performance:"
echo "   - Go to https://vercel.com/dashboard"
echo "   - Check Analytics tab for Core Web Vitals"
echo ""
echo "4. Optimize components:"
echo "   - Review PERFORMANCE_CHECKLIST.md"
echo "   - Implement dynamic imports for heavy components"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  - Read: PERFORMANCE_OPTIMIZATION_GUIDE.md"
echo "  - Read: PERFORMANCE_CHECKLIST.md"
echo ""
echo -e "${YELLOW}🎯 Performance Goals:${NC}"
echo "  - LCP: < 2.5 seconds"
echo "  - FCP: < 1.5 seconds"
echo "  - CLS: < 0.1"
echo "  - Bundle Size: < 200KB (main)"
echo ""
echo -e "${BLUE}Run these commands regularly:${NC}"
echo ""
echo "# Build and analyze:"
echo "  ANALYZE=true pnpm run build"
echo ""
echo "# Performance audit:"
echo "  lighthouse https://your-domain.com"
echo ""
echo "# Type and lint checks:"
echo "  pnpm run type-check && pnpm run lint"
echo ""
echo "=================================================="
echo ""