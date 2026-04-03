-- ============================================
-- GROCERY PRICE SCANNER - SUPABASE SETUP SQL
-- Run this entire script in your Supabase SQL Editor
-- ============================================

-- 1. Create the items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  buy_price NUMERIC(10,2) NOT NULL,
  sell_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 3. Create anonymous read/write policies (for testing - replace with auth later)
CREATE POLICY "Allow anonymous read access"
  ON items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert"
  ON items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update"
  ON items
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous delete"
  ON items
  FOR DELETE
  TO anon
  USING (true);

-- 4. Create an index on barcode for fast lookups
CREATE INDEX idx_items_barcode ON items (barcode);

-- 5. Create an index on name for ILIKE searches
CREATE INDEX idx_items_name ON items USING gin (name gin_trgm_ops);
-- ^ Requires pg_trgm extension (run: CREATE EXTENSION IF NOT EXISTS pg_trgm;)
-- If pg_trgm is not available, use this simpler index instead:
-- CREATE INDEX idx_items_name ON items (name);

-- ============================================
-- DONE. Your table is ready for use.
-- ============================================
