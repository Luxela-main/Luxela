"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star } from "lucide-react";

const CATEGORIES = [
  { label: "All Categories", value: "" },
  { label: "Men Clothing", value: "men_clothing" },
  { label: "Women Clothing", value: "women_clothing" },
  { label: "Men Shoes", value: "men_shoes" },
  { label: "Women Shoes", value: "women_shoes" },
  { label: "Accessories", value: "accessories" },
  { label: "Merchandise", value: "merch" },
  { label: "Others", value: "others" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Popular", value: "popular" },
];

interface ProductBrowserProps {
  initialCategory?: string;
}

export function ProductBrowser({ initialCategory = "" }: ProductBrowserProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>(
    initialCategory || undefined
  );
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [inStock, setInStock] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products with filters
  const { data, isLoading, error } = trpc.products.discover.useQuery(
    {
      page,
      pageSize: 20,
      category: category as any,
      search: debouncedSearch || undefined,
      sort: (sort as any) || "newest",
      minPrice,
      maxPrice,
      inStock,
    },
    {
      staleTime: 30000, // Cache for 30 seconds
      gcTime: 60000, // Keep in garbage collection for 60 seconds
      refetchOnWindowFocus: false,
      enabled: true,
    }
  );

  const handleProductClick = useCallback(
    (listingId: string) => {
      router.push(`/buyer/product/${listingId}`);
    },
    [router]
  );

  const handleAddToCart = useCallback(
    (e: React.MouseEvent, listingId: string) => {
      e.stopPropagation();
      // This will be handled by parent context or dedicated function
      console.log("Add to cart:", listingId);
    },
    []
  );

  const handleAddToWishlist = useCallback(
    (e: React.MouseEvent, listingId: string) => {
      e.stopPropagation();
      // This will be handled by parent context or dedicated function
      console.log("Add to wishlist:", listingId);
    },
    []
  );

  const handleCategoryChange = (value: string) => {
    setCategory(value || undefined);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return "Price TBA";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStockStatus = (
    supplyCapacity: string | null,
    quantity: number | null
  ) => {
    if (supplyCapacity === "no_max") return "In Stock";
    const qty = quantity ?? 0;
    if (qty <= 0) return "Sold Out";
    if (qty <= 5) return `Only ${qty} left!`;
    return "In Stock";
  };

  const getStockColor = (
    supplyCapacity: string | null,
    quantity: number | null
  ) => {
    if (supplyCapacity === "no_max") return "bg-green-500";
    const qty = quantity ?? 0;
    if (qty <= 0) return "bg-red-500";
    if (qty <= 5) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Discover Products</h1>
        <p className="text-gray-600">
          Browse our collection of premium fashion items and accessories
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-lg border">
        {/* Search */}
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-1 md:col-span-2"
        />

        {/* Category */}
        <Select value={category || ""} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* In Stock Filter */}
        <Button
          variant={inStock ? "default" : "outline"}
          onClick={() => setInStock(!inStock)}
          className="w-full"
        >
          {inStock ? "In Stock" : "All"}
        </Button>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border">
        <div>
          <label className="text-sm font-medium">Min Price ($)</label>
          <Input
            type="number"
            placeholder="0"
            value={minPrice ?? ""}
            onChange={(e) => setMinPrice(e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max Price ($)</label>
          <Input
            type="number"
            placeholder="1000"
            value={maxPrice ?? ""}
            onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setMinPrice(undefined);
              setMaxPrice(undefined);
            }}
          >
            Clear Price
          </Button>
        </div>
      </div>

      {/* Results Info */}
      {data && (
        <div className="text-sm text-gray-600">
          Showing {data.products.length} of {data.total} products
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load products. Please try again.
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-t-lg" />
              <CardContent className="space-y-2 pt-4">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {data && data.products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleProductClick(product.id)}
            >
              {/* Product Image */}
              <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                {product.image || (product.images && product.images[0]) ? (
                  <Image
                    src={
                      product.image ||
                      (product.images && product.images.length > 0
                        ? product.images[0].imageUrl
                        : "/placeholder.png")
                    }
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}

                {/* Stock Badge */}
                <div
                  className={`absolute top-2 right-2 ${getStockColor(
                    product.supplyCapacity,
                    product.quantityAvailable
                  )} text-white text-xs px-2 py-1 rounded`}
                >
                  {getStockStatus(product.supplyCapacity, product.quantityAvailable)}
                </div>

                {/* Limited Edition Badge */}
                {product.limitedEditionBadge === "show_badge" && (
                  <Badge className="absolute top-2 left-2 bg-purple-500">
                    Limited Edition
                  </Badge>
                )}

                {/* Action Buttons */}
                <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => handleAddToCart(e, product.id)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" /> Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleAddToWishlist(e, product.id)}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Product Info */}
              <CardContent className="space-y-2 pt-4">
                {/* Category */}
                {product.category && (
                  <Badge variant="secondary" className="w-fit">
                    {product.category.replace(/_/g, " ")}
                  </Badge>
                )}

                {/* Title */}
                <h3 className="font-semibold text-sm line-clamp-2">
                  {product.title}
                </h3>

                {/* Price */}
                <div className="text-lg font-bold text-blue-600">
                  {formatPrice(product.priceCents)}
                </div>

                {/* Seller Info */}
                <div className="text-xs text-gray-600">
                  <p className="font-medium">{product.seller.brandName}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">
                    {product.rating.toFixed(1)} ({product.reviewCount})
                  </span>
                </div>

                {/* Views */}
                <div className="text-xs text-gray-500">
                  {product.viewCount} views
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {data && data.products.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found</p>
          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">
            Page {data.page} of {Math.ceil(data.total / data.pageSize)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!data.hasMore || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}