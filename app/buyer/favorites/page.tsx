'use client';

import { useEffect, useState } from 'react';
import { getBuyerFavorites } from '@/server/actions/favorites';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/hooks/useToast';
import { useCartState } from '@/modules/cart/context';

interface Favorite {
  id: string;
  listing: {
    id: string;
    title: string;
    image: string;
    price_cents: number;
    currency: string;
    quantity_available: number;
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { addToCart } = useCartState();

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const result = await getBuyerFavorites();
        if (result.success) {
          setFavorites(result.favorites as Favorite[]);
        } else {
          toast?.error?.(result.error || 'Failed to load favorites');
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast?.error?.('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user?.id]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      setRemovingId(favoriteId);
      const response = await fetch(`/api/buyer/favorites/${favoriteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites(favorites.filter((f) => f.id !== favoriteId));
        toast?.success?.('Removed from favorites');
      } else {
        toast?.error?.('Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast?.error?.('Failed to remove from favorites');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (listingId: string) => {
    try {
      setAddingToCartId(listingId);
      await addToCart(listingId, 1);
      toast?.success?.('Added to cart');
    } catch (error: any) {
      const isAuthError =
        error.message?.includes('signed in') ||
        error.data?.code === 'UNAUTHORIZED';

      if (isAuthError) {
        router.push(`/signin?redirect=/buyer/favorites`);
      } else {
        toast?.error?.('Failed to add to cart');
      }
    } finally {
      setAddingToCartId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight">
              My Favorites
            </h1>
          </div>
          <p className="text-gray-400">
            {favorites.length === 0
              ? "You haven't saved any products yet"
              : `You have ${favorites.length} favorite item${favorites.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Heart className="w-16 h-16 text-gray-700 mb-4" />
            <h2 className="text-2xl font-light mb-2">No favorites yet</h2>
            <p className="text-gray-400 mb-6 text-center max-w-md">
              Start saving your favorite products to easily find them later
            </p>
            <Link
              href="/buyer"
              className="px-6 py-3 bg-[#8451E1] hover:bg-[#9665F5] text-white rounded-lg font-semibold transition-colors uppercase tracking-wide"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="group bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] rounded-xl border border-[#1a1a1a] overflow-hidden hover:border-[#8451E1]/30 transition-all hover:shadow-lg hover:shadow-[#8451E1]/10"
              >
                {/* Image Container */}
                <Link
                  href={`/buyer/product/${favorite.listing.id}`}
                  className="relative overflow-hidden bg-black h-64 block"
                >
                  <img
                    src={favorite.listing.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'}
                    alt={favorite.listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                {/* Content */}
                <div className="p-4">
                  {/* Title */}
                  <Link
                    href={`/buyer/product/${favorite.listing.id}`}
                    className="block"
                  >
                    <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 hover:text-[#8451E1] transition-colors">
                      {favorite.listing.title}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg font-light text-white">
                      {(favorite.listing.price_cents / 100).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      {favorite.listing.currency}
                    </span>
                  </div>

                  {/* Stock Status */}
                  <p
                    className={`text-xs font-semibold mb-4 ${
                      favorite.listing.quantity_available > 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {favorite.listing.quantity_available > 0
                      ? `${favorite.listing.quantity_available} in stock`
                      : 'Out of stock'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(favorite.listing.id)}
                      disabled={
                        addingToCartId === favorite.listing.id ||
                        favorite.listing.quantity_available === 0
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#8451E1] hover:bg-[#9665F5] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      disabled={removingId === favorite.id}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
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