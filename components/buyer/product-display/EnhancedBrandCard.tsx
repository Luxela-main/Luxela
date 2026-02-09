'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, ShoppingBag, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { toastSvc } from '@/services/toast';
import BrandContactModal from '../modals/BrandContactModal';
import { trpc } from '@/lib/trpc';
import { useBrandFollowersCount, useOptimisticFollowerUpdate } from '@/modules/buyer/queries/useBrands';

interface EnhancedBrandCardProps {
  brand: any;
  productCount?: number;
  variant?: 'grid' | 'featured' | 'compact';
}

export default function EnhancedBrandCard({
  brand,
  productCount = 0,
  variant = 'grid',
}: EnhancedBrandCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const router = useRouter();

  // tRPC queries for brand following
  const { data: isFollowingData } = trpc.buyer.isFollowingBrand.useQuery(
    { brandId: brand?.id || '' },
    { enabled: !!brand?.id }
  );
  const followMutation = trpc.buyer.followBrand.useMutation();

  // Real-time followers count tracking
  const { followersCount, refetch: refetchFollowersCount } = useBrandFollowersCount(
    brand?.id || '',
    brand?.followers_count || brand?.followersCount || 0
  );
  const { tempOffset, updateCount: updateFollowerCount, resetOffset, setActualCount, actualCount } = useOptimisticFollowerUpdate(
    brand?.id || ''
  );

  // Ensure we always have brand data with fallbacks
  const brandName = brand?.brand_name || brand?.name || brand?.brandName || 'Store';
  const brandLogo = brand?.logo || brand?.logoImage || brand?.storeLogo;
  const brandDescription = brand?.description || brand?.storeDescription || '';
  // Use actualCount from server if available, otherwise use followersCount + tempOffset
  const displayFollowersCount = actualCount !== null ? actualCount : (followersCount + tempOffset);
  const totalProds = brand?.totalProducts || productCount || 0;
  const isVerified = brand?.is_verified || brand?.isVerified || false;

  // Update follow status when tRPC query returns data
  useEffect(() => {
    if (isFollowingData !== undefined) {
      setIsFollowing(isFollowingData);
    }
  }, [isFollowingData]);

  // Automatically reset offset after a delay to ensure the refetch completes
  useEffect(() => {
    let resetTimer: NodeJS.Timeout;
    
    if (tempOffset !== 0) {
      // Set a timer to reset the offset after giving the refetch time to complete
      resetTimer = setTimeout(() => {
        resetOffset();
      }, 1500);
    }
    
    return () => {
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [tempOffset, resetOffset]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsFollowLoading(true);
    const wasFollowing = isFollowing;

    try {
      // Optimistic update
      const newFollowStatus = !isFollowing;
      setIsFollowing(newFollowStatus);
      await updateFollowerCount(newFollowStatus);

      // Execute the mutation and get the response with updated count
      const response = await followMutation.mutateAsync({
        brandId: brand.id,
        action: wasFollowing ? 'unfollow' : 'follow',
      });

      if (newFollowStatus) {
        toastSvc.success('Following brand now!');
      } else {
        toastSvc.success('Unfollowed brand');
      }
      
      // Use the exact follower count from the server response
      // Set the actual count from the database to ensure UI matches backend
      if (response.followersCount !== undefined) {
        setActualCount(response.followersCount);
        resetOffset();
      }
    } catch (err) {
      // Revert optimistic update on error
      setIsFollowing(wasFollowing);
      await updateFollowerCount(wasFollowing);
      
      if (err instanceof Error && err.message.includes('UNAUTHORIZED')) {
        toastSvc.error('Please log in to follow brands');
      } else {
        toastSvc.error('Failed to update follow status');
      }
      console.error('Follow error:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/buyer/browse?seller=${brand.sellerId}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContactModal(true);
  };

  if (variant === 'grid' || variant === 'featured') {
    return (
      <>
        <Link href={`/buyer/brand/${brand.slug}`}>
          <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col">
            {/* Brand Logo Section */}
            <div className="relative w-full bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex items-center justify-center min-h-[200px]">
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="max-h-[150px] max-w-[150px] object-contain"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-purple-600" />
                </div>
              )}
            </div>

            {/* Brand Info Section */}
            <div className="flex-1 p-4 flex flex-col">
              {/* Brand Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                {brandName}
              </h3>

              {/* Followers and Products */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" fill="currentColor" />
                  <span>{displayFollowersCount} followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{totalProds} products</span>
                </div>
              </div>

              {/* Description */}
              {brandDescription && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {brandDescription}
                </p>
              )}

              {/* Action Buttons - Shop and Follow are inside Link */}
              <div className="mt-auto flex gap-2">
                <Button
                  onClick={handleShop}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Shop Brand
                </Button>

                <button
                  onClick={handleMessage}
                  className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  title="Message brand"
                >
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                </button>

                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className="p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title={isFollowing ? 'Unfollow' : 'Follow'}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={isFollowing ? '#ef4444' : 'none'}
                    stroke={isFollowing ? '#ef4444' : '#9ca3af'}
                  />
                </button>
              </div>
            </div>

            {/* Verified Badge */}
            {isVerified && (
              <div className="absolute top-4 right-4 bg-[#8451E1] text-white rounded-full p-1 shadow-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
          </div>
        </Link>

        {/* Contact Modal */}
        <BrandContactModal
          brand={brand}
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
        />
      </>
    );
  }

  // List view variant - Compact card view
  if (variant === 'compact') {
    return (
      <div className="relative">
        <Link href={`/buyer/brand/${brand.slug}`}>
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
            {/* Logo */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="max-h-16 max-w-16 object-contain"
                />
              ) : (
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{brandName}</h3>
                {isVerified && (
                  <CheckCircle className="w-5 h-5 text-[#8451E1] flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                <span>{displayFollowersCount} followers</span>
                <span>•</span>
                <span>{productCount} products</span>
              </div>
              {brandDescription && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                  {brandDescription}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={handleShop}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg"
              >
                View Brand
              </Button>

              <button
                onClick={handleMessage}
                className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                title="Message brand"
              >
                <MessageCircle className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className="p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Heart
                  className="w-5 h-5"
                  fill={isFollowing ? '#ef4444' : 'none'}
                  stroke={isFollowing ? '#ef4444' : '#9ca3af'}
                />
              </button>
            </div>
          </div>
        </Link>

        {/* Contact Modal */}
        <BrandContactModal
          brand={brand}
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
        />
      </div>
    );
  }

  return null;
}
