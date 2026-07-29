"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User as UserIcon,
  Lock,
  Mail,
  CreditCard,
  ArrowLeft,
  Users,
  Building2,
  Trash2,
  UserPlus,
  Image as ImageIcon,
} from "lucide-react";

interface Profile {
  full_name: string | null;
  office_name: string | null;
  logo_url: string | null;
  phone_number: string | null;
  plan: string;
  monthly_listing_count: number;
  monthly_count_reset_at: string;
}

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
}

interface TeamInvite {
  id: string;
  invited_email: string;
  status: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  office_role: string | null;
}

const FREE_PLAN_LIMIT = 5;

const planLabels: Record<string, string> = {
  free: "Ücretsiz",
  individual: "Bireysel",
  team: "Ofis",
};

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Profil formu
  const [fullName, setFullName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Ekip yönetimi
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Şifre formu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadTeamData = useCallback(async () => {
    try {
      const res = await fetch("/api/team/invite");
      const data = await res.json();
      if (res.ok && data.success) {
        setInvites(data.invites || []);
        setMembers(data.members || []);
      }
    } catch {
      // quiet fallback
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const [{ data: profileData }, { data: subData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("subscriptions")
          .select("plan,status,current_period_end")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileData) {
        const prof = profileData as Profile;
        setProfile(prof);
        setFullName(prof.full_name ?? "");
        setOfficeName(prof.office_name ?? "");
        setLogoUrl(prof.logo_url ?? "");
        setPhoneNumber(prof.phone_number ?? "");
      }
      if (subData) {
        setSubscription(subData as Subscription);
      }
      setLoading(false);

      loadTeamData();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, officeName, logoUrl, phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Profil güncellenemedi");
        return;
      }
      toast.success("Profil ve logo güncellendi");
      if (profile) {
        setProfile({
          ...profile,
          full_name: fullName,
          office_name: officeName,
          logo_url: logoUrl,
          phone_number: phoneNumber,
        });
      }
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Davet gönderilemedi");
        return;
      }

      toast.success(data.message || "Ekip daveti gönderildi");
      setInviteEmail("");
      loadTeamData();
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveInvite = async (inviteId: string) => {
    try {
      const res = await fetch("/api/team/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (res.ok) {
        toast.success("Davet iptal edildi");
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      }
    } catch {
      toast.error("İptal işlemi başarısız");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch("/api/team/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) {
        toast.success("Üye ekipten çıkarıldı");
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Şifre değiştirilemedi");
        return;
      }
      toast.success("Şifre güncellendi");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="w-8 h-8 text-slate-500 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  const planLabel = profile ? (planLabels[profile.plan] ?? profile.plan) : "-";
  const isFree = profile?.plan === "free";
  const isTeamPlan = profile?.plan === "team" || profile?.plan === "individual";
  const usagePercent = isFree
    ? Math.min((profile?.monthly_listing_count ?? 0) / FREE_PLAN_LIMIT, 1) * 100
    : 0;

  const totalTeamCount = invites.length + members.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="text-slate-400 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
          <p className="text-slate-400 text-sm mt-1">
            Hesap bilgilerinizi ve Ofis ayarlarınızı yönetin
          </p>
        </div>
      </div>

      {/* Abonelik özeti */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Abonelik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Mevcut Plan</span>
            <Badge
              className={
                isFree
                  ? "bg-white/10 text-slate-300"
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }
            >
              {planLabel}
            </Badge>
          </div>
          {isFree && profile ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Bu Ay Kullanım</span>
                <span className="text-white">
                  {profile.monthly_listing_count} / {FREE_PLAN_LIMIT}
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent >= 100
                      ? "bg-red-500"
                      : usagePercent >= 80
                      ? "bg-amber-500"
                      : "bg-indigo-500"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usagePercent >= 100 && (
                <p className="text-red-400 text-xs">
                  Limitinize ulaştınız.{" "}
                  <button
                    onClick={() => router.push("/pricing")}
                    className="underline hover:text-red-300"
                  >
                    Planınızı yükseltin
                  </button>
                </p>
              )}
            </>
          ) : subscription ? (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Durum</span>
              <span className="text-white">
                {subscription.status === "active" ? "Aktif" : subscription.status}
                {subscription.current_period_end &&
                  ` · ${new Date(
                    subscription.current_period_end
                  ).toLocaleDateString("tr-TR")}`}
              </span>
            </div>
          ) : null}
          {isFree && (
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white"
            >
              Planı Yükselt
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Profil & Ofis Marka Özelleştirmesi */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Profil & Ofis Marka Özelleştirmesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-fullname" className="text-slate-300">
                Ad Soyad *
              </Label>
              <Input
                id="settings-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="settings-office" className="text-slate-300">
                  Ofis Adı
                </Label>
                <Input
                  id="settings-office"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="Örn. Yılmaz Emlak Gayrimenkul"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  İlanlarınızda ve PDF çıktılarında ofis adı olarak görünür.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-phone" className="text-slate-300">
                  Telefon Numarası
                </Label>
                <Input
                  id="settings-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0532 XXX XX XX"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  İlanlarda iletişim numarası olarak yer alır.
                </p>
              </div>
            </div>

            {/* Ofis Logosu Yükleme */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <Label htmlFor="settings-logo" className="text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                Ofis Logosu URL
              </Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="settings-logo"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://ornek.com/logo.png"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm flex-1"
                />
                {logoUrl && (
                  <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Ofis Logosu"
                      className="w-full h-full object-contain"
                      onError={() => toast.error("Logo resmi yüklenemedi")}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Ofis planında metin çıktılarınızın ve PDF paylaşım kartlarınızın üzerinde ofis logonuz gösterilir.
              </p>
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white"
            >
              {savingProfile ? "Kaydediliyor..." : "Profili & Logoyu Kaydet"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Ekip Yönetimi (Ofis Planı - 5 Kullanıcı Davet Etme) */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Ekip Yönetimi
            </CardTitle>
            <Badge
              variant="outline"
              className="text-xs border-indigo-500/20 text-indigo-400 bg-indigo-500/10"
            >
              {totalTeamCount} / 5 Üye
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-slate-400 text-sm">
            Ofis planı kapsamında 5 kişiye kadar ekip üyenizi e-posta ile davet edebilir, ilan yönetimini birlikte yapabilirsiniz.
          </p>

          {/* Davet formu */}
          <form onSubmit={handleSendInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="ekip_arkadasi@ofisiniz.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm flex-1"
            />
            <Button
              type="submit"
              disabled={sendingInvite || totalTeamCount >= 5}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              {sendingInvite ? "Gönderiliyor..." : "Davet Et"}
            </Button>
          </form>

          {/* Davetliler / Üyeler Listesi */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ekip Üyeleri ve Bekleyen Davetler
            </h4>

            {members.length === 0 && invites.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-2">
                Henüz davet edilmiş ekip üyesi bulunmuyor.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Üyeler */}
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-semibold">
                        {(member.full_name?.[0] || "U").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {member.full_name || "Ekip Üyesi"}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {member.office_role === "owner" ? "Ofis Yöneticisi" : "Ekip Üyesi"}
                        </p>
                      </div>
                    </div>
                    {member.office_role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-slate-500 hover:text-red-400 h-8 w-8 p-0"
                        title="Üyeyi çıkar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {/* Davetler */}
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-slate-300">{invite.invited_email}</span>
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                        Davet Bekliyor
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveInvite(invite.id)}
                      className="text-slate-500 hover:text-red-400 h-8 w-8 p-0"
                      title="Daveti iptal et"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Şifre değiştir */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            Şifre Değiştir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-current-password" className="text-slate-300">
                Mevcut Şifre
              </Label>
              <Input
                id="settings-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-new-password" className="text-slate-300">
                Yeni Şifre
              </Label>
              <Input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="En az 6 karakter"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              type="submit"
              disabled={savingPassword}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white"
            >
              {savingPassword ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
            </Button>
          </form>

          <Separator className="bg-white/5 my-5" />

          <div className="flex items-start gap-2 text-sm">
            <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-slate-500">
              Şifrenizi mi unuttunuz? Giriş yapma ekranındaki &ldquo;Şifremi
              unuttum&rdquo; bağlantısından sıfırlama e-postası gönderebilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
