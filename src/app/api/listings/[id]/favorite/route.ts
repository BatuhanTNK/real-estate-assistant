import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/listings/[id]/favorite
 * İlan favori durumunu toggle eder.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    // Mevcut durumu al
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("id, is_favorite")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 }
      );
    }

    // Toggle
    const newValue = !listing.is_favorite;
    const { error: updateError } = await supabase
      .from("listings")
      .update({ is_favorite: newValue })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Favorite toggle error:", updateError);
      return NextResponse.json(
        { error: "Favori durumu güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      is_favorite: newValue,
    });
  } catch (error) {
    console.error("Favorite API error:", error);
    return NextResponse.json(
      { error: "Bir şeyler ters gitti" },
      { status: 500 }
    );
  }
}
