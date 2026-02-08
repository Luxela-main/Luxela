-- Fix missing listing reviews
-- This SQL script creates missing listingReviews records for all listings
-- with status = 'pending_review' that don't have corresponding review entries.

-- Insert missing review records
INSERT INTO listing_reviews (listing_id, seller_id, status, created_at, updated_at)
SELECT 
  l.id,
  l.seller_id,
  'pending'::listing_review_status,
  NOW(),
  NOW()
FROM listings l
WHERE l.status = 'pending_review'
  AND l.id NOT IN (
    SELECT DISTINCT listing_id FROM listing_reviews
  );

-- Verify the fix
SELECT 
  'Before Fix Stats:' as info,
  COUNT(DISTINCT l.id) as pending_listings_without_reviews
FROM listings l
LEFT JOIN listing_reviews lr ON l.id = lr.listing_id
WHERE l.status = 'pending_review'
  AND lr.id IS NULL;

-- Final check - should return 0 rows
SELECT 
  'After Fix Check:' as info,
  COUNT(*) as missing_reviews
FROM listings l
LEFT JOIN listing_reviews lr ON l.id = lr.listing_id
WHERE l.status = 'pending_review'
  AND lr.id IS NULL;