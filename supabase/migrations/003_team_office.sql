-- =============================================
-- 003 — Ekip/Ofis planı: ofis üyeliği, davet, logo, storage bucket
-- =============================================
-- Bu migration tablo yapısını şöyle genişletir:
--   profiles.office_id   -> üyenin ait olduğu ofisin sahibi id'si
--   profiles.office_role -> 'owner' | 'member' | NULL
--   profiles.logo_url    -> ofis logosunun public storage URL'i
-- Yeni tablo: team_invites (e-posta ile davet, idempotent)
-- Yeni bucket: office-logos (public read, owner write)
-- Yeni RPC: accept_team_invite
--
-- Kota: kullanıcı kararı gereği PAYLAŞIMSIZ — her üye kendi
-- profiles.monthly_listing_count sayacını kullanır. Bu migration
-- kota mantığına dokunmaz.

-- =============================================
-- 1) profiles kolonları
-- =============================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS office_role TEXT, -- 'owner' | 'member' | NULL
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Ofis sahibi: office_id = kendi id, office_role = 'owner'.
-- Bu, plan='team' olan kullanıcı için DB veya RPC ile ayarlanır
-- (bkz. accept_team_invite / manuel plan değişimi).
-- Kolon ekleyince mevcut kayıtlar NULL kalır — zararsız.

-- =============================================
-- 2) team_invites tablosu
-- =============================================
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_office ON team_invites(office_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Ofis sahibi kendi ofisinin tüm davetlerini görür/yönetir.
CREATE POLICY "Office owner manages invites"
  ON team_invites FOR ALL
  USING (
    office_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.office_role = 'owner'
    )
  )
  WITH CHECK (
    office_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.office_role = 'owner'
    )
  );

-- Davet edilen kişi kendi e-postasına pending davetleri görebilir
-- (kabul akışı için). INSERT/DELETE sahibin through policy'si altında.
CREATE POLICY "Invitee views own pending invite"
  ON team_invites FOR SELECT
  USING (
    status = 'pending'
    AND invited_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- =============================================
-- 3) Listings RLS — ekip üyeleri ofisin ilanlarını görebilir
--    (INSERT/DELETE bireysel kalır; kullanıcı kararı #1)
-- =============================================
CREATE POLICY "Team members view office listings"
  ON listings FOR SELECT
  USING (
    -- Kendi ilanı
    auth.uid() = user_id
    -- VEYA aynı ofise üye: çağıranın office_id'si, ilanı oluşturan ofis
    -- sahibinin id'sine eşitse (ofis sahibi office_id = kendi id).
    OR (
      EXISTS (
        SELECT 1 FROM profiles caller
        WHERE caller.id = auth.uid()
          AND caller.office_id IS NOT NULL
          AND caller.office_id = listings.user_id
      )
      AND EXISTS (
        SELECT 1 FROM profiles owner
        WHERE owner.id = listings.user_id
          AND owner.office_role = 'owner'
      )
    )
  );
-- Not: "Users can view own listings" politikası zaten auth.uid()=user_id
--'i kapsar; bu ek politika ofis payını ifade eder.

-- =============================================
-- 4) Storage bucket: office-logos (public read)
--    storage extension gerekir — Supabase Studio veya
--    `create storage.buckets` ile. extension yoksa bu blok atlanır
--    ve bucket Studio'dan elle oluşturulur (README'ye not).
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('office-logos', 'office-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket RLS: herkes read; kullanıcı kendi klasörüne write/delete.
CREATE POLICY "Public read office logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'office-logos');

CREATE POLICY "Owner upload office logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'office-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner update office logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'office-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner delete office logo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'office-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================
-- 5) accept_team_invite RPC
--    Üye daveti kabul edince:
--      - invite status = 'accepted'
--      - üye profiles.office_id = invite.office_id, office_role = 'member'
--    Kontrol: invite pending + invited_email = çağıranın e-postası.
-- =============================================
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite team_invites%ROWTYPE;
  v_user_email TEXT;
  v_member_count INTEGER;
BEGIN
  -- Çağıranın e-postası
  SELECT email INTO v_user_email
    FROM auth.users WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Daveti çek ve kilitle
  SELECT * INTO v_invite
    FROM team_invites
    WHERE id = p_invite_id
    FOR UPDATE;

  -- Davet yok, pending değil veya e-posta uyuşmuyorsa reddet
  IF v_invite.id IS NULL
     OR v_invite.status <> 'pending'
     OR v_invite.invited_email <> v_user_email THEN
    RETURN false;
  END IF;

  -- 5 üye sınırı (owner hariç mevcut üyeler + bu davet)
  SELECT COUNT(*) INTO v_member_count
    FROM profiles
    WHERE office_id = v_invite.office_id
      AND office_role = 'member';

  IF v_member_count >= 5 THEN
    RAISE EXCEPTION 'Ofis üye sınırı (5) dolu';
  END IF;

  -- Kabul et
  UPDATE team_invites
    SET status = 'accepted'
    WHERE id = p_invite_id;

  UPDATE profiles
    SET office_id = v_invite.office_id,
        office_role = 'member'
    WHERE id = auth.uid();

  RETURN true;
END;
$$;

-- =============================================
-- 6) Ofis sahibini ayarlayan yardımcı RPC
--    (plan='team' olunca çağrılabilir; manuel plan değişimi)
-- =============================================
CREATE OR REPLACE FUNCTION public.set_office_owner(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
    SET office_id = p_user_id,
        office_role = 'owner'
    WHERE id = p_user_id;
END;
$$;
