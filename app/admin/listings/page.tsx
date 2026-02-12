"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye, Search, Headphones, Package } from "lucide-react";
import { formatNaira } from "@/lib/currency";

type FilterStatus = "pending" | "revision_requested" | "approved" | "rejected" | "all";

export default function AdminListingsReview() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 20;

  const { data: stats, isLoading: statsLoading } = trpc.adminListingReview.getDashboardStats.useQuery();

  const { data: listingsData, isLoading: listingsLoading, refetch } = trpc.adminListingReview.getPendingListings.useQuery({
    page: currentPage,
    limit: pageSize,
    status: filterStatus === "all" ? undefined : filterStatus,
  });

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-900 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-900 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-900 border-red-300";
      case "revision_requested":
        return "bg-orange-100 text-orange-900 border-orange-300";
      default:
        return "bg-gray-100 text-gray-900 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "revision_requested":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredListings = listingsData?.listings.filter((listing) =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto w-full">
        {}
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-[#2B2B2B]">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Listing Review Dashboard</h1>
          <p className="text-sm sm:text-base text-[#9CA3AF] mt-1 sm:mt-2 font-medium mb-4">
            Review and manage seller listings before they go live. Approve, reject, or request revisions.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/support" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#8451E1]/10 hover:bg-[#8451E1]/20 text-[#8451E1] transition-colors text-sm">
              <Headphones className="w-4 h-4" />
              Support Dashboard
            </Link>
            <Link href="/admin/orders" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors text-sm">
              <Package className="w-4 h-4" />
              Orders Management
            </Link>
            <Link href="/admin/disputes" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm">
              <AlertCircle className="w-4 h-4" />
              Disputes & Returns
            </Link>
          </div>
        </div>

        {}
        {statsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#8451e1]" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#9CA3AF]">
                  Total Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.total}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-500">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-500">
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {stats.approved}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-500">
                  Needs Revision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">
                  {stats.revision_requested}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-500">
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">
                  {stats.rejected}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {}
        <Card className="bg-[#1a1a1a] border-[#2B2B2B]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listings</CardTitle>
                <CardDescription>
                  Manage and review seller listings
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 max-w-xs">
                <Search className="w-4 h-4 text-[#9CA3AF]" />
                <Input
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0e0e0e] border-[#2B2B2B] text-white placeholder-[#6B7280]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {}
            <Tabs value={filterStatus} onValueChange={(v) => handleFilterChange(v as FilterStatus)} className="mb-6 cursor-pointer">
              <TabsList className="bg-[#0e0e0e] border border-[#2B2B2B]">
                <TabsTrigger value="pending" className="cursor-pointer">
                  Pending ({stats?.pending ?? 0})
                </TabsTrigger>
                <TabsTrigger value="revision_requested" className="cursor-pointer">
                  Needs Revision ({stats?.revision_requested ?? 0})
                </TabsTrigger>
                <TabsTrigger value="approved" className="cursor-pointer">
                  Approved ({stats?.approved ?? 0})
                </TabsTrigger>
                <TabsTrigger value="all" className="cursor-pointer">
                  All ({stats?.total ?? 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {}
            {listingsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#8451e1]" />
              </div>
            ) : listingsData && filteredListings.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2B2B2B]">
                        <TableHead className="text-[#9CA3AF]">Title</TableHead>
                        <TableHead className="text-[#9CA3AF]">Seller</TableHead>
                        <TableHead className="text-[#9CA3AF]">Category</TableHead>
                        <TableHead className="text-[#9CA3AF]">Price</TableHead>
                        <TableHead className="text-[#9CA3AF]">Status</TableHead>
                        <TableHead className="text-[#9CA3AF]">Review</TableHead>
                        <TableHead className="text-[#9CA3AF]">Submitted</TableHead>
                        <TableHead className="text-[#9CA3AF]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredListings.map((listing) => (
                        <TableRow key={listing.listingId} className="hover:bg-[#0e0e0e] border-[#2B2B2B]">
                          <TableCell className="font-medium max-w-xs truncate text-white">
                            <div className="flex items-center gap-2">
                              <span>{listing.title}</span>
                              {listing.type === 'collection' ? (
                                <Badge variant="secondary" className="bg-[#8451e1]/30 text-[#8451e1] text-xs shrink-0">
                                  Collection
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-blue-500/30 text-blue-400 text-xs shrink-0">
                                  Single
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-[#9CA3AF]">
                            {listing.sellerName || "Unknown Seller"}
                          </TableCell>
                          <TableCell className="capitalize text-[#9CA3AF]">
                            {listing.category ? listing.category.replace(/_/g, " ") : "Uncategorized"}
                          </TableCell>
                          <TableCell className="text-[#9CA3AF]">
                            <div className="flex flex-col gap-1">
                              <span>{listing.price ? formatNaira(listing.price, true) : "N/A"}</span>
                              {listing.type === 'collection' && listing.collectionItemCount && (
                                <span className="text-xs text-[#6B7280]">({listing.collectionItemCount} items)</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(listing.status)}>
                              {listing.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {listing.reviewStatus ? (
                              <Badge 
                                variant="outline"
                                className="flex items-center gap-1 w-fit"
                              >
                                {getStatusIcon(listing.reviewStatus)}
                                {listing.reviewStatus.replace(/_/g, " ")}
                              </Badge>
                            ) : (
                              <span className="text-[#6B7280] text-sm">Not reviewed</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-[#9CA3AF]">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/listings/${listing.listingId}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2 cursor-pointer border-[#2B2B2B] hover:bg-[#8451e1] hover:border-[#8451e1]"
                              >
                                <Eye className="w-4 h-4" />
                                Review
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {}
                {listingsData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#2B2B2B]">
                    <div className="text-sm text-[#9CA3AF]">
                      Page {listingsData.page} of {listingsData.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-[#2B2B2B] hover:bg-[#8451e1]"
                        disabled={listingsData.page === 1}
                        onClick={() => setCurrentPage(listingsData.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#2B2B2B] hover:bg-[#8451e1]"
                        disabled={listingsData.page === listingsData.totalPages}
                        onClick={() => setCurrentPage(listingsData.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#9CA3AF]">No listings found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}