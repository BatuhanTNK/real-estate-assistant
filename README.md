# İlan Asistanı

Yapay zekâ (Google Gemini) destekli emlak ilan metni oluşturma uygulaması. Next.js 16 (App Router) + Supabase (Auth + Postgres) + Tailwind.

## Gereksinimler

- Node.js 22+ (Node.js 24 LTS ile doğrulandı)
- Bir Supabase projesi
- Google Gemini API anahtarı

## Kurulum

```bash
npm install
cp .env.local.example .env.local   # anahtarları doldurun
npm run dev                         # http://localhost:3000
```

### Ortam değişkenleri (`.env.local`)

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (yalnızca sunucu) |
| `GEMINI_API_KEY` | Google Gemini API anahtarı |
| `IYZICO_API_KEY` | Opsiyonel — ödeme entegrasyonu |
| `IYZICO_SECRET_KEY` | Opsiyonel — ödeme entegrasyonu |

### Supabase şeması

`supabase/migrations/` klasöründeki migration dosyalarını Supabase Studio → SQL Editor üzerinden çalıştırın:
- `001_*` — temel tablolar (profiles, listings)
- `002_rate_limit_atomic_quota.sql` — rate limit + atomic quota RPC'leri (cron talimatları yorumlarda)

## Google OAuth (Google ile giriş)

Uygulamadaki "Google ile giriş yap" butonunu çalıştırmak için:

1. **Supabase Dashboard** → projeniz → **Authentication** → **Providers** → **Google** seçin ve etkinleştirin.
2. [Google Cloud Console](https://console.cloud.google.com/)'da bir OAuth Client oluşturun:
   - **Authorized JavaScript origins**: `http://localhost:3000` (ve production URL'iniz)
   - **Authorized redirect URIs**: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
     - `<SUPABASE_PROJECT_REF>` — Supabase Dashboard → Settings → API → Project URL'deki alt alan adı.
3. Üretilen **Client ID** ve **Client Secret**'ı Supabase Dashboard'daki Google provider alanlarına yapıştırın ve kaydedin.
4. Uygulamaya dönün — `/auth` sayfasındaki "Google ile giriş yap" butonu artık çalışır. OAuth akışı:
   - Buton → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: /auth/callback } })`
   - Google ile giriş → Supabase callback → uygulamanın `/auth/callback` rotasına `code` ile döner → `exchangeCodeForSession` → `/dashboard`.

> **Not:** Production'da `Authorized redirect URIs` ve `redirectTo` üretim URL'inizi kullanmalıdır.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production sunucusu |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (watch modu) |
| `npm run test:run` | Vitest tek seferlik (CI) |
| `npm run test:e2e` | Playwright E2E, mobil yerleşim ve erişilebilirlik |
| `npm run test:e2e:install` | Playwright Chromium tarayıcısını kur |

## Test

İki katmanlı test altyapısı:

- **Unit (Vitest + React Testing Library)** — `src/**/*.test.{ts,tsx}`:
  - `src/lib/ai/validation.test.ts` — zod şeması, telefon regex, prompt-injection sanitizasyonu (`notes` kontrol karakteri temizliği), `metpirlareNet` geriye dönük uyum.
  - `src/lib/ai/gemini.test.ts` — `fetch` mock'lu; JSON fence-stripping, bozuk/eksik alan tespiti, API key yokluğu.
  - `src/lib/utils/format.test.ts` — para/tarih formatı, mülk tipi etiketleri.
  - `src/app/legal/content.test.ts` — yasal dokümanların yapı bütünlüğü.

  Çalıştırma: `npm run test:run` (tümü yeşil gelmeli).

- **E2E (Playwright)** — `e2e/static-routes.spec.ts`:
  - Yalnızca **ortam-bağımsız/statik rotalar** test edilir: `/`, `/pricing`, `/legal/*`, footer navigasyonu.
  - Auth ve ilan üretimi gerçek Supabase + Gemini gerektirdiği için **kapsamdadır** — bu sayede E2E'ler env/DB olmadan CI'da çalışır.
  - `playwright.config.ts` `webServer` ile prod build başlatır; çakışmayı önlemek için **3100** portunu kullanır.

  İlk çalıştırmadan önce tarayıcıyı kur: `npm run test:e2e:install`, sonra `npm run test:e2e`.

---

Aksi belirtilmedikçe Next.js 16 (Turbopack) kullanır. Bu sürümde bazı dosya/konfigürasyon kuralları değişik olabilir — `AGENTS.md` uyarısına bakın.

## Test ödemeleri

Ücretli plan satın alma henüz canlı kullanıma açık değildir. Test planı etkinleştirme yalnızca `npm run dev` ile başlatılan geliştirme ortamında ve `ENABLE_TEST_CHECKOUT=true` açıkça ayarlandığında kullanılabilir. Üretim derlemesinde simülasyon endpoint’i kapalıdır. Test akışı kart bilgisi toplamaz.
