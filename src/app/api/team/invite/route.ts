import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});

/**
 * POST /api/team/invite
 * Ofis planındaki kullanıcıların ekibine üye davet etmesini sağlar (5 üyeye kadar).
 */
export async function POST(request: NextRequest) {
  try {
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Geçersiz e-posta" },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const serviceClient = await createServiceClient();

    // Kullanıcı profilini ve planını kontrol et
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("plan, office_id, office_role")
      .eq("id", user.id)
      .single();

    if (profile?.plan !== "team" && profile?.plan !== "individual") {
      return NextResponse.json(
        { error: "Ekip üyesi davet etmek için Ofis planına geçmelisiniz" },
        { status: 403 }
      );
    }

    // Mevcut davetli / üye sayısını say (max 5)
    const { count: inviteCount } = await serviceClient
      .from("team_invites")
      .select("id", { count: "exact", head: true })
      .eq("office_id", user.id)
      .eq("status", "pending");

    const { count: memberCount } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("office_id", user.id);

    const totalCurrent = (inviteCount || 0) + (memberCount || 0);

    if (totalCurrent >= 5) {
      return NextResponse.json(
        { error: "Ofis planında maksimum 5 ekip üyesi sınırına ulaştınız" },
        { status: 400 }
      );
    }

    // Daveti ekle
    const { data: newInvite, error: inviteError } = await serviceClient
      .from("team_invites")
      .insert({
        office_id: user.id,
        invited_email: email,
        status: "pending",
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Team invite insert error:", inviteError);
      return NextResponse.json(
        { error: "Davet gönderilemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invite: newInvite,
      message: `${email} adresine ekip daveti gönderildi.`,
    });
  } catch (error) {
    console.error("Team invite route error:", error);
    return NextResponse.json(
      { error: "Bir şeyler ters gitti" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/team/invite
 * Mevcut ekip üyelerini ve bekleyen davetleri listeler.
 */
export async function GET() {
  try {
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

    const serviceClient = await createServiceClient();

    // Bekleyen davetler
    const { data: invites } = await serviceClient
      .from("team_invites")
      .select("id, invited_email, status, created_at")
      .eq("office_id", user.id);

    // Mevcut üyeler
    const { data: members } = await serviceClient
      .from("profiles")
      .select("id, full_name, phone_number, office_role")
      .eq("office_id", user.id);

    return NextResponse.json({
      success: true,
      invites: invites || [],
      members: members || [],
    });
  } catch (error) {
    console.error("Team list error:", error);
    return NextResponse.json(
      { error: "Ekip listesi alınamadı" },
      { status: 500 }
    );
  }
}
