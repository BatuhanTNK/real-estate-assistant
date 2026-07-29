import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getPropertyTypeLabel } from "@/lib/utils/format";
import { ResultCardsServer } from "./result-cards-server";
import { DeleteListingButton } from "@/components/listing-results/delete-listing-button";
import { FavoriteButton } from "@/components/listing-results/favorite-button";

export const dynamic = "force-dynamic";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

interface ListingData {
  id: string;
  user_id: string;
  property_type: string;
  input_data: Record<string, unknown>;
  output_resmi: string | null;
  output_samimi: string | null;
  output_kisa: string | null;
  is_favorite: boolean;
  created_at: string;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) notFound();

  const listing = data as ListingData;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">İlan Detayı</h1>
              <Badge variant="outline" className="text-xs border-white/10 text-slate-400">
                {getPropertyTypeLabel(listing.property_type)}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mt-1" suppressHydrationWarning>
              {formatDate(listing.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            listingId={listing.id}
            initialFavorite={listing.is_favorite ?? false}
            variant="full"
          />
          <DeleteListingButton listingId={listing.id} variant="full" redirectAfterDelete />
        </div>
      </div>

      <ResultCardsServer
        result={{
          resmi: listing.output_resmi || "",
          samimi: listing.output_samimi || "",
          kisa: listing.output_kisa || "",
        }}
      />
    </div>
  );
}
