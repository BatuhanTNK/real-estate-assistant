-- =============================================
-- Listings: is_favorite kolonu ve UPDATE RLS politikası
-- =============================================

-- Favori kolonu ekleme
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false NOT NULL;

-- UPDATE politikası (kullanıcı kendi ilanlarını güncelleyebilir)
CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Favori filtresi için index
CREATE INDEX IF NOT EXISTS idx_listings_is_favorite ON listings(user_id, is_favorite) WHERE is_favorite = true;
