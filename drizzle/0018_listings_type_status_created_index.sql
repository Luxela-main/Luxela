-- Migration: Add optimized composite index for getApprovedCollections query
-- Issue: Query timeout when fetching approved collections
-- Query pattern: WHERE type = 'collection' AND status = 'approved' ORDER BY created_at DESC LIMIT 100
-- 
-- The existing idx_listings_status_type_created index has (status, type, created_at) column order
-- which is suboptimal when filtering by type first. This new index with (type, status, created_at)
-- order allows PostgreSQL to efficiently filter by type then status and use the index for sorting.

CREATE INDEX IF NOT EXISTS "idx_listings_type_status_created" 
ON "listings" ("type", "status", "created_at" DESC);

-- Also add a partial index for just approved collections since that's the common query pattern
-- This significantly speeds up queries that only look for approved listings
CREATE INDEX IF NOT EXISTS "idx_listings_approved_collections" 
ON "listings" ("type", "created_at" DESC) 
WHERE "status" = 'approved';