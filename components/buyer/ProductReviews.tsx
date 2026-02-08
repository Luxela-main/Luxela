'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, ThumbsDown, Send, Loader2 } from 'lucide-react'
import { getListingReviews, getListingStats, submitReview, hasUserReviewedListing } from '@/server/actions/reviews'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/hooks/useToast'

interface ProductReviewsProps {
  productId: string
}

interface Review {
  id: string
  buyer: {
    id: string
    userId: string
    createdAt: Date
    updatedAt: Date
    account: {
      username: string
      id: string
      createdAt: Date
      updatedAt: Date
      email: string
      buyerId: string
      fullName: string
      dateOfBirth: Date | null
      phoneNumber: string | null
      profilePicture: string | null
      orderUpdates: boolean
      promotionalEmails: boolean
      securityAlerts: boolean
      country: string
      state: string
    } | null
  } | null
  rating: number
  comment: string | null
  createdAt: Date
  buyerId: string
  listingId: string
}

interface RatingStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: Array<{ stars: number; count: number; percentage: number }>
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [showForm, setShowForm] = useState(false)

  const { user } = useAuth()
  const toast = useToast()

  // Fetch reviews and stats on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [reviewsRes, statsRes, reviewStatusRes] = await Promise.all([
          getListingReviews(productId),
          getListingStats(productId),
          user ? hasUserReviewedListing(productId) : Promise.resolve({ hasReviewed: false }),
        ])

        if (reviewsRes.success) {
          setReviews(reviewsRes.reviews)
        }
        if (statsRes.success) {
          setStats(statsRes.stats as RatingStats)
        }
        if (reviewStatusRes.hasReviewed) {
          setHasReviewed(true)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
        toast.error('Failed to load reviews')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId, user])

  const handleSubmitReview = async () => {
    if (!user) {
      toast.warning('Please sign in to submit a review')
      return
    }

    if (!reviewForm.comment.trim()) {
      toast.warning('Please write a comment')
      return
    }

    try {
      setSubmitting(true)
      const result = await submitReview({
        listingId: productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      })

      if (result.success) {
        toast.success('Review submitted successfully')
        setReviewForm({ rating: 5, comment: '' })
        setShowForm(false)
        setHasReviewed(true)
        
        // Refresh reviews
        const [reviewsRes, statsRes] = await Promise.all([
          getListingReviews(productId),
          getListingStats(productId),
        ])
        if (reviewsRes.success) setReviews(reviewsRes.reviews)
        if (statsRes.success) setStats(statsRes.stats as RatingStats)
      } else {
        toast.error(result.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClasses = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'fill-[#8451E1] text-[#8451E1]' : 'fill-gray-700 text-gray-700'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] rounded-2xl border border-[#1a1a1a] p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-[#8451E1] animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] rounded-2xl border border-[#1a1a1a] p-8">
      <h2 className="text-lg font-light mb-8 tracking-widest uppercase text-white flex items-center gap-3">
        <span className="w-1 h-6 bg-gradient-to-b from-[#8451E1] to-[#7240D0] rounded-full"></span>
        Ratings & Reviews
      </h2>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-[#1a1a1a]">
        {/* Overall Rating */}
        <div>
          <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">Product Rating</h3>
          <div className="flex items-center gap-8">
            {/* Main Rating */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                {renderStars(Math.round(stats?.averageRating || 0), 'lg')}
                <span className="text-3xl font-light">{stats?.averageRating?.toFixed(1) ?? '0.0'}</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">{stats?.totalReviews ?? 0} verified reviews</p>
            </div>

            {/* Rating Bars */}
            <div className="flex-1 space-y-2">
              {stats?.ratingDistribution?.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    {renderStars(item.stars, 'sm')}
                  </div>
                  <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#8451E1] to-[#7240D0] rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs relative right-0 text-gray-500 w-8">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Review Section */}
      {user && !hasReviewed && !showForm && (
        <div className="mb-8 pb-8 border-b border-[#1a1a1a]">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#8451E1] hover:bg-[#9665F5] text-white text-sm font-semibold rounded-lg transition-colors uppercase tracking-wide"
          >
            Write a Review
          </button>
        </div>
      )}

      {/* Review Form */}
      {showForm && user && (
        <div className="mb-8 pb-8 border-b border-[#1a1a1a] p-6 bg-[#161616]/50 rounded-lg">
          <h4 className="text-white font-semibold mb-4">Share Your Experience</h4>
          
          {/* Rating Selection */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= reviewForm.rating
                        ? 'fill-[#8451E1] text-[#8451E1]'
                        : 'fill-gray-700 text-gray-700 hover:fill-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Your Review</label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Share your thoughts about this product..."
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg p-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#8451E1] resize-none h-24"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-[#8451E1] hover:bg-[#9665F5] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Review
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-light mb-8 tracking-widest uppercase text-white flex items-center gap-3">
          <span className="w-1 h-6 bg-gradient-to-b from-[#8451E1] to-[#7240D0] rounded-full"></span>
          Recent Reviews ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => {
              const displayName =
                review.buyer?.account?.fullName ||
                review.buyer?.account?.username ||
                'Anonymous Buyer'
              const avatarSeed = review.buyer?.id?.substring(0, 8) || 'default'
              const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`

              return (
                <div key={review.id} className="pb-6 border-b border-[#1a1a1a] last:border-0">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-10 h-10 rounded-full bg-gray-800"
                      />
                      <div>
                        <p className="font-semibold text-white">{displayName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating, 'sm')}
                          <span className="text-xs text-gray-500">
                            • {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.comment && (
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {review.comment}
                    </p>
                  )}

                  {/* Helpful Buttons */}
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-[#8451E1] transition-colors font-medium">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful</span>
                    </button>
                    <button className="flex items-center cursor-pointer gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors font-medium">
                      <ThumbsDown className="w-4 h-4" />
                      <span>Not Helpful</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}