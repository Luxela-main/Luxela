#!/bin/bash

# Bundle Analyzer Script for Next.js Performance Optimization
# Run with: bash scripts/analyze-bundle.sh

echo "🔍 Installing bundle analyzer..."
pnpm add -D @next/bundle-analyzer

echo ""
echo "📦 Building and analyzing bundle..."
echo "This will show you:"
echo "  - Which dependencies are largest"
echo "  - What's contributing to bundle bloat"
echo "  - Opportunities for code-splitting"
echo ""

ANALYZE=true pnpm run build

echo ""
echo "✅ Bundle analysis complete!"
echo "Check the .next/analyze folder for the visualization"
echo ""
echo "💡 Tips:"
echo "  - Look for large libraries that could be lazy-loaded"
echo "  - Check for duplicate dependencies"
echo "  - Consider dynamic imports for components"