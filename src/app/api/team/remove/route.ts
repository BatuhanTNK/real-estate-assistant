import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const removeSchema = z.object({
  inviteId: z.string().optional(),
  memberId: z.string().optional(),
});

/**
 * DELETE /api/team/remove
 * Daveti iptal eder veya ekip üyesini ofisten çıkarır.
 */
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const validation = removeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Geçersiz id" }, { status: 400 });
    }

    const { inviteId, memberId } = validation.data;
    const serviceClient = await createServiceClient();

    if (inviteId) {
      await serviceClient
        .from("team_invites")
        .delete()
        .eq("id", inviteId)
        .eq("office_id", user.id);
    }

    if (memberId) {
      await serviceClient
        .from("profiles")
        .update({ office_id: null, office_role: null })
        .eq("id", memberId)
        .eq("office_id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Ekip kaydı kaldırıldı.",
    });
  } catch (error) {
    console.error("Team remove error:", error);
    return NextResponse.json(
      { error: "İşlem gerçekleştirilemedi" },
      { status: 500 }
    );
  }
}
