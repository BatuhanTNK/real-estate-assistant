-- =============================================
-- İlan Metni Asistanı — Veritabanı Şeması
-- =============================================

-- Enum types
CREATE TYPE plan_type AS ENUM ('free', 'individual', 'team');
CREATE TYPE property_type AS ENUM ('daire', 'villa', 'arsa', 'isyeri', 'diger');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due');

-- =============================================
-- Profiles tablosu
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  office_name TEXT,
  phone_number TEXT,
  plan plan_type DEFAULT 'free' NOT NULL,
  monthly_listing_count INTEGER DEFAULT 0 NOT NULL,
  monthly_count_reset_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- Listings tablosu
-- =============================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_type property_type NOT NULL,
  input_data JSONB NOT NULL,
  output_resmi TEXT,
  output_samimi TEXT,
  output_kisa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own listings"
  ON listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

-- =============================================
-- Subscriptions tablosu
-- =============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan plan_type NOT NULL,
  status subscription_status DEFAULT 'active' NOT NULL,
  current_period_end TIMESTAMPTZ,
  iyzico_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- =============================================
-- Yeni kullanıcı kaydında otomatik profil oluşturan trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Aylık sayaç sıfırlama fonksiyonu
-- (Supabase Edge Function veya cron ile çağrılabilir)
-- =============================================
CREATE OR REPLACE FUNCTION public.reset_monthly_counts()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET monthly_listing_count = 0,
      monthly_count_reset_at = NOW()
  WHERE monthly_count_reset_at < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
