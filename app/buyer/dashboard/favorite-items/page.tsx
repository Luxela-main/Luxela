'use client';

import { useState } from 'react';
import { Heart, ShoppingCart, Grid, List, ChevronRight } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

export const dynamic = 'force-dynamic';

export default function FavoriteItemsPage() {
  const { profile } = useProfile();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const favorites = [
    {
      id: 1,
      name: 'Premium Wireless Headphones',
      price: '$129.99',
      originalPrice: '$199.99',
      image: '/placeholder-product.jpg',
      rating: 4.8,
      reviews: 342,
      inStock: true
    },
    {
      id: 2,
      name: 'Smart Watch Pro',
      price: '$299.99',
      originalPrice: '$399.99',
      image: '/placeholder-product.jpg',
      rating: 4.6,
      reviews: 128,
      inStock: true
    },
    {
      id: 3,
      name: 'Portable Charger 20000mAh',
      price: '$45.99',
      originalPrice: '$59.99',
      image: '/placeholder-product.jpg',
      rating: 4.7,
      reviews: 567,
      inStock: true
    },
    {
      id: 4,
      name: 'USB-C Cable (5-pack)',
      price: '$19.99',
      originalPrice: '$29.99',
      image: '/placeholder-product.jpg',
      rating: 4.5,
      reviews: 891,
      inStock: false
    },
    {
      id: 5,
      name: 'Laptop Stand Aluminum',
      price: '$39.99',
      originalPrice: '$59.99',
      image: '/placeholder-product.jpg',
      rating: 4.9,
      reviews: 234,
      inStock: true
    },
    {
      id: 6,
      name: 'Wireless Mouse Pro',
      price: '$59.99',
      originalPrice: '$89.99',
      image: '/placeholder-product.jpg',
      rating: 4.7,
      reviews: 456,
      inStock: true
    }
  ];

  const totalValue = favorites.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(', ''));
    return sum + price;
  }, 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <span className="text-[#7e7e7e]">Home</span>
        <ChevronRight className="w-4 h-4 text-[#7e7e7e]" />
        <span className="text-white">Favorite Items</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-white text-2xl font-semibold mb-2">Favorite Items</h1>
          <p className="text-gray-400">{favorites.length} items saved</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Items</p>
          <p className="text-2xl font-bold text-white">{favorites.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Value</p>
          <p className="text-2xl font-bold text-white">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-500">{favorites.filter(f => f.inStock).length}/{favorites.length}</p>
        </div>
      </div>

      {/* View Toggle */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item) => (
            <div key={item.id} className="bg-[#1a1a1a] border border-[#333333] rounded-lg overflow-hidden hover:border-[#444444] transition-colors group">
              <div className="relative bg-[#0f0f0f] aspect-square overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <button className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-colors">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </button>
                {!item.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2">{item.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-500">★</span>
                  <span className="text-white text-sm">{item.rating}</span>
                  <span className="text-gray-500 text-sm">({item.reviews})</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-white">{item.price}</span>
                  <span className="text-gray-500 line-through text-sm">{item.originalPrice}</span>
                </div>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((item) => (
            <div key={item.id} className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:border-[#444444] transition-colors flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold">{item.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-gray-400 text-sm">{item.rating} ({item.reviews} reviews)</span>
                  {!item.inStock && <span className="text-red-500 text-sm font-medium">Out of Stock</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{item.price}</p>
                  <p className="text-gray-500 text-sm line-through">{item.originalPrice}</p>
                </div>
                <button className="p-2 hover:bg-[#252525] rounded-lg transition-colors">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </button>
                <button disabled={!item.inStock} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}