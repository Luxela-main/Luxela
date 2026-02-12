"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Package,
  Filter,
  PlusCircle,
  SquarePen,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ListingType } from "@/types/newListing";
import SearchBar from "@/components/search-bar";
import { useMyListings } from "@/modules/sellers";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RestockModal from "./RestockModal";

interface ProductListingsProps {
  onAddProduct: (type: ListingType) => void;
}

type TabType = "single" | "collection";

const ProductListings: React.FC<ProductListingsProps> = ({ onAddProduct }) => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("single");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<any>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [listingStatuses, setListingStatuses] = useState<Record<string, string>>({});

  const { data: listings, isLoading, refetch } = useMyListings();
  const hasListings = listings && listings.length > 0;

  // Helper to get the first available image from listing
  const getFirstImage = (listing: any): string | undefined => {
    if (listing.image) return listing.image;
    if (listing.imagesJson) {
      try {
        const images = Array.isArray(listing.imagesJson) ? listing.imagesJson : JSON.parse(listing.imagesJson);
        return images[0]?.url || images[0];
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  // Helper to get category for both single items and collections
  const getCategory = (listing: any): string => {
    if (listing.category) return listing.category;
    
    // For collections, try to get category from first item
    if (listing.type === "collection" && listing.itemsJson) {
      try {
        const items = Array.isArray(listing.itemsJson) ? listing.itemsJson : JSON.parse(listing.itemsJson);
        if (items.length > 0 && items[0].category) {
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

  const filteredListings =
    listings?.filter((listing: any) => {
      const matchesTab = listing.type === activeTab;
      const matchesSearch =
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        getCategory(listing).toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    }) || [];

  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  const allSelected =
    paginatedListings.length > 0 &&
    paginatedListings.every((listing: any) => selectedItems.has(listing.id));

  const someSelected = paginatedListings.some((listing: any) =>
    selectedItems.has(listing.id)
  );

  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [activeTab, search]);

  // Poll for real-time status updates
  React.useEffect(() => {
    if (!listings || listings.length === 0) return;

    // Set initial statuses
    const initialStatuses: Record<string, string> = {};
    listings.forEach((listing: any) => {
      initialStatuses[listing.id] = listing.status || "pending";
    });
    setListingStatuses(initialStatuses);

    // Set up polling interval for status updates - refetch fresh data
    const pollingInterval = setInterval(() => {
      refetch();
    }, 5000); 

    return () => clearInterval(pollingInterval);
  }, [listings, refetch]);

  // Update status display when listing data changes
  React.useEffect(() => {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedItems(new Set());
  };

  const deleteMutation = (trpc.listing as any).deleteListing.useMutation({
    onSuccess: () => {
      toastSvc.success("Listing deleted successfully!");
      refetch();
      setSelectedItems(new Set());
      setIsDeleteDialogOpen(false);
      setListingToDelete(null);
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to delete listing");
    },
  });

  const restockMutation = (trpc.listing as any).restockListing.useMutation({
    onSuccess: () => {
      toastSvc.success("Stock updated successfully!");
      refetch();
      setShowRestockModal(false);
      setSelectedListing(null);
      setIsRestocking(false);
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to update stock");
      setIsRestocking(false);
    },
  });

  const handleEdit = (listing: any) => {
    router.push(`/sellers/new-listing?edit=${listing.id}`);
    setOpenActionMenu(null);
  };

  const handleDeleteClick = (listing: any) => {
    setListingToDelete(listing);
    setIsDeleteDialogOpen(true);
    setOpenActionMenu(null);
  };

  const handleRestock = (listing: any) => {
    setSelectedListing(listing);
    setShowRestockModal(true);
    setOpenActionMenu(null);
  };

  const handleRestockUpdate = (newQuantity: number) => {
    if (!selectedListing) return;

    setIsRestocking(true);
    restockMutation.mutate({
      id: selectedListing.id,
      quantityAvailable: newQuantity,
    });
  };

  const handleDeleteConfirm = () => {
    if (listingToDelete) {
      deleteMutation.mutate({ id: listingToDelete.id });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<string>(
        paginatedListings.map((listing: any) => listing.id as string)
      );
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  // Helper to get available actions based on listing status
  const getAvailableActions = (listing: any) => {
    const status = listingStatuses[listing.id] || "pending";
    const actions: Array<{
      id: string;
      label: string;
      icon: string;
      color: string;
      bgColor: string;
      action: () => void;
      hasBorder?: boolean;
    }> = [];

    // Restock is always available (primary action)
    actions.push({
      id: "restock",
      label: "Restock",
      icon: "↻",
      color: "text-blue-300",
      bgColor: "hover:bg-blue-600/20",
      action: () => handleRestock(listing),
    });

    // Edit is always available
    actions.push({
      id: "edit",
      label: "Edit",
      icon: "✎",
      color: "text-purple-300",
      bgColor: "hover:bg-purple-600/20",
      action: () => handleEdit(listing),
    });

    // View feedback for rejected or revision requested
    if (status === "rejected") {
      actions.push({
        id: "feedback",
        label: "View Feedback",
        icon: "ℹ",
        color: "text-orange-300",
        bgColor: "hover:bg-orange-600/20",
        action: () => {
          toastSvc.info("Review feedback will be shown here. Please check your email or dashboard.");
          setOpenActionMenu(null);
        },
      });
    }

    // Delete is always available (last action with border)
    actions.push({
      id: "delete",
      label: "Delete",
      icon: "🗑",
      color: "text-red-400",
      bgColor: "hover:bg-red-600/20",
      action: () => handleDeleteClick(listing),
      hasBorder: true,
    });

    return actions;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white px-4 md:px-6 lg:px-8 py-6 lg:py-8">
      {/* Premium Header */}
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Inventory</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              Your Listings
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Manage and create single items or collections
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="w-full sm:w-80">
              <SearchBar search={search} setSearch={setSearch} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilter(!showFilter)} className="group flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all duration-300 cursor-pointer hover:shadow-lg" title="Filter listings" style={{ backgroundColor: '#8451E1', borderColor: '#8451E1' }}>
            <Filter className="w-4 h-4 text-white transition-colors" />
            <span className="text-sm font-medium text-white transition-colors">Filter</span>
          </button>
        </div>

        <div className="relative group">
          <Button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-white font-semibold rounded-lg transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#8451E1' }}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Product</span>
          </Button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-2 py-2">
                <button
                  onClick={() => {
                    onAddProduct("single");
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-600/20 rounded-lg transition-all duration-200 text-gray-300 hover:text-white cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 group-hover:bg-purple-600/40 flex items-center justify-center transition-colors">
                    <svg
                      className="w-4 h-4 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Single Item</p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400">Create a new product listing</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onAddProduct("collection");
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-600/20 rounded-lg transition-all duration-200 text-gray-300 hover:text-white cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-600/20 group-hover:bg-pink-600/40 flex items-center justify-center transition-colors">
                    <svg
                      className="w-4 h-4 text-pink-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Collection</p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400">Group items into a collection</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center" onClick={() => setShowFilter(false)}>
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:w-96 shadow-2xl shadow-black/50 p-6 animate-in slide-in-from-bottom-5 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Filter Listings</h3>
              <button onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer" title="Close filter">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-3">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:border-purple-500 focus:outline-none cursor-pointer transition-colors hover:border-gray-700"
              >
                <option value="">All Fashion Categories</option>
                <option value="men">Men's Fashion</option>
                <option value="women">Women's Fashion</option>
                <option value="accessories">Accessories</option>
                <option value="footwear">Footwear</option>
                <option value="sportswear">Sportswear</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-3">Stock Status</label>
              <div className="space-y-2">
                {["In Stock", "Low Stock", "Out of Stock"].map((status) => (
                  <label key={status} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterStatus.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterStatus([...filterStatus, status]);
                        } else {
                          setFilterStatus(filterStatus.filter((s) => s !== status));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-700 text-purple-600 bg-gray-900 cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-800">
              <button
                onClick={() => {
                  setFilterCategory("");
                  setFilterStatus([]);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 rounded-lg transition-all duration-200 cursor-pointer font-medium"
                title="Clear all filters"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilter(false)}
                className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all duration-200 cursor-pointer font-medium shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#8451E1' }}
                title="Apply filters"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {hasListings ? (
        <>
          {/* Premium Tabs */}
          <div className="flex space-x-1 mb-8 border-b border-gray-800/50">
            <button
              onClick={() => setActiveTab("single")}
              className={`px-4 py-3 font-medium text-sm transition-all duration-200 cursor-pointer relative group ${
                activeTab === "single"
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span>Single Items</span>
              {activeTab === "single" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: '#8451E1' }}></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("collection")}
              className={`px-4 py-3 font-medium text-sm transition-all duration-200 cursor-pointer relative group ${
                activeTab === "collection"
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span>Collections</span>
              {activeTab === "collection" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: '#8451E1' }}></div>
              )}
            </button>
          </div>

          {/* Selection info */}
          {selectedItems.size > 0 && (
            <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg px-4 py-3 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold">
                  {selectedItems.size}
                </div>
                <span className="text-sm font-medium text-purple-300">
                  {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
                  selected
                </span>
              </div>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Listings Table */}
          <div className="hidden md:block bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-xl overflow-hidden border border-gray-800/50 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="min-w-[800px] overflow-x-auto">
              <div className="grid grid-cols-6 bg-gradient-to-r from-[#1a1a1a] to-[#151515] text-sm gap-4 px-6 py-4 border-b border-gray-800/50 text-gray-400 font-semibold sticky top-0">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 text-purple-600 focus:ring-purple-500 bg-gray-900 cursor-pointer"
                  />
                  <span>Product</span>
                </div>
                <div className="text-gray-500">Category</div>
                <div className="text-gray-500">Price</div>
                <div className="text-gray-500">Stock</div>
                <div className="text-gray-500 text-center">Status</div>
                <div className="text-gray-500 text-center">Actions</div>
              </div>

              {filteredListings.length === 0 ? (
                <div className="p-16 text-center text-gray-500">
                  <div className="mb-4 flex justify-center">
                    <Package className="h-12 w-12 opacity-20" />
                  </div>
                  <p className="text-base font-medium text-gray-400 mb-1">
                    No {activeTab === "single" ? "products" : "collections"}{" "}
                    found
                  </p>
                  <p className="text-sm text-gray-600">
                    {search
                      ? "Try adjusting your search"
                      : `You don't have any ${
                          activeTab === "single"
                            ? "single items"
                            : "collections"
                        } yet`}
                  </p>
                </div>
              ) : (
                paginatedListings.map((listing: any) => (
                  <div
                    key={listing.id}
                    className="border-b border-gray-800/30 last:border-b-0 transition-colors"
                  >
                    <div className="grid grid-cols-6 gap-4 px-6 py-4 items-center text-sm hover:bg-gradient-to-r hover:from-purple-900/10 hover:to-pink-900/10 transition-all duration-300 group">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(listing.id)}
                          onChange={(e) =>
                            handleSelectItem(listing.id, e.target.checked)
                          }
                          className="w-4 h-4 rounded border-gray-700 text-purple-600 focus:ring-purple-500 bg-gray-900 cursor-pointer"
                        />
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFirstImage(listing) && (
                            <img
                              src={getFirstImage(listing)!}
                              alt={listing.title}
                              className="w-8 h-8 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <span className="text-white font-medium truncate">
                            {listing.title}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-500 group-hover:text-gray-400 transition-colors">
                        <span className="text-xs bg-gray-900/50 px-2 py-1 rounded capitalize">
                          {getCategory(listing)}
                        </span>
                      </div>
                      <div className="text-white font-semibold">
                        {listing.type === "single" && listing.priceCents
                          ? `₦${(listing.priceCents / 100).toLocaleString()}`
                          : listing.type === "collection"
                          ? `₦${(getCollectionTotalPrice(listing) / 100).toLocaleString()}`
                          : "—"}
                      </div>
                      <div className="text-gray-400 font-medium">
                        {listing.type === "single"
                          ? listing.quantityAvailable || 0
                          : listing.itemsJson?.length || 0}
                      </div>
                      <div className="flex justify-center">
                        {(() => {
                          // Map backend status values to frontend display values

                          let displayStatus = listingStatuses[listing.id] || "pending_review";

                          // Convert backend status names to frontend status names

                          const statusMapping: Record<string, string> = {

                            pending_review: "pending",

                            approved: "approved",

                            rejected: "rejected",

                            draft: "pending",

                            archived: "rejected",

                          };

                          displayStatus = statusMapping[displayStatus] || "pending";

                          const status = displayStatus;
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
                          const config = statusConfig[displayStatus] || statusConfig.pending;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm transition-all border ${config.color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${config.dotColor}`}></span>
                              {config.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex justify-center items-center relative">
                        <button
                          onClick={() =>
                            setOpenActionMenu(
                              openActionMenu === listing.id ? null : listing.id
                            )
                          }
                          className="p-1.5 hover:bg-purple-600/20 rounded-lg transition-all duration-200 border border-transparent hover:border-purple-500/30 cursor-pointer"
                          title="More actions"
                        >
                          <svg
                            className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>

                        {openActionMenu === listing.id && (
                          <div className="z-50 absolute left-0 top-10 mt-2 w-56 max-h-64 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-lg shadow-2xl shadow-black/50 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900/50 hover:scrollbar-thumb-gray-600">
                            {getAvailableActions(listing).map((action, index) => (
                              <button
                                key={action.id}
                                onClick={() => {
                                  action.action();
                                  setOpenActionMenu(null);
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-3 text-sm ${action.color} ${action.bgColor} transition-all duration-200 text-left cursor-pointer group/item ${action.hasBorder ? "border-t border-gray-800/50" : ""}`}
                                title={action.label}
                              >
                                {action.id === "edit" && <SquarePen className="h-4 w-4" />}
                                {action.id === "restock" && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                )}
                                {action.id === "feedback" && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                {action.id === "delete" && <Trash2 className="h-4 w-4" />}
                                <span>{action.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4 mt-8">
            {filteredListings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-10 w-10 opacity-20 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400 mb-1">
                  No {activeTab === "single" ? "products" : "collections"} found
                </p>
              </div>
            ) : (
              paginatedListings.map((listing: any) => (
                <div
                  key={listing.id}
                  className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800/30 rounded-lg overflow-hidden hover:bg-gradient-to-b hover:from-[#252525] hover:to-[#151515] transition-all duration-300"
                >
                  {/* Product Image */}
                  {getFirstImage(listing) && (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-900">
                      <img
                        src={getFirstImage(listing)!}
                        alt={listing.title}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(listing.id)}
                        onChange={(e) => handleSelectItem(listing.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-700 text-purple-600 focus:ring-purple-500 bg-gray-900 cursor-pointer mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{listing.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{getCategory(listing)}</p>
                      </div>
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
                        {listing.type === "single"
                          ? listing.quantityAvailable || 0
                          : listing.itemsJson?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1 text-xs">Status</p>
                      {(() => {
                        // Map backend status values to frontend display values

                        let displayStatus = listingStatuses[listing.id] || "pending_review";

                        // Convert backend status names to frontend status names

                        const statusMapping: Record<string, string> = {

                          pending_review: "pending",

                          approved: "approved",

                          rejected: "rejected",

                          draft: "pending",

                          archived: "rejected",

                        };

                        displayStatus = statusMapping[displayStatus] || "pending";

                        const status = displayStatus;
                        const statusConfig: Record<string, any> = {
                          pending: {
                            label: "Pending",
                            color: "bg-amber-500/20 text-amber-300",
                            dotColor: "bg-amber-400",
                          },
                          approved: {
                            label: "Listed",
                            color: "bg-emerald-500/20 text-emerald-300",
                            dotColor: "bg-emerald-400",
                          },
                          rejected: {
                            label: "Rejected",
                            color: "bg-red-500/20 text-red-300",
                            dotColor: "bg-red-400",
                          },
                          revision_requested: {
                            label: "Revision",
                            color: "bg-orange-500/20 text-orange-300",
                            dotColor: "bg-orange-400",
                          },
                        };
                        const config = statusConfig[displayStatus] || statusConfig.pending;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm ${config.color}`}>
                            <span className={`h-1 w-1 rounded-full animate-pulse ${config.dotColor}`}></span>
                            {config.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleRestock(listing)}
                        className="flex-1 px-3 py-2.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 rounded-lg text-sm font-medium transition-all cursor-pointer border border-blue-500/20 hover:border-blue-500/40"
                        title="Restock inventory"
                      >
                        Restock
                      </button>
                      {(listingStatuses[listing.id] === "rejected") && (
                        <button
                          onClick={() => {
                            toastSvc.info("Review feedback will be shown here. Please check your email or dashboard.");
                          }}
                          className="flex-1 px-3 py-2.5 bg-orange-600/20 text-orange-300 hover:bg-orange-600/40 rounded-lg text-sm font-medium transition-all cursor-pointer border border-orange-500/20 hover:border-orange-500/40"
                          title="View feedback"
                        >
                          Feedback
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(listing)}
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

          {/* Premium Pagination */}
          {filteredListings.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-gray-900/30 to-gray-800/20 rounded-lg border border-gray-800/50">
              <div className="text-sm text-gray-400">
                Showing <span className="font-semibold text-gray-300">{startIndex + 1}</span> to{" "}
                <span className="font-semibold text-gray-300">{Math.min(endIndex, filteredListings.length)}</span> of{" "}
                <span className="font-semibold text-gray-300">{filteredListings.length}</span> results
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-800 hover:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer text-gray-400 hover:text-white"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                              currentPage === page
                                ? "text-white shadow-lg hover:shadow-xl"
                                : "border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 hover:bg-gray-900/50"
                            }`}
                            style={currentPage === page ? { backgroundColor: '#8451E1' } : {}}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-600 text-sm">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-800 hover:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer text-gray-400 hover:text-white"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Premium Empty State */
        <div
          className="flex flex-col items-center justify-center"
          style={{ minHeight: "calc(100vh - 300px)" }}
        >
          <div className="mb-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-2xl animate-pulse"></div>
              <svg
                className="w-24 h-24 text-white relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                />
              </svg>
              <svg
                className="w-10 h-10 text-purple-400 absolute -right-4 -bottom-4 relative z-20 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-3 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Start Creating</h2>
          <p className="text-gray-400 text-center mb-2 max-w-sm">
            You haven't created any products yet. Click the "Add Product" button to get started.
          </p>
          <p className="text-gray-500 text-center text-sm max-w-sm">
            Build your inventory with single items or create collections to group related products.
          </p>
        </div>
      )}

      {/* Premium Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 text-white shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Listing</DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              Are you sure you want to delete <span className="font-semibold text-white">'{listingToDelete?.title}'</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 rounded-lg transition-all duration-200 cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium shadow-lg shadow-red-500/30"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default ProductListings;