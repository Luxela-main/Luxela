"use client";

import { ProductBrowser } from "@/components/ProductBrowser";

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <ProductBrowser />
      </div>
    </div>
  );
}