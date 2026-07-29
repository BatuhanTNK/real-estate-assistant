"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateShort, getPropertyTypeLabel } from "@/lib/utils/format";
import { DeleteListingButton } from "@/components/listing-results/delete-listing-button";
import { FavoriteButton } from "@/components/listing-results/favorite-button";

export type ListingSummary = {
  id: string;
  property_type: string;
  output_kisa: string | null;
  created_at: string;
  is_favorite?: boolean;
};

const PROPERTY_TYPES = [
  { value: "all", label: "Tüm tipler" },
  { value: "daire", label: "Daire" },
  { value: "villa", label: "Villa" },
  { value: "arsa", label: "Arsa" },
  { value: "isyeri", label: "İşyeri" },
  { value: "diger", label: "Diğer" },
];

const PAGE_SIZE = 20;

export function ListingsHistory({
  initialListings,
  totalCount,
}: {
  initialListings: ListingSummary[];
  totalCount: number;
}) {
  const [listings, setListings] = useState<ListingSummary[]>(initialListings);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialListings.length < totalCount);
  const [allLoaded, setAllLoaded] = useState(initialListings.length >= totalCount);

  const onLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const supabase = createClient();
      let { data, error } = await supabase
        .from("listings")
        .select("id, property_type, output_kisa, created_at, is_favorite")
        .order("created_at", { ascending: false })
        .range(listings.length, listings.length + PAGE_SIZE - 1);

      if (error) {
        const { data: fallback } = await supabase
          .from("listings")
          .select("id, property_type, output_kisa, created_at")
          .order("created_at", { ascending: false })
          .range(listings.length, listings.length + PAGE_SIZE - 1);
        data = (fallback || []).map((item: ListingSummary) => ({ ...item, is_favorite: false }));
      }

      const next = data ?? [];
      const newCount = listings.length + next.length;
      const fullCount = Math.max(totalCount, newCount);
      setListings((prev) => [...prev, ...next]);
      setHasMore(newCount < fullCount && next.length === PAGE_SIZE);
      setAllLoaded(newCount >= fullCount);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [listings.length, totalCount]);

  // İstemci tarafı filtreleme: yüklü kayıtlar içinde arama/tip/favori.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((l) => {
      if (typeFilter !== "all" && l.property_type !== typeFilter) return false;
      if (showFavoritesOnly && !l.is_favorite) return false;
      if (!q) return true;
      return (l.output_kisa ?? "").toLowerCase().includes(q);
    });
  }, [listings, search, typeFilter, showFavoritesOnly]);

  const showingCount = filtered.length;
  const loadedCount = listings.length;
  const favoriteCount = listings.filter((l) => l.is_favorite).length;

  return (
    <div>
      {/* Filtre çubuğu */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İlan metninde ara..."
          aria-label="İlan metninde ara"
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 sm:max-w-xs"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Mülk tipi filtre"
          className="h-8 rounded-lg border border-white/10 bg-white/5 text-white px-2.5 text-sm outline-none focus:border-indigo-500 cursor-pointer"
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value} className="bg-slate-900 text-white">
              {t.label}
            </option>
          ))}
        </select>
        {/* Favori filtresi */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-1.5 text-sm transition-all h-8 ${
            showFavoritesOnly
              ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/15"
              : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill={showFavoritesOnly ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          Favoriler{favoriteCount > 0 && ` (${favoriteCount})`}
        </Button>
      </div>

      {(search || typeFilter !== "all" || showFavoritesOnly) && (
        <p className="text-sm text-slate-400 mb-4">
          {showingCount} sonuç gösteriliyor
          {!allLoaded && typeFilter !== "all" && (
            <span className="text-slate-500">
              {" "}— sadece yüklenen {loadedCount} ilan içinde filtreleniyor
            </span>
          )}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {showFavoritesOnly
              ? "Henüz favori ilan eklemediniz"
              : (search || typeFilter !== "all")
              ? "Filtrelerle eşleşen ilan bulunamadı"
              : "Henüz ilan oluşturmadınız"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-indigo-400 text-sm font-medium">
                      {getPropertyTypeLabel(listing.property_type).charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-white/10 text-slate-400">
                        {getPropertyTypeLabel(listing.property_type)}
                      </Badge>
                      <span className="text-slate-500 text-xs" suppressHydrationWarning>
                        {formatDateShort(listing.created_at)}
                      </span>
                      {listing.is_favorite && (
                        <svg
                          className="w-3.5 h-3.5 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mt-1 truncate">
                      {listing.output_kisa || "İlan metni"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <FavoriteButton
                    listingId={listing.id}
                    initialFavorite={listing.is_favorite ?? false}
                    variant="icon"
                  />
                  <Link href={`/dashboard/listing/${listing.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Görüntüle →
                    </Button>
                  </Link>
                  <DeleteListingButton listingId={listing.id} variant="icon" />
                </div>
              </div>
            ))}
          </div>

          {hasMore && !search && typeFilter === "all" && !showFavoritesOnly && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
              >
                {loadingMore ? "Yükleniyor..." : `Daha fazla yükle (${loadedCount}/${totalCount})`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
