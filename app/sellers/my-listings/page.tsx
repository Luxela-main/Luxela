"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Filter, PlusCircle, SquarePen, Trash2 } from "lucide-react"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"
import { useMyListings } from "@/modules/sellers"
import { LoadingState } from "@/components/sellers/LoadingState"
import { ErrorState } from "@/components/sellers/ErrorState"
import { AddProductModal } from "@/components/sellers/AddProductModal"
import { ListingDetailsModal } from "./ListingDetailsModal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { trpc } from "@/lib/trpc"
import { toastSvc } from "@/services/toast"
import { Button } from "@/components/ui/button"

type TabType = "single" | "collection"

export default function MyListings() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>("single");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [listingToDelete, setListingToDelete] = useState<any>(null);

    const { 
      data: listings, 
      isLoading, 
      error, 
      refetch 
    } = useMyListings();
  
  console.log(listings, ' listings')

    const deleteMutation = (trpc.listing as any).deleteListing.useMutation({
      onSuccess: () => {
        toastSvc.success("Listing deleted successfully!");
        refetch();
      },
      onError: (error: any) => {
        toastSvc.error(error.message || "Failed to delete listing");
      },
    });

    const handleViewDetails = (listing: any) => {
      setSelectedListing(listing);
      setIsDetailsModalOpen(true);
    };

    const handleEdit = (listing: any) => {
      // Navigate to new-listing page with edit mode (to be implemented)
      router.push(`/sellers/new-listing?edit=${listing.id}`);
    };

    const handleDeleteClick = (listing: any) => {
      setListingToDelete(listing);
      setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
      if (listingToDelete) {
        deleteMutation.mutate({ id: listingToDelete.id });
        setListingToDelete(null);
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

    const filteredListings = listings?.filter((listing: any) => {
      const matchesTab = listing.type === activeTab;
      const matchesSearch = 
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        listing.category?.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    }) || [];

    const handleProductSuccess = () => {
      refetch(); 
    };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Listing</h1>
          <p className="text-gray-400 mt-1">View and manage all your listed products in one place.</p>
        </div>
        <div className="w-80">
          <SearchBar search={search} setSearch={setSearch}/>
        </div>
      </div>

      <div className="flex justify-between mb-6">
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 rounded-md flex items-center transition ${
              activeTab === "single"
                ? "bg-[#1a1a1a] border border-[#333] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="mr-2">Single Items</span>
          </button>
          <button 
            onClick={() => setActiveTab("collection")}
            className={`px-4 py-2 rounded-md transition ${
              activeTab === "collection"
                ? "bg-[#1a1a1a] border border-[#333] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Collections
          </button>
        </div>
        <div className="flex space-x-2">
          <button className="bg-[#1a1a1a] border border-[#333] text-white px-4 py-2 rounded-md flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <span>Filter</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-purple-700 transition"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-[#333] text-gray-400 text-sm">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span>{activeTab === "single" ? "Product Name" : "Collection Name"}</span>
          </div>
          <div>Category</div>
          <div>Price</div>
          <div>{activeTab === "single" ? "Stock" : "Items"}</div>
          <div>Status</div>
          <div>Action</div>
        </div>

        {filteredListings.length === 0 ? (
          <EmptyState
            icon={<Package className="h-16 w-16" />}
            title={`Your ${activeTab === "single" ? "products" : "collections"} list is empty`}
            description={`Once you ${activeTab === "single" ? "add products" : "create collections"}, they will show up here.`}
          />
        ) : (
          filteredListings.map((listing: any) => (
            <div key={listing.id} className="border-b border-[#333]">
              <div className="grid grid-cols-6 gap-4 p-4 items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex items-center">
                    <div className="bg-[#222] p-1 rounded-md mr-2">
                      <Package className="h-5 w-5" />
                    </div>
                    <span>{listing.title}</span>
                  </div>
                </div>
                <div>{listing.category || 'N/A'}</div>
                <div>
                  {listing.type === "single" && listing.priceCents 
                    ? `₦${(listing.priceCents / 100).toLocaleString()}`
                    : listing.type === "collection"
                    ? "Varies"
                    : "N/A"
                  }
                </div>
                <div>
                  {listing.type === "single" 
                    ? listing.quantityAvailable || 0
                    : listing.itemsJson 
                    ? JSON.parse(listing.itemsJson).length 
                    : 0
                  }
                </div>
                <div>
                  {listing.type === "single" ? (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        (listing.quantityAvailable || 0) > 10
                          ? "bg-green-100 text-green-800"
                          : (listing.quantityAvailable || 0) > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                      {(listing.quantityAvailable || 0) > 10
                        ? "In stock"
                        : (listing.quantityAvailable || 0) > 0
                        ? "Low stock"
                        : "Sold out"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Collection
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleViewDetails(listing)}
                    className="bg-[#0a0a0a] border border-[#333] hover:bg-[#222] hover:border-purple-600 text-white text-sm px-4 py-2 rounded transition flex items-center"
                  >
                    View Details
                  </Button>
                  <Button 
                    onClick={() => handleEdit(listing)}
                    className="bg-[#0a0a0a] border border-[#333] hover:bg-purple-600 hover:border-purple-600 text-white text-sm p-2 rounded transition"
                    title="Edit listing"
                  >
                    <SquarePen className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleDeleteClick(listing)}
                    title="Delete listing"
                  >
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AddProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProductSuccess}
      />

      <ListingDetailsModal 
        listing={selectedListing}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedListing(null);
        }}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{listingToDelete?.title}"? This action cannot be undone.
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
  )
}
