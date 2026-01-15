"use client";
import React, { useState, useMemo } from "react";
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

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: listings, isLoading, refetch } = useMyListings();
  const hasListings = listings && listings.length > 0;

  const filteredListings =
    listings?.filter((listing: any) => {
      const matchesTab = listing.type === activeTab;
      const matchesSearch =
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        listing.category?.toLowerCase().includes(search.toLowerCase());
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedItems(new Set());
  };

  const deleteMutation = (trpc.listing as any).deleteListing.useMutation({
    onSuccess: () => {
      toastSvc.success("Listing deleted successfully!");
      refetch();
      setSelectedItems(new Set());
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to delete listing");
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
    toastSvc.success("Restock feature coming soon!");
    setOpenActionMenu(null);
  };

  const handleDeleteConfirm = () => {
    if (listingToDelete) {
      deleteMutation.mutate({ id: listingToDelete.id });
      setListingToDelete(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-2 lg:px-6 text-sm max-md:pt-6">
      {/* Header */}
      <div className="mb-10">
        <div className="w-60 z-10 lg:w-80 max-lg:fixed max-md:right-6 max-lg:right-12 max-lg:top-4.5 lg:ml-auto">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>

      <div className="mb-6 md:max-lg:pt-10 flex justify-between items-center pt-4">
        <div className="">
          <h1 className="text-2xl font-semibold">New Listing</h1>
          <p className="text-gray-400 mt-1">
            List product and fill in your listing details
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg hover:border-gray-600 transition">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="relative">
            <Button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-6 py-2 rounded-lg transition"
            >
              <PlusCircle className="w-5 h-5 hidden lg:block" />
              Add Product
            </Button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-10">
                <button
                  onClick={() => {
                    onAddProduct("single");
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252525] transition text-left"
                >
                  <svg
                    className="w-4 h-4"
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
                  Single item
                </button>
                <button
                  onClick={() => {
                    onAddProduct("collection");
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252525] transition text-left"
                >
                  <svg
                    className="w-4 h-4"
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
                  Collection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasListings ? (
        <>
          {/* Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab("single")}
              className={`px-4 py-2 rounded-md flex items-center transition ${
                activeTab === "single"
                  ? "border-b border-purple-700 text-purple-700"
                  : "bg-transparent border-[#333] text-gray-500 hover:text-white"
              }`}
            >
              <span className="mr-2">Single Items</span>
            </button>
            <button
              onClick={() => setActiveTab("collection")}
              className={`px-4 py-2 rounded-md transition ${
                activeTab === "collection"
                  ? "border-b border-purple-700 text-purple-700"
                  : "bg-transparent border-[#333] text-gray-500 hover:text-white"
              }`}
            >
              Collections
            </button>
          </div>

          {/* Selection info */}
          {selectedItems.size > 0 && (
            <div className="mb-4 flex items-center justify-between bg-purple-900/20 border border-purple-700/30 rounded-lg px-4 py-2">
              <span className="text-sm text-purple-300">
                {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-sm text-purple-400 hover:text-purple-300 transition"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Listings Table */}
          <div className="bg-[#0d0d0d] rounded-lg overflow-x-auto border border-[#1a1a1a]">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 bg-[#141414] text-sm gap-4 p-4 border-b border-[#1a1a1a] text-gray-500 font-medium">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="mr-3 max-h-5 max-w-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-transparent cursor-pointer"
                  />
                  <span>Product Name</span>
                </div>
                <div>Category</div>
                <div>Price</div>
                <div>Stock</div>
                <div>Status</div>
                <div>Action</div>
              </div>

              {filteredListings.length === 0 ? (
                <div className="p-16 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-base mb-1">
                    No {activeTab === "single" ? "products" : "collections"}{" "}
                    found
                  </p>
                  <p className="text-sm">
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
                    className="border-b border-[#1a1a1a] last:border-b-0"
                  >
                    <div className="grid grid-cols-6 gap-4 p-4 items-center text-sm hover:bg-[#151515] transition">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(listing.id)}
                          onChange={(e) =>
                            handleSelectItem(listing.id, e.target.checked)
                          }
                          className="mr-3 min-h-5 min-w-5 rounded border-red-600 text-purple-600 focus:ring-purple-500 bg-transparent cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-white capitalize">
                            {listing.title}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {listing.category || "N/A"}
                      </div>
                      <div className="text-white font-medium">
                        {listing.type === "single" && listing.priceCents
                          ? `₦${(listing.priceCents / 100).toLocaleString()}`
                          : listing.type === "collection"
                          ? "Varies"
                          : "N/A"}
                      </div>
                      <div className="text-gray-400">
                        {listing.type === "single"
                          ? listing.quantityAvailable || 0
                          : listing.itemsJson?.length || 0}
                      </div>
                      <div>
                        {listing.type === "single" ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              (listing.quantityAvailable || 0) > 10
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : (listing.quantityAvailable || 0) > 0
                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                (listing.quantityAvailable || 0) > 10
                                  ? "bg-green-400"
                                  : (listing.quantityAvailable || 0) > 0
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                              }`}
                            ></span>
                            {(listing.quantityAvailable || 0) > 10
                              ? "In stock"
                              : (listing.quantityAvailable || 0) > 0
                              ? "Low stock"
                              : "Sold out"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                            Collection
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-start relative">
                        <button
                          onClick={() =>
                            setOpenActionMenu(
                              openActionMenu === listing.id ? null : listing.id
                            )
                          }
                          className="p-2 hover:bg-[#1a1a1a] rounded-md transition border border-transparent hover:border-[#2a2a2a]"
                        >
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>

                        {openActionMenu === listing.id && (
                          <div className="z-50 absolute right-0 top-10 mt-1 w-40 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl">
                            <button
                              onClick={() => handleRestock(listing)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#252525] transition text-left rounded-t-lg"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              Restock
                            </button>
                            <button
                              onClick={() => handleDeleteClick(listing)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-[#252525] transition text-left rounded-b-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {filteredListings.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredListings.length)} of{" "}
                {filteredListings.length} results
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-[#333] hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                            className={`px-3 py-1 rounded-md text-sm transition ${
                              currentPage === page
                                ? "bg-purple-600 text-white"
                                : "border border-[#333] hover:bg-[#1a1a1a] text-gray-400"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-600">
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
                  className="p-2 rounded-md border border-[#333] hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State Placeholder */
        <div
          className="text-sm flex flex-col items-center justify-center"
          style={{ minHeight: "calc(100vh - 250px)" }}
        >
          <div className="mb-6">
            <div className="relative">
              <svg
                className="w-20 h-20 text-white"
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
                className="w-8 h-8 text-white absolute -right-2 -bottom-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-medium mb-2">No products listed yet</h2>
          <p className="text-gray-400">
            once you start add products, your products
          </p>
          <p className="text-gray-400">will show up here.</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{listingToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2 bg-transparent border border-[#333] text-gray-400 hover:text-white rounded-md transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductListings;
