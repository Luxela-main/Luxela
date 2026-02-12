"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import EnhancedListingCard from "./EnhancedListingCard";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import RestockModal from "./NewListing/RestockModal";

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
  listingStatus?: string;
  status?: "pending" | "approved" | "rejected" | "revision_requested";
}

interface EnhancedListingGridProps {
  listings: Listing[];
  isLoading: boolean;
  onView: (listing: Listing) => void;
  onEdit: (listing: Listing) => void;
  onDelete: (listing: Listing) => void;
  type?: "single" | "collection";
  refetch?: () => void;
  showStatus?: boolean;
  showFilterButton?: boolean;
  onFilterToggle?: () => void;
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
  refetch,
  showStatus = false,
  showFilterButton = false,
  onFilterToggle,
}) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [listingStatuses, setListingStatuses] = useState<Record<string, string>>({});
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isRestocking, setIsRestocking] = useState(false);

  // Restock mutation
  const restockMutation = (trpc.listing as any).restockListing.useMutation({
    onSuccess: () => {
      toastSvc.success("Stock updated successfully!");
      setShowRestockModal(false);
      setSelectedListing(null);
      setIsRestocking(false);
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to update stock");
      setIsRestocking(false);
    },
  });

  // Handle scroll position
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Scroll functions
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  // Set up polling for real-time status updates
  useEffect(() => {
    if (!listings || listings.length === 0) return;

    // Set initial statuses
    const initialStatuses: Record<string, string> = {};
    listings.forEach((listing: any) => {
      initialStatuses[listing.id] = listing.status || "pending_review";
    });
    setListingStatuses(initialStatuses);

    // Set up polling interval for status updates - refetch fresh data every 5 seconds
    const pollingInterval = setInterval(() => {
      if (refetch) {
        refetch();
      }
    }, 5000);

    return () => clearInterval(pollingInterval);
  }, [listings, refetch])

  // Update status display when listing data changes
  useEffect(() => {
    if (listings && listings.length > 0) {
      setListingStatuses((prev) => {
        const updated = { ...prev };
        listings.forEach((listing: any) => {
          if (listing.status) {
            updated[listing.id] = listing.status;
          }
        });
        return updated;
      });
    }
  }, [listings]);

  // Helper function to get status badge styling
  const getStatusBadge = (listing: Listing) => {
    let displayStatus = listingStatuses[listing.id] || listing.status || "pending";

    const statusMapping: Record<string, string> = {
      pending_review: "pending",
      approved: "approved",
      rejected: "rejected",
      draft: "pending",
      archived: "rejected",
    };

    displayStatus = statusMapping[displayStatus] || "pending";

    const statusConfig: Record<string, any> = {
      pending: {
        label: "Pending",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        dotColor: "bg-amber-400",
      },
      approved: {
        label: "Listed",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        dotColor: "bg-emerald-400",
      },
      rejected: {
        label: "Rejected",
        color: "bg-red-500/20 text-red-300 border-red-500/30",
        dotColor: "bg-red-400",
      },
      revision_requested: {
        label: "Revision",
        color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        dotColor: "bg-orange-400",
      },
    };

    return statusConfig[displayStatus] || statusConfig.pending;
  };

  // Get image from listing
  const getImage = (listing: Listing): string | undefined => {
    // For collections, try to get image from first item
    if (listing.type === 'collection' && listing.itemsJson) {
      try {
        const items = typeof listing.itemsJson === 'string' ? JSON.parse(listing.itemsJson) : listing.itemsJson;
        if (Array.isArray(items) && items.length > 0 && items[0].image) {
          return items[0].image;
        }
      } catch {
        // Fall through to other image sources
      }
    }
    
    if (listing.image) return listing.image;
    if (listing.imagesJson) {
      try {
        const images = typeof listing.imagesJson === 'string' ? JSON.parse(listing.imagesJson) : listing.imagesJson;
        if (Array.isArray(images) && images.length > 0) {
          const firstImg = images[0];
          return typeof firstImg === 'string' ? firstImg : firstImg?.url || firstImg;
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

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

  // Get category for both single items and collections
  const getCategory = (listing: Listing): string => {
    if (listing.category) return listing.category;
    
    // For collections, try to get category from first item
    if (listing.type === "collection" && listing.itemsJson) {
      try {
        const items = typeof listing.itemsJson === 'string' ? JSON.parse(listing.itemsJson) : listing.itemsJson;
        if (Array.isArray(items) && items.length > 0 && items[0].category) {
          return items[0].category;
        }
      } catch {
        return "—";
      }
    }
    
    return "—";
  };

    // Helper to calculate total price for collections
  const getCollectionTotalPrice = (listing: any): number => {
    if (listing.type !== "collection" || !listing.itemsJson) return 0;
    try {
      const items = Array.isArray(listing.itemsJson) ? listing.itemsJson : JSON.parse(listing.itemsJson);
      return items.reduce((total: number, item: any) => total + (item.priceCents || 0), 0);
    } catch {
      return 0;
    }
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // Type filter
      if (type && listing.type !== type) return false;

      // Search filter
      const matchesSearch =
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        getCategory(listing).toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Category filter
      if (filterCategory && getCategory(listing) !== filterCategory) return false;

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
    const cats = new Set<string>();
    listings.forEach((l) => {
      const cat = getCategory(l);
      if (cat && cat !== "—") {
        cats.add(cat);
      }
    });
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

  // Restock handlers
  const handleRestock = (listing: Listing) => {
    setSelectedListing(listing);
    setShowRestockModal(true);
  };

  const handleRestockUpdate = (newQuantity: number) => {
    if (!selectedListing) return;

    setIsRestocking(true);
    restockMutation.mutate({
      id: selectedListing.id,
      quantityAvailable: newQuantity,
    });
  };

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
              className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-300 hover:text-white hover:border-gray-700 transition-all duration-300 backdrop-blur-sm cursor-pointer"
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
                className={`px-3 py-2.5 transition-all duration-300 cursor-pointer ${
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
                className={`px-3 py-2.5 transition-all duration-300 cursor-pointer ${
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
                      className="w-4 h-4 border-gray-600 text-[#8451E1] cursor-pointer"
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
        <div className="relative">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-[#8451E1]/90 hover:bg-[#8451E1] rounded-full shadow-lg transition-all duration-300 cursor-pointer -ml-4"
              title="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-[#8451E1]/90 hover:bg-[#8451E1] rounded-full shadow-lg transition-all duration-300 cursor-pointer -mr-4"
              title="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory"
          >
            {sortedListings.map((listing) => (
              <div key={listing.id} className="flex-shrink-0 w-80 snap-start">
              <EnhancedListingCard
                id={listing.id}
                title={listing.title}
                category={getCategory(listing)}
                image={getImage(listing)}
                price={listing.priceCents}
                quantity={listing.quantityAvailable}
                views={listing.views}
                conversions={listing.conversions}
                createdAt={listing.createdAt}
                type={listing.type}
                itemCount={getItemCount(listing)}
                status={listingStatuses[listing.id] || listing.status}
                onView={() => onView(listing)}
                onEdit={() => onEdit(listing)}
                onDelete={() => onDelete(listing)}
                onRestock={() => handleRestock(listing)}
              />
            </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden border border-gray-800/50 backdrop-blur-md shadow-xl">
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
                  {getCategory(listing).replace(/_/g, " ")}
                </div>
                <div className="text-white font-semibold">
                  {listing.type === "single" && listing.priceCents
                    ? `₦${(listing.priceCents / 100).toLocaleString()}`
                    : listing.type === "collection"
                    ? `₦${(getCollectionTotalPrice(listing) / 100).toLocaleString()}`
                    : "—"}
                </div>
                <div className="text-white font-medium">
                  {listing.quantityAvailable}
                </div>
                <div>
                  {(() => {
                    const config = getStatusBadge(listing);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm transition-all border ${config.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${config.dotColor}`}></span>
                        {config.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(listing)}
                    className="p-2 hover:bg-[#8451E1]/20 rounded-lg transition-colors duration-300 cursor-pointer"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-[#8451E1]" />
                  </button>
                  <button
                    onClick={() => onEdit(listing)}
                    className="p-2 hover:bg-[#8451E1]/20 rounded-lg transition-colors duration-300 cursor-pointer"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-400 group-hover:text-[#8451E1]" />
                  </button>
                  <button
                    onClick={() => handleRestock(listing)}
                    className="p-2 hover:bg-blue-600/20 rounded-lg transition-colors duration-300 cursor-pointer"
                    title="Restock"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                  </button>
                  <button
                    onClick={() => onDelete(listing)}
                    className="p-2 hover:bg-red-600/20 rounded-lg transition-colors duration-300 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {sortedListings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-10 w-10 opacity-20 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">No listings found</p>
              </div>
            ) : (
              sortedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800/30 rounded-lg overflow-hidden hover:bg-gradient-to-b hover:from-[#252525] hover:to-[#151515] transition-all duration-300"
                >
                  {/* Product Image */}
                  {getImage(listing) && (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-900">
                      <img
                        src={getImage(listing)}
                        alt={listing.title}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-white font-medium text-sm mb-1 truncate">{listing.title}</p>
                      <p className="text-xs text-gray-500">{getCategory(listing).replace(/_/g, " ")}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs p-3 bg-gray-950/50 rounded">
                      <div>
                        <p className="text-gray-500 mb-1 text-xs">Price</p>
                        <p className="text-white font-semibold">
                          {listing.type === "single" && listing.priceCents
                            ? `₦${(listing.priceCents / 100).toLocaleString()}`
                            : listing.type === "collection"
                            ? `₦${(getCollectionTotalPrice(listing) / 100).toLocaleString()}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1 text-xs">Stock</p>
                        <p className="text-gray-300 font-semibold">
                          {listing.quantityAvailable}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1 text-xs">Status</p>
                        {(() => {
                          const config = getStatusBadge(listing);
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm ${config.color}`}>
                              <span className={`h-1 w-1 rounded-full animate-pulse ${config.dotColor}`}></span>
                              {config.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => onView(listing)}
                        className="flex-1 px-3 py-2.5 bg-[#8451E1]/20 text-[#8451E1] hover:bg-[#8451E1]/40 rounded-lg text-sm font-medium transition-all cursor-pointer border border-[#8451E1]/30 hover:border-[#8451E1]/50"
                        title="View listing"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onEdit(listing)}
                        className="flex-1 px-3 py-2.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 rounded-lg text-sm font-medium transition-all cursor-pointer border border-purple-500/20 hover:border-purple-500/40"
                        title="Edit listing"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRestock(listing)}
                        className="flex-1 px-3 py-2.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 rounded-lg text-sm font-medium transition-all cursor-pointer border border-blue-500/20 hover:border-blue-500/40"
                        title="Restock inventory"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => onDelete(listing)}
                        className="flex-1 px-3 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-sm font-medium transition-all cursor-pointer border border-red-500/20 hover:border-red-500/40"
                        title="Delete listing"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Restock Modal */}
      <RestockModal
        isOpen={showRestockModal}
        listing={selectedListing}
        onClose={() => {
          setShowRestockModal(false);
          setSelectedListing(null);
        }}
        onUpdate={handleRestockUpdate}
        isLoading={isRestocking}
      />

      {/* Results Counter */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-800/30">
        Showing <span className="font-semibold text-gray-300">{sortedListings.length}</span> of{" "}
        <span className="font-semibold text-gray-300">{listings.length}</span> listings
      </div>
    </div>
  );
};

export default EnhancedListingGrid;