'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Grid, List, ChevronRight, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';
import { useToast } from '@/hooks/use-toast';

export default function FavoriteItemsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: favoritesData } = trpc.buyer.getFavorites.useQuery(
    { page: currentPage, limit: 10 },
    { retry: 1 }
  );

  const { toast } = useToast();

  useEffect(() => {
    if (favoritesData) {
      setFavorites(favoritesData.data || []);
      setIsLoading(false);
    }
  }, [favoritesData]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      setFavorites(favorites.filter(item => item.favoriteId !== favoriteId));
      toast({
        title: 'Removed from favorites',
        description: 'Item removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const handleAddToCart = async (listingId: string) => {
    try {
      toast({
        title: 'Added to cart',
        description: 'Item added to your cart',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to cart',
        variant: 'destructive',
      });
    }
  };

  const totalValue = favorites.reduce((sum, item) => {
    const priceCents = item.priceCents || 0;
    return sum + priceCents / 100;
  }, 0);

  const availableItems = favorites.length;

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/buyer/dashboard' },
          { label: 'Favorites' }
        ]} />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">My Favorite Items</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded cursor-pointer transition ${
                  viewMode === 'grid'
                    ? 'bg-[#8451e1] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded cursor-pointer transition ${
                  viewMode === 'list'
                    ? 'bg-[#8451e1] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#ECBEE3]">
              <p className="text-[#EA795B] text-sm font-bold uppercase tracking-widest">Total Items</p>
              <p className="text-2xl font-bold text-white mt-2">{favorites.length}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#ECE3BE]">
              <p className="text-[#BEECE3] text-sm font-bold uppercase tracking-widest">Total Value</p>
              <p className="text-2xl font-bold text-[#BEE3EC] mt-2">${totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#BEE3EC]">
              <p className="text-[#ECBEE3] text-sm font-bold uppercase tracking-widest">Available Items</p>
              <p className="text-2xl font-bold text-white mt-2">{availableItems}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Heart className="text-[#8451e1]" size={32} />
            </div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg p-12 text-center">
            <Heart className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 text-lg">No favorite items yet</p>
            <p className="text-gray-500 text-sm mt-2">Start adding items to your favorites</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(item => (
              <div key={item.id} className="bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#252525] transition">
                <div className="aspect-square bg-[#0e0e0e] relative overflow-hidden">
                  <img
                    src={item.image || 'https://via.placeholder.com/300'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full cursor-pointer transition"
                  >
                    <Heart size={16} fill="currentColor" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-gray-400 text-xs uppercase tracking-widest">{item.category}</p>
                  <h3 className="text-white font-semibold mt-2 line-clamp-2">{item.name}</h3>
                  <p className="text-[#8451e1] text-lg font-bold mt-2">{item.price}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAddToCart(item.id)}
                      className="flex-1 bg-[#8451e1] hover:bg-[#7040d1] text-white py-2 rounded cursor-pointer transition flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(item.id)}
                      className="bg-[#252525] hover:bg-[#353535] text-white p-2 rounded cursor-pointer transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map(item => (
              <div key={item.id} className="bg-[#1a1a1a] rounded-lg p-4 flex gap-4 hover:bg-[#252525] transition">
                <img
                  src={item.image || 'https://via.placeholder.com/100'}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-gray-400 text-xs uppercase tracking-widest">{item.category}</p>
                  <h3 className="text-white font-semibold mt-1">{item.name}</h3>
                  <p className="text-[#8451e1] text-lg font-bold mt-2">{item.price}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAddToCart(item.id)}
                      className="bg-[#8451e1] hover:bg-[#7040d1] text-white px-4 py-2 rounded cursor-pointer transition text-sm flex items-center gap-2"
                    >
                      <ShoppingCart size={14} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(item.id)}
                      className="bg-[#252525] hover:bg-[#353535] text-white px-4 py-2 rounded cursor-pointer transition text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}