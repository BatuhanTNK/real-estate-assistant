export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingsHistory } from "@/components/listing-results/listings-history";

const FREE_PLAN_LIMIT = 5;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Profil bilgisi
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Geçmiş ilanlar (is_favorite kolonu henüz DB'de yoksa fallback)
  let listings: Array<{
    id: string;
    property_type: string;
    output_kisa: string | null;
    created_at: string;
    is_favorite?: boolean;
  }> | null = null;

  const { data: listingsWithFav, error: listingsError } = await supabase
    .from("listings")
    .select("id, property_type, output_kisa, created_at, is_favorite")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (listingsError) {
    const { data: fallbackListings } = await supabase
      .from("listings")
      .select("id, property_type, output_kisa, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    listings = (fallbackListings || []).map((item) => ({ ...item, is_favorite: false }));
  } else {
    listings = listingsWithFav;
  }

  // Toplam ilan sayısı (sayfalama için)
  const { count: totalCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const total = totalCount ?? 0;

  const monthlyCount = profile?.monthly_listing_count || 0;
  const planLabel = profile?.plan === "free" ? "Ücretsiz" : profile?.plan === "individual" ? "Bireysel" : "Ofis";
  const isFreePlan = profile?.plan === "free";
  const usagePercent = isFreePlan ? (monthlyCount / FREE_PLAN_LIMIT) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Hoş geldiniz{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-slate-400 mt-1">İlan metinlerinizi yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/instagram">
            <Button variant="outline" className="border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/10">
              <span className="mr-1.5">📸</span>
              Instagram Kartı
            </Button>
          </Link>
          <Link href="/dashboard/new">
            <Button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni İlan Oluştur
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Monthly Usage */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Bu Ay Kullanım</p>
              <Badge variant="outline" className="text-xs border-white/10 text-slate-400">
                {planLabel}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{monthlyCount}</span>
              {isFreePlan && (
                <span className="text-slate-400 text-sm">/ {FREE_PLAN_LIMIT}</span>
              )}
              {!isFreePlan && (
                <span className="text-slate-400 text-sm">ilan</span>
              )}
            </div>
            {isFreePlan && (
              <div className="mt-3">
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePercent >= 100
                        ? "bg-red-500"
                        : usagePercent >= 80
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                {usagePercent >= 100 && (
                  <p className="text-red-400 text-xs mt-2">
                    Limitinize ulaştınız.{" "}
                    <Link href="/pricing" className="underline hover:text-red-300">
                      Planınızı yükseltin
                    </Link>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Listings */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm mb-2">Toplam İlan</p>
            <span className="text-3xl font-bold text-white">{total}</span>
          </CardContent>
        </Card>

        {/* Plan */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm mb-2">Planınız</p>
            <span className="text-3xl font-bold text-white">{planLabel}</span>
            {isFreePlan && (
              <div className="mt-2">
                <Link href="/pricing">
                  <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-0">
                    Yükselt →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promo Banner for Instagram Feature */}
      <Card className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/60 border-indigo-500/20 backdrop-blur-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 text-[10px]">
                YENİ ÖZELLİK
              </Badge>
              <span className="text-white font-semibold">Instagram İlan Kartı Oluşturucu</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Fotoğrafınızı yükleyin, yapay zeka ile profesyonel emlakçı portresi üretelim! Mülk fotoğraflarınızla birleştirip indirilebilir Instagram Carousel slaytları hazırlayın.
            </p>
          </div>
          <Link href="/dashboard/instagram" className="shrink-0">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
              📸 Kart Oluştur →
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Listings History */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">Geçmiş İlanlar</CardTitle>
        </CardHeader>
        <CardContent>
          {!listings || listings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-slate-400 mb-4">Henüz ilan oluşturmadınız</p>
              <Link href="/dashboard/new">
                <Button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white">
                  İlk İlanınızı Oluşturun
                </Button>
              </Link>
            </div>
          ) : (
            <ListingsHistory initialListings={listings} totalCount={total} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
