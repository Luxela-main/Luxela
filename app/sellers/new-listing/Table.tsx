import React, { useState } from 'react';
import { MoreVertical, Package, Filter, Plus } from 'lucide-react';

const ProductListingTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const itemsPerPage = 10;

  // Sample data
  const products = [
    { id: 1, name: 'Product Name', category: "Men's clothing", price: '₦40,000.00', stock: 300, status: 'in stock' },
    { id: 2, name: 'Product Name', category: "Women's clothing", price: '₦50,000.00', stock: 280, status: 'low stock' },
    { id: 3, name: 'Product Name', category: "Men's clothing", price: '₦40,000.00', stock: 300, status: 'sold out' },
    { id: 4, name: 'Product Name', category: "Men's clothing", price: '₦40,000.00', stock: 300, status: 'in stock' },
    { id: 5, name: 'Product Name', category: "Women's clothing", price: '₦50,000.00', stock: 280, status: 'low stock' },
    { id: 6, name: 'Product Name', category: "Men's clothing", price: '₦40,000.00', stock: 300, status: 'in stock' },
    { id: 7, name: 'Product Name', category: "Women's clothing", price: '₦50,000.00', stock: 280, status: 'sold out' },
    { id: 8, name: 'Product Name', category: "Men's clothing", price: '₦40,000.00', stock: 300, status: 'in stock' },
    { id: 9, name: 'Product Name', category: "Women's clothing", price: '₦50,000.00', stock: 280, status: 'low stock' },
    { id: 10, name: 'Product Name', category: "Men's clothing", price: '₦40,000.00', stock: 300, status: 'in stock' },
  ];

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const toggleSelectAll = () => {
    if (selectedItems.length === currentProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentProducts.map(p => p.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in stock':
        return 'text-green-500';
      case 'low stock':
        return 'text-yellow-500';
      case 'sold out':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'in stock':
        return 'bg-green-500';
      case 'low stock':
        return 'bg-yellow-500';
      case 'sold out':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">My Listing</h1>
        <p className="text-gray-400 text-sm">View and manage all your listed products in one place.</p>
      </div>

      {/* Tabs and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-6 border-b border-gray-800">
          <button className="pb-3 px-1 text-purple-500 border-b-2 border-purple-500 font-medium">
            Single Items
          </button>
          <button className="pb-3 px-1 text-gray-400 hover:text-white transition-colors">
            Collections
          </button>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-lg hover:bg-[#252525] transition-colors border border-gray-800">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Product</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 font-medium text-gray-400 text-sm w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === currentProducts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-transparent"
                  />
                </th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Product Name</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Category</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Price</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Stock</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Status</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-800 hover:bg-[#222] transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(product.id)}
                      onChange={() => toggleSelectItem(product.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-transparent"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{product.category}</td>
                  <td className="p-4 text-gray-300">{product.price}</td>
                  <td className="p-4 text-gray-300">{product.stock}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusDot(product.status)}`}></div>
                      <span className={`text-sm capitalize ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden">
          {currentProducts.map((product) => (
            <div key={product.id} className="p-4 border-b border-gray-800 hover:bg-[#222] transition-colors">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(product.id)}
                  onChange={() => toggleSelectItem(product.id)}
                  className="w-4 h-4 rounded border-gray-600 bg-transparent mt-1"
                />
                <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-white">{product.name}</h3>
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-gray-300">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-gray-300">{product.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stock:</span>
                      <span className="text-gray-300">{product.stock}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(product.status)}`}></div>
                        <span className={`capitalize ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-400">
          Result {startIndex + 1} - {Math.min(endIndex, products.length)} of {products.length}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-700 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Show first page, last page, current page, and pages around current
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'border border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            } else if (
              pageNum === currentPage - 2 ||
              pageNum === currentPage + 2
            ) {
              return (
                <span key={pageNum} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }
            return null;
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-700 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListingTable;