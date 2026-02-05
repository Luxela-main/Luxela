"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";

type FilterStatus = "pending" | "revision_requested" | "approved" | "rejected" | "all";

export default function AdminListingsReview() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const pageSize = 20;

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.adminListingReview.getDashboardStats.useQuery();

  // Fetch pending listings
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
        return "bg-yellow-50 text-yellow-900 border-yellow-200";
      case "approved":
        return "bg-green-50 text-green-900 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-900 border-red-200";
      case "revision_requested":
        return "bg-orange-50 text-orange-900 border-orange-200";
      default:
        return "bg-gray-50 text-gray-900 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "needs_revision":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-[#ECBEE3] bg-gradient-to-r from-[#0E0E0E] to-[#1a1a1a]">
          <h1 className="text-3xl font-bold text-white">Listing Review Dashboard</h1>
          <p className="text-[#EA795B] mt-2 font-medium">
            Review and manage seller listings before they go live
          </p>
        </div>

        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-900">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-900">
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {stats.approved}
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-900">
                  Needs Revision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {stats.revision_requested}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-900">
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats.rejected}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Listings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listings</CardTitle>
            <CardDescription>
              Manage and review seller listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Tabs */}
            <Tabs value={filterStatus} onValueChange={(v) => handleFilterChange(v as FilterStatus)} className="mb-6 cursor-pointer">
              <TabsList>
                <TabsTrigger value="pending" className="cursor-pointer">
                  Pending ({stats?.pending ?? 0})
                </TabsTrigger>
                <TabsTrigger value="revision_requested" className="cursor-pointer">
                  Needs Revision ({stats?.revision_requested ?? 0})
                </TabsTrigger>
                <TabsTrigger value="all" className="cursor-pointer">
                  All ({stats?.total ?? 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Loading State */}
            {listingsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : listingsData && listingsData.listings.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Review Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listingsData.listings.map((listing) => (
                        <TableRow key={listing.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium max-w-xs truncate">
                            {listing.title}
                          </TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell className="capitalize">
                            {"N/A"}
                          </TableCell>
                          <TableCell>
                            {listing.price ? `$${(listing.price / 100).toFixed(2)}` : "N/A"}
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
                              <span className="text-gray-500 text-sm">Not reviewed</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/listings/${listing.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2 cursor-pointer"
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

                {/* Pagination */}
                {listingsData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-600">
                      Page {listingsData.page} of {listingsData.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={listingsData.page === 1}
                        onClick={() => setCurrentPage(listingsData.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
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
                <p className="text-gray-500">No listings found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}