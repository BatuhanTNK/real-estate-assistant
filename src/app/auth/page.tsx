"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

function isFailedToFetch(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string" &&
    ((err as { message: string }).message.includes("Failed to fetch") ||
      String(err).includes("Failed to fetch"))
  );
}

function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_callback_error"
      ? "E-posta doğrulama bağlantısı geçersiz veya süresi dolmuş."
      : null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setError(null);
    try {
      if (!supabase.auth.signInWithOAuth) {
        setError("Supabase yapılandırılmamış. Lütfen .env.local dosyanızdaki Supabase bilgilerinizi kontrol edin.");
        setOauthLoading(false);
        return;
      }
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthError) {
        setError(oauthError.message);
        setOauthLoading(false);
      }
      // Başarılıysa tarayıcı Google'a yönlendirir; sayfa unloads.
    } catch (err: unknown) {
      if (isFailedToFetch(err)) {
        setError("Supabase sunucusuna bağlanılamadı. .env.local dosyanızdaki Project URL adresini kontrol edin.");
      } else {
        setError("Google ile giriş başlatılamadı.");
      }
      setOauthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "İstek gönderilemedi");
        setForgotLoading(false);
        return;
      }
      setForgotSent(true);
      setMessage(data.message);
    } catch {
      setError("Bağlantı hatası, lütfen tekrar deneyin");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        if (loginError.message === "Invalid login credentials") {
          setError("E-posta veya şifre hatalı.");
        } else if (loginError.message.includes("Email not confirmed")) {
          setError("E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki doğrulama bağlantısına tıklayın.");
        } else {
          setError(loginError.message);
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Login catch error:", err);
      if (isFailedToFetch(err)) {
        setError("Supabase sunucusuna bağlanılamadı. Lütfen Supabase panelindeki (Settings -> API) Project URL adresinizi .env.local dosyanızda kontrol edin.");
      } else {
        setError("Giriş yapılırken bir bağlantı hatası oluştu.");
      }
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setError("Bu e-posta adresi ile zaten bir hesap oluşturulmuş. Giriş yapmayı deneyin.");
        setLoading(false);
        return;
      }

      setMessage(`Kayıt başarılı! ${email} adresinize doğrulama e-postası gönderildi. Lütfen e-postanızı onaylayarak giriş yapın.`);
      setLoading(false);
    } catch (err: unknown) {
      console.error("SignUp catch error:", err);
      if (isFailedToFetch(err)) {
        setError("Supabase sunucusuna bağlanılamadı. Lütfen Supabase panelindeki (Settings -> API) Project URL adresinizi .env.local dosyanızda kontrol edin.");
      } else {
        setError("Kayıt olunurken bir bağlantı hatası oluştu.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-8 flex justify-center">
        <Logo size="lg" />
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl text-white">Hoş Geldiniz</CardTitle>
          <CardDescription className="text-slate-400">
            Profesyonel emlak ilan metinleri oluşturmaya başlayın
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div role="status" aria-live="polite" className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-400 mb-1">E-posta Doğrulaması Gerekli</p>
                <p>{message}</p>
              </div>
            </div>
          )}

          {forgotMode ? (
            <div className="space-y-4 mt-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Şifrenizi mi unuttunuz?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
                </p>
              </div>
              {forgotSent ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{message}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setForgotSent(false);
                      setMessage(null);
                      setEmail("");
                      setPassword("");
                    }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium transition-all duration-300 py-5 shadow-lg shadow-indigo-600/20"
                  >
                    Girişe dön
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-slate-300">E-posta Adresi</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="ornek@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium transition-all duration-300 py-5 shadow-lg shadow-indigo-600/20"
                  >
                    {forgotLoading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setError(null);
                      setMessage(null);
                    }}
                    className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    ← Girişe dön
                  </button>
                </form>
              )}
            </div>
          ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-lg">
              <TabsTrigger value="login" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 rounded-md transition-all">
                Giriş Yap
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 rounded-md transition-all">
                Kayıt Ol
              </TabsTrigger>
            </TabsList>

            {/* OAuth: Google ile giriş */}
            <div className="mt-4 space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={oauthLoading}
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white font-medium transition-all duration-300 py-5"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {oauthLoading ? "Yönlendiriliyor..." : "Google ile giriş yap"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-slate-500">veya</span>
                </div>
              </div>
            </div>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-300">E-posta Adresi</Label>
                  <div className="relative">
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="ornek@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 pr-10"
                    />
                    <Mail className="absolute right-3 top-2.5 h-5 w-5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-300">Şifre</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium transition-all duration-300 py-5 shadow-lg shadow-indigo-600/20"
                  disabled={loading}
                >
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>

              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Şifremi unuttum
                </button>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-slate-300">Ad Soyad</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-300">E-posta Adresi</Label>
                  <div className="relative">
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="ornek@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 pr-10"
                    />
                    <Mail className="absolute right-3 top-2.5 h-5 w-5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-300">Şifre</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="En az 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium transition-all duration-300 py-5 shadow-lg shadow-emerald-600/20"
                  disabled={loading}
                >
                  {loading ? "Kayıt yapılıyor..." : "Ücretsiz Kayıt Ol"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-slate-500 text-sm mt-6">
        Kayıt olarak{" "}
        <Link href="/legal/terms" className="text-slate-400 hover:text-white transition-colors">Kullanım Şartları</Link>
        {" "}ve{" "}
        <Link href="/legal/privacy" className="text-slate-400 hover:text-white transition-colors">Gizlilik Politikası</Link>
        &apos;nı kabul etmiş olursunuz.
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="text-white">Yükleniyor...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
