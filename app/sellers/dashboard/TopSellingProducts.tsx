"use client";

import { useState } from "react";
import { TopSellingProduct } from "@/modules/sellers/model/dashboard";
import { Button } from "@/components/ui/button";
import { Shirt, ChevronLeft, ChevronRight } from "lucide-react";

interface TopSellingProductsProps {
  products: TopSellingProduct[];
}

export function TopSellingProducts({ products }: TopSellingProductsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border-2 border-l-4 border-l-[#ECE3BE] bg-gradient-to-br from-[#ECE3BE]/10 via-transparent border-[#ECE3BE]/40">
      <div className="flex justify-between items-center p-4 border-b-2 border-b-[#ECE3BE]/30">
        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ECE3BE] to-[#ECBEE3]">Top Selling Product</h3>
        <Button
          variant="outline"
          className="bg-transparent border-[#ECE3BE]/40 text-white hover:bg-[#ECE3BE]/20 hover:border-[#ECE3BE]/60 text-sm"
        >
          View All
        </Button>
      </div>
      <div className="grid grid-cols-6 gap-4 p-4 border-b-2 border-b-[#ECE3BE]/30 text-gray-400 text-sm bg-gradient-to-r from-[#ECE3BE]/5 to-transparent">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
          />
          <span>Product Name</span>
        </div>
        <div>Category</div>
        <div>Price</div>
        <div>Quantity sold</div>
        <div>Status</div>
        <div>Action</div>
      </div>

      {currentProducts.length > 0 ? (
        currentProducts.map((product, index) => (
          <div key={product.id || index} className="border-b border-[#ECE3BE]/20 hover:bg-[#ECE3BE]/5 transition-colors">
            <div className="grid grid-cols-6 gap-4 p-4 items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-[#ECE3BE]/30 to-[#ECBEE3]/30 p-1 rounded-md mr-2">
                    <Shirt className="h-5 w-5 text-[#ECE3BE]" />
                  </div>
                  <span>{product.name}</span>
                </div>
              </div>
              <div>{product.category}</div>
              <div>{product.price}</div>
              <div>{product.quantitySold}</div>
              <div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === "In stock"
                      ? "bg-green-100 text-green-800"
                      : product.status === "Low stock"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-1.5 ${
                      product.status === "In stock"
                        ? "bg-[#BEECE3]"
                        : product.status === "Low stock"
                        ? "bg-[#ECE3BE]"
                        : "bg-[#EA795B]"
                    }`}
                  ></span>
                  {product.status}
                </span>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="bg-transparent border-[#ECE3BE]/40 text-white hover:bg-[#ECE3BE]/20 hover:border-[#ECE3BE]/60 text-sm"
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-gray-400">
          <p>No sales data yet. Create listings to start selling!</p>
        </div>
      )}

      <div className="flex justify-between items-center bg-[#1a1a1a] p-4 text-sm border-t-2 border-t-[#ECE3BE]/30"> 
        <div className="text-gray-400">
          {products.length > 0
            ? `Result ${startIndex + 1} - ${Math.min(
                endIndex,
                products.length
              )} of ${products.length}`
            : "No results"}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="bg-transparent border-[#ECE3BE]/40 hover:bg-[#ECE3BE]/20 hover:border-[#ECE3BE]/60 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center px-2">
           <span className="text-gray-400">Page {currentPage} of {totalPages || 1}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="bg-transparent border-[#ECE3BE]/40 hover:bg-[#ECE3BE]/20 hover:border-[#ECE3BE]/60 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}