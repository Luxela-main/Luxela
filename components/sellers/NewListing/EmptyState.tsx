// EmptyState.tsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ListingType } from '@/types/newListing';

interface EmptyStateProps {
  onAddProduct: (type: ListingType) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddProduct }) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-400">New Listing</div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                className="bg-[#1a1a1a] border border-[#333] rounded-lg pl-10 pr-4 py-2 w-96 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">New Listing</h1>
            <p className="text-gray-400">List product and fill in your listing details</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg hover:border-gray-600 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Filter
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-10">
                  <button
                    onClick={() => {
                      onAddProduct('single');
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252525] transition text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Single item
                  </button>
                  <button
                    onClick={() => {
                      onAddProduct('collection');
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252525] transition text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Collection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 250px)' }}>
        <div className="mb-6">
          <div className="relative">
            <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            <svg className="w-8 h-8 text-white absolute -right-2 -bottom-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-medium mb-2">No products listed yet</h2>
        <p className="text-gray-400">once you start add products, your products</p>
        <p className="text-gray-400">will show up here.</p>
      </div>
    </div>
  );
};

export default EmptyState;