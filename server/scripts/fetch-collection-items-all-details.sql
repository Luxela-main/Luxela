-- ============================================
-- Fetch ALL Collection Products with Complete Details
-- ============================================
-- This script retrieves all collection items with their complete information
-- from the database, including product details, listings, reviews, and seller info.

SELECT 
  -- Collection Info
  c.id AS collection_id,
  c.name AS collection_name,
  c.slug AS collection_slug,
  c.description AS collection_description,
  
  -- Product Info
  p.id AS product_id,
  p.title AS product_title,
  
  -- Listing Info (Complete Details)
  l.id AS listing_id,
  l.title AS listing_title,
  l.description AS listing_description,
  l.category AS product_category,
  l.image AS primary_image,
  l.images_json AS additional_images,
  l.price_cents AS price_cents,
  l.currency AS currency,
  l.quantity_available AS stock_available,
  l.material_composition AS material,
  l.colors_available AS available_colors,
  l.sizes_json AS available_sizes,
  l.shipping_option AS shipping_option,
  l.eta_domestic AS domestic_shipping_eta,
  l.eta_international AS international_shipping_eta,
  l.refund_policy AS refund_policy,
  l.sku AS sku,
  l.barcode AS barcode,
  l.video_url AS product_video,
  l.care_instructions AS care_instructions,
  l.meta_description AS seo_meta_description,
  l.status AS listing_status,
  l.created_at AS listing_created_at,
  l.updated_at AS listing_updated_at,
  
  -- Seller Info
  s.id AS seller_id,
  u.name AS seller_name,
  u.email AS seller_email,
  
  -- Review Summary
  COUNT(r.id) AS total_reviews,
  ROUND(AVG(r.rating)::numeric, 2) AS average_rating,
  STRING_AGG(
    json_build_object(
      'review_id', r.id,
      'rating', r.rating,
      'comment', r.comment,
      'created_at', r.created_at,
      'reviewer_name', ru.name,
      'reviewer_email', ru.email
    )::text, ',')
    FILTER (WHERE r.id IS NOT NULL) AS reviews_json

FROM collections c
INNER JOIN collection_items ci ON c.id = ci.collection_id
INNER JOIN listings l ON ci.listing_id = l.id
INNER JOIN products p ON l.product_id = p.id
INNER JOIN sellers s ON l.seller_id = s.id
INNER JOIN users u ON s.user_id = u.id
LEFT JOIN reviews r ON l.id = r.listing_id
LEFT JOIN buyers b ON r.buyer_id = b.id
LEFT JOIN users ru ON b.user_id = ru.id

GROUP BY 
  c.id, c.name, c.slug, c.description,
  p.id, p.title,
  l.id, l.title, l.description, l.category, l.image, l.images_json,
  l.price_cents, l.currency, l.quantity_available, l.material_composition,
  l.colors_available, l.sizes_json, l.shipping_option, l.eta_domestic,
  l.eta_international, l.refund_policy, l.sku, l.barcode, l.video_url,
  l.care_instructions, l.meta_description, l.status, l.created_at, l.updated_at,
  s.id, u.name, u.email

ORDER BY c.name, l.title;

-- ============================================
-- Alternative Query: Get specific collection details
-- ============================================
-- Uncomment and modify collection_name to get details for a specific collection:
/*
WHERE c.name = 'Your Collection Name'
*/

-- ============================================
-- Query: Count total items per collection
-- ============================================
SELECT 
  c.id,
  c.name,
  c.description,
  COUNT(ci.id) AS total_items,
  COUNT(DISTINCT l.seller_id) AS unique_sellers,
  MIN(l.price_cents) AS min_price_cents,
  MAX(l.price_cents) AS max_price_cents,
  ROUND(AVG(COALESCE(avg_rating.avg, 0))::numeric, 2) AS average_collection_rating

FROM collections c
LEFT JOIN collection_items ci ON c.id = ci.collection_id
LEFT JOIN listings l ON ci.listing_id = l.id
LEFT JOIN (
  SELECT listing_id, AVG(rating) as avg
  FROM reviews
  GROUP BY listing_id
) avg_rating ON l.id = avg_rating.listing_id

GROUP BY c.id, c.name, c.description
ORDER BY total_items DESC;

-- ============================================
-- Query: Export all collection items to JSON
-- ============================================
SELECT json_build_object(
  'collections', json_agg(
    json_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'description', c.description,
      'items', (
        SELECT json_agg(
          json_build_object(
            'listing_id', l.id,
            'title', l.title,
            'price_cents', l.price_cents,
            'currency', l.currency,
            'image', l.image,
            'stock', l.quantity_available,
            'seller_name', u.name,
            'reviews_count', COUNT(r.id),
            'average_rating', ROUND(AVG(r.rating)::numeric, 2)
          )
        )
        FROM collection_items ci
        INNER JOIN listings l ON ci.listing_id = l.id
        INNER JOIN sellers s ON l.seller_id = s.id
        INNER JOIN users u ON s.user_id = u.id
        LEFT JOIN reviews r ON l.id = r.listing_id
        WHERE ci.collection_id = c.id
        GROUP BY ci.collection_id
      )
    )
  )
) AS all_collections
FROM collections c;