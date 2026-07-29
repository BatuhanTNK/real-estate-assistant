-- =============================================
-- 002 — Rate limiting + atomik sayaç + aylık reset cron
-- =============================================

-- =============================================
-- 1) Rate limiting tablosu (kalıcı, process bağımsız)
--    generate-listing her çağrıda bir satır ekler;
--    son 1 dakikadaki satır sayısını sayarak limit uygulanır.
-- =============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL DEFAULT 'generate-listing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Eski kayıtları hızla silmek için indeks
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at
  ON rate_limits(created_at DESC);

-- Kullanıcı + endpoint bazında sayım için indeks
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint_created
  ON rate_limits(user_id, endpoint, created_at DESC);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Sadece ilgili kullanıcı kendi kayıtlarını görebilir (RLS);
-- sunucu tarafı service role ile yazılır/sayılır (RLS bypass).
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);


-- =============================================
-- 2) Atomik aylık sayaç RPC
--    Race condition'ı önler: tek bir çağrıda hem ay
--    kontrolü/sıfırlama hem limit kontrolü hem artırma.
--
--    Dönen değer: { allowed: bool, current_count: int, limit: int }
--    allowed = false ise limit aşıldı (ücretsiz plan). Ücretli
--    planlar için allowed her zaman true, sayaç yine de artar.
-- =============================================
CREATE OR REPLACE FUNCTION public.consume_listing_quota(
  p_user_id UUID,
  p_free_limit INTEGER DEFAULT 5
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, plan TEXT, limit_reached BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan plan_type;
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_month_start TIMESTAMPTZ := DATE_TRUNC('month', NOW());
BEGIN
  -- Kilitle (row-level lock) — eş zamanlı istekler seriye dizilir
  SELECT plan, monthly_listing_count, monthly_count_reset_at
    INTO v_plan, v_count, v_reset_at
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

  IF v_plan IS NULL THEN
    -- Profil yoksa: izin verme
    RETURN QUERY SELECT false, 0, NULL, true;
    RETURN;
  END IF;

  -- Yeni ay kontrolü: ay başından önce sıfırlanmışsa sıfırla
  IF v_reset_at < v_month_start THEN
    v_count := 0;
  END IF;

  -- Limit kontrolü (sadece free planı sınırlar)
  IF v_plan = 'free' AND v_count >= p_free_limit THEN
    -- Sayacı sıfırlama gerekiyorsa uygula (tutarlılık için)
    IF v_reset_at < v_month_start THEN
      UPDATE profiles
        SET monthly_listing_count = 0,
            monthly_count_reset_at = v_month_start
        WHERE id = p_user_id;
    END IF;
    RETURN QUERY SELECT false, v_count, v_plan, true;
    RETURN;
  END IF;

  -- Sayacı artır (ve gerekirse ayı sıfırla)
  UPDATE profiles
    SET monthly_listing_count = v_count + 1,
        monthly_count_reset_at = CASE
          WHEN v_reset_at < v_month_start THEN v_month_start
          ELSE monthly_count_reset_at
        END
    WHERE id = p_user_id;

  RETURN QUERY SELECT true, (v_count + 1), v_plan, false;
END;
$$;

-- Atomik rate-limit sayacı: son window içindeki istek sayısı
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT DEFAULT 'generate-listing',
  p_max_requests INTEGER DEFAULT 3,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Önce eski kayıtları temizle (tabloyu büyütmekten korur)
  DELETE FROM rate_limits
    WHERE user_id = p_user_id
      AND created_at < NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Son window'daki kayıt sayısını say
  SELECT COUNT(*) INTO v_count
    FROM rate_limits
    WHERE user_id = p_user_id
      AND endpoint = p_endpoint
      AND created_at >= NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- Bu istek için yeni kayıt ekle
  INSERT INTO rate_limits (user_id, endpoint)
    VALUES (p_user_id, p_endpoint);

  RETURN true;
END;
$$;

-- =============================================
-- 2b) Sayacı geri al (rollback)
--     AI çağrısı veya DB kaydı başarısız olursa, kullanıcının
--     hakkını yememek için sayacı 1 azaltır.
--     0'ın altına düşmez.
-- =============================================
CREATE OR REPLACE FUNCTION public.refund_listing_quota(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
    SET monthly_listing_count = GREATEST(monthly_listing_count - 1, 0)
    WHERE id = p_user_id;
END;
$$;

-- =============================================
-- 3) Aylık sayaç sıfırlama (tüm kullanıcılar) — cron için
--    pg_cron yoksa Supabase Dashboard -> Database -> Cron'da
--    "Her ayın 1'i 03:00" schedule ile tetiklenebilir.
--    Önceki reset_monthly_counts() zaten tanımlı idi; güvenli versiyon.
-- =============================================
CREATE OR REPLACE FUNCTION public.reset_monthly_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
    SET monthly_listing_count = 0,
        monthly_count_reset_at = DATE_TRUNC('month', NOW())
    WHERE monthly_count_reset_at < DATE_TRUNC('month', NOW());
END;
$$;

-- =============================================
-- 4) Eski rate_limit kayıtlarını periyodik temizleme (cron önerisi)
--    Schedule: her saat başı
--    DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';
--    (pg_cron kurulu ise aşağıdaki etkindir; kurulu değilse manuel ekleyin)
-- =============================================
-- pg_cron kurulu değilse bu satır hata verir; güvenlik için commented bırakıldı.
-- Supabase Dashboard -> Database -> Extensions'dan pg_cron'u aktif edip,
-- aşağıdaki satırı açabilirsiniz:
--
-- SELECT cron.schedule(
--   '0 3 * * mon',  -- Her Pazartesi 03:00 (örnek)
--   $$DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '2 hours'$$
-- );
--
-- Aylık sayaç sıfırlama için:
-- SELECT cron.schedule(
--   '0 3 1 * *',  -- Her ayın 1'i 03:00
--   $$SELECT public.reset_monthly_counts()$$
-- );
