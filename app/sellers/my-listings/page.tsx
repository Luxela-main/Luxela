"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Bell } from "lucide-react";
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

// Helper function to parse collection items (handles both string and array formats)
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

  // Fetch both single listings and collections separately for better control
  const { data: listings, isLoading: listingsLoading, error: listingsError, refetch: refetchListings } = useMyListings();
  const { data: collections, isLoading: collectionsLoading, error: collectionsError, refetch: refetchCollections } = useMyCollections();

  // Determine loading and error states based on active tab
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
      // Ensure refetch happens after mutation completes
      refetch();
    },
  });

  const handleViewDetails = (listing: any) => {
    // For collections, open collection preview modal instead
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

  // Get listings for active tab - use separate sources for single vs collections
  const tabListings = activeTab === "single" 
    ? (listings?.filter((l: any) => l.type === "single") || [])
    : (collections || []);

  // Parse collection items safely
  const collectionItems = collectionToPreview ? parseCollectionItems(collectionToPreview.itemsJson) : [];

  return (
    <div className="px-4 lg:px-6 mt-4 md:mt-0 pb-10">
      {/* Premium Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
            Inventory Management
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="border-b-2 border-[#ECBEE3] pb-6 w-full">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
              My Listings
            </h1>
            <p className="text-[#EA795B] text-lg font-medium">
              Manage and track all your product listings with advanced analytics
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsNotificationPanelOpen(true)}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </Button>
            <Button
              onClick={() => router.push("/sellers/new-listing")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#8451E1] hover:bg-[#7340D0] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-[#8451E1]/50 h-auto cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>New Listing</span>
            </Button>
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

      {/* Enhanced Listing Grid */}
      <EnhancedListingGrid
        listings={tabListings}
        isLoading={false}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        type={activeTab}
      />

      {/* Modals */}
      <SellerListingNotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />

      <ListingDetailsModal
        listing={selectedListing}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedListing(null);
        }}
      />

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

      {/* Delete Dialog */}
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