"use client";

import { useState } from "react";
import { Filter, MoreVertical, X } from "lucide-react";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { useSales, useSaleById } from "@/modules/sellers";
import { LoadingState } from "@/components/sellers/LoadingState";
import { ErrorState } from "@/components/sellers/ErrorState";
import { getStatusFromTab } from "@/constants";

export default function Sales() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: salesData,
    isLoading,
    error,
    refetch,
  } = useSales(getStatusFromTab(activeTab));

  // Always call hooks at top level before any conditional returns
  const { data: selectedOrderData } = useSaleById(selectedOrder || '');

  if (isLoading) {
    return <LoadingState message="Loading sales data..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load sales data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const sales = salesData || [];

  const handleOrderClick = (orderId: string) => {
    setSelectedOrder(orderId);
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
  };

  const tabs = [
    "All",
    "Processing",
    "Shipped",
    "In transit",
    "Delivered",
    "Canceled",
    "Returned",
  ];

  return (
    <div className="pt-16 px-6 md:pt-0 relative">
      <div className="mb-6">
        <div className="w-60 z-10 lg:w-80 max-lg:fixed max-md:right-10 max-lg:right-12 max-lg:top-[18px] lg:ml-auto">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>
      <div className="mb-6 md:max-lg:pt-10">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <p className="text-gray-400 mt-1">View and manage all your sales</p>
      </div>

      <div className="flex justify-between mb-6">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 ${
                activeTab === tab
                  ? "bg-[#1a1a1a] border-b-2 border-purple-600 text-white"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <button className="bg-[#1a1a1a] border border-[#333] text-white px-4 py-2 rounded-md flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <span>Filter</span>
          </button>
          <button className="bg-[#1a1a1a] border border-[#333] text-white px-4 py-2 rounded-md flex items-center">
            <span>Sort by date</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md">
            Export
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="grid grid-cols-9 gap-4 p-4 border-b border-[#333] text-gray-400 text-sm">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span>Order ID</span>
          </div>
          <div>Product</div>
          <div>Customer</div>
          <div>Order Date</div>
          <div>Payment Method</div>
          <div>Amount</div>
          <div>Payout status</div>
          <div>Delivery status</div>
          <div>Action</div>
        </div>

        {sales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order, index) => (
          <div key={index} className="border-b border-[#333]">
            <div className="grid grid-cols-9 gap-4 p-4 items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <span>ID: {order.orderId}</span>
              </div>
              <div>{order.product}</div>
              <div>{order.customer}</div>
              <div>{new Date(order.orderDate).toLocaleDateString()}</div>
              <div>{order.paymentMethod}</div>
              <div>₦{((order.amountCents || 0) / 100).toLocaleString()}</div>
              <div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    order.payoutStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.payoutStatus === "processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1 ${
                      order.payoutStatus === "paid"
                        ? "bg-green-600"
                        : order.payoutStatus === "processing"
                          ? "bg-yellow-600"
                          : "bg-red-600"
                    }`}
                  ></span>
                  {order.payoutStatus === "paid"
                    ? "Paid"
                    : order.payoutStatus === "processing"
                      ? "Processing"
                      : "In Escrow"}
                </span>
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    order.deliveryStatus === "delivered"
                      ? "bg-green-100 text-green-800"
                      : order.deliveryStatus === "in_transit"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.deliveryStatus === "delivered"
                    ? "Delivered"
                    : order.deliveryStatus === "in_transit"
                      ? "In Transit"
                      : "Not Shipped"}
                </span>
              </div>
              <div>
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => handleOrderClick(order.orderId)}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 text-sm">
        <div className="text-gray-400">Result 1 - 10 of 20</div>
        <div className="flex space-x-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="border border-[#333] text-gray-400 px-3 py-1 rounded-md flex items-center disabled:opacity-50">
            <span className="mr-1">Previous</span>
          </button>
          <button className="bg-purple-600 text-white px-3 py-1 rounded-md">
            1
          </button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md">
            2
          </button>
          <button className="text-gray-400 px-3 py-1">...</button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md">
            4
          </button>
          <button onClick={() => setCurrentPage(p => p + 1)} className="border border-[#333] text-gray-400 px-3 py-1 rounded-md flex items-center">
            <span className="mr-1">Next</span>
          </button>
        </div>
      </div>

      {selectedOrder && selectedOrderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">Order Id:</span>
                  <span className="font-medium">#{selectedOrderData?.orderId || selectedOrder}</span>
                </div>
                <button
                  onClick={closeOrderDetail}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-[#222] rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Order Summary</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1"></span>
                    Processing
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer</span>
                    <span>{selectedOrderData?.customer || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Product</span>
                    <span>{selectedOrderData?.product || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantity</span>
                    <span>{selectedOrderData?.quantity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order date</span>
                    <span>{selectedOrderData?.orderDate ? new Date(selectedOrderData.orderDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount</span>
                    <span>₦{((selectedOrderData?.amountCents || 0) / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method</span>
                    <span>{selectedOrderData?.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Status</span>
                    <span className="inline-flex items-center text-blue-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>
                      {selectedOrderData?.payoutStatus === 'paid' ? 'Paid' : selectedOrderData?.payoutStatus === 'processing' ? 'Processing' : 'In Escrow'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#222] rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Shipping Details</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Not Shipped
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping Address</span>
                    <span>{selectedOrderData?.shippingAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#222] rounded-lg p-4 mb-6">
                <div className="mb-2">
                  <h3 className="text-lg font-medium mb-4">
                    Estimated delivery window
                  </h3>
                  <div className="border border-[#333] rounded-md p-3 bg-[#1a1a1a]">
                    <div className="flex items-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 text-gray-400"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M16 2V6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 2V6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 10H21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Est. delivery: 2-3 business days</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Order Status</h3>
                  <div className="border border-[#333] rounded-md p-3 bg-[#1a1a1a]">
                    <div className="flex items-center justify-between">
                      <span>Update order status</span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}