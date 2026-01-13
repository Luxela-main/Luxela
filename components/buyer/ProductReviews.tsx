'use client'

import { Star, ThumbsUp, ThumbsDown } from 'lucide-react'

interface ProductReviewsProps {
  productId: string
}

// Mock review data
const mockReviews = [
  {
    id: '1',
    customerName: 'Name of customer',
    rating: 5,
    date: '14/11/2024',
    review: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    helpful: 145,
    notHelpful: 24,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
  },
  {
    id: '2',
    customerName: 'Name of customer',
    rating: 4,
    date: '13/11/2024',
    review: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    helpful: 89,
    notHelpful: 12,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
  }
]

// Mock rating distribution
const ratingDistribution = [
  { stars: 5, count: 156, percentage: 70 },
  { stars: 4, count: 45, percentage: 20 },
  { stars: 3, count: 12, percentage: 5 },
  { stars: 2, count: 8, percentage: 3 },
  { stars: 1, count: 4, percentage: 2 }
]

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const totalReviews = ratingDistribution.reduce((sum, r) => sum + r.count, 0)
  const averageRating = 4.5

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
              star <= rating ? 'fill-[#9872DD] text-[#9872DD]' : 'fill-gray-700 text-gray-700'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-8">
      <h2 className="text-base font-medium mb-6">Product ratings and reviews</h2>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-800">
        {/* Overall Rating */}
        <div>
          <h3 className="text-sm text-gray-400 mb-4">Product rating</h3>
          <div className="flex items-center gap-8">
            {/* Main Rating */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                {renderStars(5, 'lg')}
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-400">{totalReviews} reviews</p>
            </div>

            {/* Rating Bars */}
            <div className="flex-1 space-y-2">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    {renderStars(item.stars, 'sm')}
                  </div>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#9872DD] rounded-full transition-all"
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

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-semibold mb-6">Product reviews</h3>
        <div className="space-y-6">
          {mockReviews.map((review) => (
            <div key={review.id} className="pb-6 border-b border-gray-800 last:border-0">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={review.avatar} 
                    alt={review.customerName}
                    className="w-10 h-10 rounded-full bg-gray-800"
                  />
                  <div>
                    <p className="font-medium">{review.customerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, 'sm')}
                      <span className="text-xs text-gray-500">• {review.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {review.review}
              </p>

              {/* Helpful Buttons */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-[#9872DD] transition-colors">
                  <ThumbsUp className="w-4 h-4 " />
                  <span>{review.helpful}</span>
                </button>
                <button className="flex items-center cursor-pointer gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors">
                  <ThumbsDown className="w-4 h-4" />
                  <span>{review.notHelpful}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}