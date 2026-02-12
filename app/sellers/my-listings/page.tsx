"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Bell, Filter } from "lucide-react";
import { useMyListings, useMyCollections } from "@/modules/sellers";
import { LoadingState } from "@/components/sellers/LoadingState";
import { ErrorState } from "@/components/sellers/ErrorState";
import { ListingDetailsModal } from "@/components/sellers/ListingDetailsModal";
import { CollectionPreviewModal } from "@/components/sellers/CollectionPreviewModal";
import { EnhancedListingGrid } from "@/components/sellers/EnhancedListingGrid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { Button } from "@/components/ui/button";
import { SellerListingNotificationPanel } from "@/components/sellers/SellerListingNotificationPanel";
import { ListingReviewStatusBadge } from "@/components/sellers/ListingReviewStatusBadge";

type TabType = "single" | "collection";

const parseCollectionItems = (itemsJson: any) => {
  if (!itemsJson) return [];
  try {
    const items = typeof itemsJson === "string" ? JSON.parse(itemsJson) : itemsJson;
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.error("Error parsing collection items:", e);
    return [];
  }
};

export default function MyListings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("single");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<any>(null);
  const [collectionToPreview, setCollectionToPreview] = useState<any>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [liveListing, setLiveListing] = useState<any>(null);
  const [showAddProductDropdown, setShowAddProductDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const realtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch listings and collections
  const { data: listings, isLoading: listingsLoading, error: listingsError, refetch: refetchListings } = useMyListings();
  const { data: collections, isLoading: collectionsLoading, error: collectionsError, refetch: refetchCollections } = useMyCollections();

  // Determine which data to use based on active tab
  const isLoading = activeTab === "single" ? listingsLoading : collectionsLoading;
  const error = activeTab === "single" ? listingsError : collectionsError;
  const refetch = activeTab === "single" ? refetchListings : refetchCollections;

  const deleteMutation = (trpc.listing as any).deleteListing.useMutation({
    onSuccess: () => {
      toastSvc.success("Listing deleted successfully!");
      setIsDeleteDialogOpen(false);
      setListingToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to delete listing");
    },
    onSettled: () => {
      refetch();
    },
  });

  // Real-time status polling for the details modal
  useEffect(() => {
    if (!isDetailsModalOpen || !selectedListing) {
      // Clear interval when modal closes
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
      return;
    }

    // Function to fetch fresh listing status
    const fetchListingStatus = async () => {
      try {
        const currentListings = listings?.find((l: any) => l.id === selectedListing.id);
        if (currentListings) {
          setLiveListing(currentListings);
        }
      } catch (error) {
        console.error("Error fetching live listing status:", error);
      }
    };

    // Initial fetch
    fetchListingStatus();

    // Set up interval for real-time updates (every 2 seconds)
    realtimeIntervalRef.current = setInterval(fetchListingStatus, 2000);

    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
    };
  }, [isDetailsModalOpen, selectedListing, listings]);

  const handleViewDetails = (listing: any) => {
    // Check if listing needs review
    if (listing.status === "pending" || listing.status === "revision_requested") {
      // For pending/revision listings, show a message
      toastSvc.info("This listing is under review and cannot be viewed in details yet");
      return;
    }
    // Open collection or single listing details
    if (listing.type === "collection") {
      setCollectionToPreview(listing);
      setIsCollectionModalOpen(true);
    } else {
      setSelectedListing(listing);
      setIsDetailsModalOpen(true);
    }
  };

  const handleEdit = (listing: any) => {
    router.push(`/sellers/new-listing?edit=${listing.id}`);
  };

  const handleDeleteClick = (listing: any) => {
    setListingToDelete(listing);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (listingToDelete) {
      deleteMutation.mutate({ id: listingToDelete.id });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your listings..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load listings. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  // Filter listings based on active tab
  const tabListings = activeTab === "single" 
    ? (listings?.filter((l: any) => l.type === "single") || [])
    : (collections || []);

  // Parse collection items for preview modal
  const collectionItems = collectionToPreview ? parseCollectionItems(collectionToPreview.itemsJson) : [];

  return (
    <div className="px-4 lg:px-6 mt-4 md:mt-0 pb-10">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
            Inventory Management
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="border-b-2 border-[#E5E7EB] pb-6 w-full">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
              My Listings
            </h1>
            <p className="text-[#6B7280] text-lg font-medium">
              Manage and track all your product listings with advanced analytics
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              variant="outline"
              className="flex items-center justify-center gap-2"
              title="Advanced filters"
            >
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </Button>
            <Button
              onClick={() => setIsNotificationPanelOpen(true)}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </Button>
            <div className="relative group">
              <Button
                onClick={() => setShowAddProductDropdown(!showAddProductDropdown)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#8451E1] hover:bg-[#7340D0] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-[#8451E1]/50 h-auto cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Add Product</span>
              </Button>

              {showAddProductDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-2 py-2">
                    <button
                      onClick={() => {
                        router.push("/sellers/create-product?type=single");
                        setShowAddProductDropdown(false);
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
                        router.push("/sellers/create-product?type=collection");
                        setShowAddProductDropdown(false);
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
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 border-b border-gray-800/50">
        {[
          { id: "single", label: "Single Items" },
          { id: "collection", label: "Collections" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 font-medium text-sm transition-all duration-200 cursor-pointer relative group ${
              activeTab === tab.id
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
            )}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      <EnhancedListingGrid
        listings={tabListings}
        isLoading={false}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        type={activeTab}
        refetch={refetch}
        showStatus={true}
        showFilterButton={showFilterPanel}
        onFilterToggle={() => setShowFilterPanel(!showFilterPanel)}
      />

      {/* Notification Panel */}
      <SellerListingNotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />

      {/* Listing Details Modal with Real-time Updates */}
      <ListingDetailsModal
        listing={liveListing || selectedListing}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedListing(null);
          setLiveListing(null);
        }}
      />

      {/* Collection Preview Modal */}
      {collectionToPreview && (
        <CollectionPreviewModal
          collectionTitle={collectionToPreview.title || "Collection"}
          collectionDescription={collectionToPreview.description}
          items={collectionItems.map((item: any) => ({
            title: item.title || "",
            price: item.priceCents || 0,
            currency: item.currency || "NGN",
            image: item.image,
            quantity: item.quantityAvailable || 1,
            sku: item.sku,
            description: item.description,
          }))}
          totalPrice={collectionItems.reduce((sum: number, item: any) => sum + (item.priceCents || 0), 0)}
          currency={collectionToPreview.currency || (collectionItems[0]?.currency) || "NGN"}
          itemCount={collectionItems?.length || 0}
          isOpen={isCollectionModalOpen}
          onClose={() => {
            setIsCollectionModalOpen(false);
            setCollectionToPreview(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 text-white shadow-2xl shadow-black/50 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Delete Listing
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                "{listingToDelete?.title}"
              </span>
              ? This action cannot be undone.
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
    </div>
  );
}