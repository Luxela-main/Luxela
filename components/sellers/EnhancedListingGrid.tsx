"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Grid3x3,
  List,
  TrendingUp,
  Clock,
  DollarSign,
  Package,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  SquarePen,
} from "lucide-react";
import EnhancedListingCard from "./EnhancedListingCard";

interface Listing {
  id: string;
  title: string;
  category: string;
  image?: string;
  priceCents?: number;
  quantityAvailable: number;
  views?: number;
  conversions?: number;
  createdAt: Date;
  type: "single" | "collection";
  itemsJson?: any;
  imagesJson?: string;
}

interface EnhancedListingGridProps {
  listings: Listing[];
  isLoading: boolean;
  onView: (listing: Listing) => void;
  onEdit: (listing: Listing) => void;
  onDelete: (listing: Listing) => void;
  type?: "single" | "collection";
}

type SortType =
  | "recent"
  | "price-high"
  | "price-low"
  | "stock-low"
  | "trending"
  | "most-viewed";
type ViewType = "grid" | "table";
type FilterStatus = "all" | "in-stock" | "low-stock" | "out-of-stock";

export const EnhancedListingGrid: React.FC<EnhancedListingGridProps> = ({
  listings,
  isLoading,
  onView,
  onEdit,
  onDelete,
  type,
}) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");

  // Get image from listing
  const getImage = (listing: Listing): string | undefined => {
    if (listing.image) return listing.image;
    if (listing.imagesJson) {
      try {
        const images = JSON.parse(listing.imagesJson);
        return images[0]?.url || images[0];
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  // Get item count for collections
  const getItemCount = (listing: Listing): number => {
    if (listing.type === "collection") {
      if (listing.itemsJson) {
        try {
          const items = JSON.parse(listing.itemsJson);
          return items.length;
        } catch {
          return 0;
        }
      }
    }
    return listing.quantityAvailable;
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // Type filter
      if (type && listing.type !== type) return false;

      // Search filter
      const matchesSearch =
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        listing.category?.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Category filter
      if (filterCategory && listing.category !== filterCategory) return false;

      // Stock status filter
      const stock = listing.quantityAvailable;
      if (filterStatus === "in-stock" && !(stock > 10)) return false;
      if (filterStatus === "low-stock" && !(stock > 0 && stock <= 10)) return false;
      if (filterStatus === "out-of-stock" && stock !== 0) return false;

      return true;
    });
  }, [listings, search, type, filterCategory, filterStatus]);

  // Sort listings
  const sortedListings = useMemo(() => {
    const sorted = [...filteredListings];

    switch (sortBy) {
      case "price-high":
        return sorted.sort(
          (a, b) => (b.priceCents || 0) - (a.priceCents || 0)
        );
      case "price-low":
        return sorted.sort(
          (a, b) => (a.priceCents || 0) - (b.priceCents || 0)
        );
      case "stock-low":
        return sorted.sort(
          (a, b) => a.quantityAvailable - b.quantityAvailable
        );
      case "trending":
        return sorted.sort((a, b) => (b.conversions || 0) - (a.conversions || 0));
      case "most-viewed":
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "recent":
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [filteredListings, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(
      listings.map((l) => l.category).filter((c): c is string => !!c)
    );
    return Array.from(cats).sort();
  }, [listings]);

  const stats = useMemo(() => {
    return {
      total: sortedListings.length,
      inStock: sortedListings.filter((l) => l.quantityAvailable > 10).length,
      lowStock: sortedListings.filter(
        (l) => l.quantityAvailable > 0 && l.quantityAvailable <= 10
      ).length,
      outOfStock: sortedListings.filter((l) => l.quantityAvailable === 0)
        .length,
    };
  }, [sortedListings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8451E1] mx-auto mb-4" />
          <p className="text-gray-400">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Bar */}
          <div className="w-full lg:flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by title or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#8451E1] focus:outline-none transition-all duration-300 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-wrap lg:flex-nowrap">
            {/* Advanced Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-300 hover:text-white hover:border-gray-700 transition-all duration-300 backdrop-blur-sm"
              title="Advanced filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Advanced</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white text-sm focus:border-[#8451E1] focus:outline-none transition-all duration-300 backdrop-blur-sm cursor-pointer appearance-none pr-10"
              >
                <option value="recent">Recently Added</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="stock-low">Low Stock First</option>
                <option value="most-viewed">Most Viewed</option>
                <option value="trending">Trending</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>

            {/* View Type Toggle */}
            <div className="flex border border-gray-800 rounded-xl bg-gray-900/50 backdrop-blur-sm">
              <button
                onClick={() => setViewType("grid")}
                className={`px-3 py-2.5 transition-all duration-300 ${
                  viewType === "grid"
                    ? "text-[#8451E1] bg-[#8451E1]/20"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <div className="w-px bg-gray-800" />
              <button
                onClick={() => setViewType("table")}
                className={`px-3 py-2.5 transition-all duration-300 ${
                  viewType === "table"
                    ? "text-[#8451E1] bg-[#8451E1]/20"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-b from-gray-900/40 to-gray-800/20 rounded-xl border border-gray-800/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Stock Status
              </label>
              <div className="space-y-2">
                {[
                  { value: "all" as FilterStatus, label: "All Items" },
                  { value: "in-stock" as FilterStatus, label: "In Stock" },
                  { value: "low-stock" as FilterStatus, label: "Low Stock" },
                  { value: "out-of-stock" as FilterStatus, label: "Sold Out" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={filterStatus === option.value}
                      onChange={(e) =>
                        setFilterStatus(e.target.value as FilterStatus)
                      }
                      className="w-4 h-4 border-gray-600 text-[#8451E1]"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:border-[#8451E1] focus:outline-none transition-all duration-300 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Stats */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Inventory Stats
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-gray-400">In Stock</span>
                  <p className="text-lg font-bold text-emerald-400">
                    {stats.inStock}
                  </p>
                </div>
                <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-gray-400">Low Stock</span>
                  <p className="text-lg font-bold text-amber-400">
                    {stats.lowStock}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total",
              value: stats.total,
              icon: Package,
              color: "from-[#8451E1]/20 to-[#6D3FCF]/10",
              iconColor: "text-[#8451E1]",
            },
            {
              label: "In Stock",
              value: stats.inStock,
              icon: TrendingUp,
              color: "from-emerald-600/20 to-emerald-700/10",
              iconColor: "text-emerald-400",
            },
            {
              label: "Low Stock",
              value: stats.lowStock,
              icon: Clock,
              color: "from-amber-600/20 to-amber-700/10",
              iconColor: "text-amber-400",
            },
            {
              label: "Sold Out",
              value: stats.outOfStock,
              icon: DollarSign,
              color: "from-red-600/20 to-red-700/10",
              iconColor: "text-red-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-4 bg-gradient-to-br ${stat.color} border border-gray-800/50 rounded-xl backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {stat.label}
                </span>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Listings Grid/Table */}
      {sortedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-96 text-center">
          <div className="mb-4">
            <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No listings found</h3>
          <p className="text-gray-400 max-w-sm">
            {search
              ? "Try adjusting your search or filters"
              : "Create your first listing to get started"}
          </p>
        </div>
      ) : viewType === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
          {sortedListings.map((listing) => (
            <EnhancedListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              category={listing.category}
              image={getImage(listing)}
              price={listing.priceCents}
              quantity={listing.quantityAvailable}
              views={listing.views}
              conversions={listing.conversions}
              createdAt={listing.createdAt}
              type={listing.type}
              itemCount={getItemCount(listing)}
              onView={() => onView(listing)}
              onEdit={() => onEdit(listing)}
              onDelete={() => onDelete(listing)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden border border-gray-800/50 backdrop-blur-md shadow-xl">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 p-5 border-b border-gray-800/50 bg-gray-900/30 sticky top-0 text-xs font-semibold text-gray-400 uppercase tracking-widest">
            <div>Product</div>
            <div>Category</div>
            <div>Price</div>
            <div>Stock</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-800/30">
            {sortedListings.map((listing) => (
              <div
                key={listing.id}
                className="grid grid-cols-6 gap-4 p-5 items-center hover:bg-gray-900/20 transition-colors duration-300 group text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getImage(listing) && (
                    <img
                      src={getImage(listing)}
                      alt={listing.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <span className="text-white font-medium truncate">
                    {listing.title}
                  </span>
                </div>
                <div className="text-gray-400 truncate">
                  {listing.category?.replace(/_/g, " ") || "—"}
                </div>
                <div className="text-white font-semibold">
                  {listing.type === "single" && listing.priceCents
                    ? `₦${(listing.priceCents / 100).toLocaleString()}`
                    : "—"}
                </div>
                <div className="text-white font-medium">
                  {listing.quantityAvailable}
                </div>
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#8451E1]/20 to-[#6D3FCF]/20 border border-[#8451E1]/30 text-[#8451E1]">
                    <span className="w-2 h-2 rounded-full bg-[#8451E1] animate-pulse" />
                    {listing.quantityAvailable > 10
                      ? "In Stock"
                      : listing.quantityAvailable > 0
                      ? "Low Stock"
                      : "Sold Out"}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(listing)}
                    className="p-2 hover:bg-[#8451E1]/20 rounded-lg transition-colors duration-300"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-[#8451E1]" />
                  </button>
                  <button
                    onClick={() => onEdit(listing)}
                    className="p-2 hover:bg-[#8451E1]/20 rounded-lg transition-colors duration-300"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-400 group-hover:text-[#8451E1]" />
                  </button>
                  <button
                    onClick={() => onDelete(listing)}
                    className="p-2 hover:bg-red-600/20 rounded-lg transition-colors duration-300"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Counter */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-800/30">
        Showing <span className="font-semibold text-gray-300">{sortedListings.length}</span> of{" "}
        <span className="font-semibold text-gray-300">{listings.length}</span> listings
      </div>
    </div>
  );
};

export default EnhancedListingGrid;