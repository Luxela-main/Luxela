-- Add index on listings.seller_id for faster product count aggregations
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);