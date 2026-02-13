-- =====================================================
-- COMPREHENSIVE COLLECTION ITEMS DETAILS QUERY
-- =====================================================
-- This SQL query fetches ALL details of collection items
-- including products, listings, reviews, seller info, etc.
--
-- Usage:
-- 1. In PostgreSQL client, run this entire query
-- 2. Or adapt WHERE clause to filter specific collections
-- =====================================================

SELECT
  -- Collection Info
  c.id AS collection_id,
  c.name AS collection_name,
  c.slug AS collection_slug,
  c.description AS collection_description,
  c.created_at AS collection_created_at,
  c.updated_at AS collection_updated_at,
  
  -- Brand Info
  b.id AS brand_id,
  b.name AS brand_name,
  b.slug AS brand_slug,
  b.description AS brand_description,
  
  -- Collection Item
  ci.id AS collection_item_id,
  ci.position AS collection_item_position,
  
  -- Product Info
  p.id AS product_id,
  p.name AS product_name,
  p.slug AS product_slug,
  p.description AS product_description,
  p.category AS product_category,
  p.sku AS product_sku,
  p.price_cents AS product_price_cents,
  p.currency AS product_currency,
  p.in_stock AS product_in_stock,
  
  -- Listing Details
  l.id AS listing_id,
  l.type AS listing_type,
  l.title AS listing_title,
  l.description AS listing_description,
  l.category AS listing_category,
  l.price_cents AS listing_price_cents,
  l.currency AS listing_currency,
  l.image AS listing_image,
  l.images_json AS listing_images,
  l.quantity_available AS listing_quantity,
  l.material_composition AS listing_material,
  l.colors_available AS listing_colors,
  l.sizes_json AS listing_sizes,
  l.shipping_option AS listing_shipping_option,
  l.eta_domestic AS listing_eta_domestic,
  l.eta_international AS listing_eta_international,
  l.refund_policy AS listing_refund_policy,
  l.sku AS listing_sku,
  l.barcode AS listing_barcode,
  l.video_url AS listing_video_url,
  l.care_instructions AS listing_care_instructions,
  l.meta_description AS listing_meta_description,
  l.local_pricing AS listing_local_pricing,
  l.status AS listing_status,
  l.created_at AS listing_created_at,
  l.updated_at AS listing_updated_at,
  
  -- Seller Info
  s.id AS seller_id,
  u.id AS seller_user_id,
  u.name AS seller_name,
  u.display_name AS seller_display_name,
  u.email AS seller_email,
  u.image AS seller_image,
  s.profile_photo AS seller_profile_photo,
  s.payout_methods AS seller_payout_methods,
  
  -- Reviews Count & Rating
  COUNT(DISTINCT r.id) AS review_count,
  ROUND(AVG(CAST(r.rating AS NUMERIC)), 2) AS average_rating,
  
  -- Collection Owner Info (if seller)
  bu.id AS owner_buyer_id,
  bad.full_name AS owner_full_name,
  bad.email AS owner_email,
  bad.phone_number AS owner_phone,
  bad.country AS owner_country,
  bad.state AS owner_state,
  bad.city AS owner_city

FROM collections c
LEFT JOIN brands b ON c.brand_id = b.id
LEFT JOIN collection_items ci ON c.id = ci.collection_id
LEFT JOIN products p ON ci.product_id = p.id
LEFT JOIN listings l ON p.id = l.product_id
LEFT JOIN sellers s ON l.seller_id = s.id
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN review r ON l.id = r.listing_id
LEFT JOIN buyers bu ON u.id = bu.user_id
LEFT JOIN buyer_account_details bad ON bu.id = bad.buyer_id

-- Optional: Filter by collection ID
-- WHERE c.id = 'your-collection-id-here'

-- Optional: Filter by collection name
-- WHERE c.name ILIKE '%collection-name%'

-- Optional: Filter by brand ID
-- WHERE b.id = 'your-brand-id-here'

GROUP BY
  c.id, c.name, c.slug, c.description, c.created_at, c.updated_at,
  b.id, b.name, b.slug, b.description,
  ci.id, ci.position,
  p.id, p.name, p.slug, p.description, p.category, p.sku, p.price_cents, p.currency, p.in_stock,
  l.id, l.type, l.title, l.description, l.category, l.price_cents, l.currency, l.image,
  l.images_json, l.quantity_available, l.material_composition, l.colors_available,
  l.sizes_json, l.shipping_option, l.eta_domestic, l.eta_international,
  l.refund_policy, l.sku, l.barcode, l.video_url, l.care_instructions,
  l.meta_description, l.local_pricing, l.status, l.created_at, l.updated_at,
  s.id, u.id, u.name, u.display_name, u.email, u.image, s.profile_photo, s.payout_methods,
  bu.id, bad.full_name, bad.email, bad.phone_number, bad.country, bad.state, bad.city

ORDER BY
  c.created_at DESC,
  ci.position ASC;


-- =====================================================
-- ALTERNATIVE: Get detailed reviews for each listing
-- =====================================================

SELECT
  l.id AS listing_id,
  l.title AS product_title,
  r.id AS review_id,
  r.rating AS review_rating,
  r.comment AS review_comment,
  r.created_at AS review_date,
  u.name AS reviewer_name,
  u.email AS reviewer_email,
  u.image AS reviewer_image
FROM listings l
LEFT JOIN review r ON l.id = r.listing_id
LEFT JOIN buyers b ON r.buyer_id = b.id
LEFT JOIN users u ON b.user_id = u.id
WHERE l.id IN (
  SELECT l.id
  FROM listings l
  JOIN collection_items ci ON l.product_id = ci.product_id
  JOIN collections c ON ci.collection_id = c.id
  -- Add collection filter here if needed
)
ORDER BY l.id, r.created_at DESC;


-- =====================================================
-- ALTERNATIVE: Get collection summary statistics
-- =====================================================

SELECT
  c.id AS collection_id,
  c.name AS collection_name,
  COUNT(DISTINCT ci.id) AS total_items,
  COUNT(DISTINCT l.id) AS total_listings,
  COUNT(DISTINCT r.id) AS total_reviews,
  ROUND(AVG(CAST(r.rating AS NUMERIC)), 2) AS avg_rating,
  MIN(l.price_cents) AS min_price,
  MAX(l.price_cents) AS max_price,
  COUNT(DISTINCT l.currency) AS currencies_used,
  COUNT(CASE WHEN l.status = 'approved' THEN 1 END) AS approved_listings,
  COUNT(CASE WHEN l.status = 'pending_review' THEN 1 END) AS pending_listings
FROM collections c
LEFT JOIN collection_items ci ON c.id = ci.collection_id
LEFT JOIN products p ON ci.product_id = p.id
LEFT JOIN listings l ON p.id = l.product_id
LEFT JOIN review r ON l.id = r.listing_id
GROUP BY c.id, c.name
ORDER BY c.created_at DESC;