"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { InstagramCarouselPreview } from "@/components/instagram/instagram-carousel-preview";
import {
  renderCoverSlide,
  renderPropertySlide,
  SlideTheme,
  AspectRatio,
} from "@/lib/utils/canvas-renderer";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Upload,
  Sparkles,
  ImagePlus,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Lock,
  Palette,
  Hash,
  MoveLeft,
  MoveRight,
} from "lucide-react";

const PORTRAIT_STYLES = [
  {
    value: "formal",
    label: "Formal",
    desc: "Takım elbise, stüdyo ışığı",
    emoji: "👔",
  },
  {
    value: "casual",
    label: "Casual",
    desc: "Blazer, doğal ışık",
    emoji: "🧥",
  },
  {
    value: "luxury",
    label: "Lüks",
    desc: "Premium, sinematik",
    emoji: "✨",
  },
];

const THEME_OPTIONS: { value: SlideTheme; label: string; desc: string; emoji: string }[] = [
  {
    value: "modern_dark",
    label: "Modern Koyu",
    desc: "Koyu indigo gradient, yüksek kontrast",
    emoji: "🌙",
  },
  {
    value: "gold_luxury",
    label: "Lüks Altın",
    desc: "Altın sarısı detaylar, elit tasarım",
    emoji: "👑",
  },
  {
    value: "clean_glass",
    label: "Minimalist Açık",
    desc: "Buzlu cam etkisi, modern şık",
    emoji: "💎",
  },
];

interface Profile {
  plan: string;
  full_name: string | null;
  office_name: string | null;
  logo_url: string | null;
  phone_number: string | null;
}

export default function InstagramPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const propertyFileRef = useRef<HTMLInputElement>(null);

  // Genel durum
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tasarım ve Format Seçimleri
  const [theme, setTheme] = useState<SlideTheme>("modern_dark");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");

  // Adım 1 — Portre
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [selfieType, setSelfieType] = useState<string>("image/jpeg");
  const [selectedStyle, setSelectedStyle] = useState("formal");
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);

  // Adım 2 — Mülk bilgileri & metin
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("");
  const [floor, setFloor] = useState("");
  const [badgeText, setBadgeText] = useState("SATILIK İLAN");
  const [captionText, setCaptionText] = useState("");

  // Adım 3 — Mülk fotoğrafları
  const [propertyPhotos, setPropertyPhotos] = useState<string[]>([]);

  // Adım 4 — Çıktı
  const [slideBlobs, setSlideBlobs] = useState<Blob[]>([]);
  const [slideUrls, setSlideUrls] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);

  // Profil yükleme
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("plan, full_name, office_name, logo_url, phone_number")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data as Profile);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Demo verilerle hızlı doldurma
  const handleLoadDemoData = () => {
    const samplePortrait = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%231e293b'/><circle cx='200' cy='150' r='70' fill='%236366f1'/><path d='M80 350 C80 250 320 250 320 350 Z' fill='%234f46e5'/><text x='200' y='380' text-anchor='middle' fill='white' font-family='sans-serif' font-size='20'>Örnek Emlakçı Portresi</text></svg>";
    const sampleHouse = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='%230f172a'/><polygon points='400,100 150,300 650,300' fill='%23e11d48'/><rect x='200' y='300' width='400' height='250' fill='%23f8fafc'/><rect x='340' y='400' width='120' height='150' fill='%23334155'/><rect x='240' y='350' width='80' height='80' fill='%2338bdf8'/><rect x='480' y='350' width='80' height='80' fill='%2338bdf8'/><text x='400' y='580' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='24'>Lüks Villa Fotoğrafı</text></svg>";

    setSelfiePreview(samplePortrait);
    setPortraitPreview(samplePortrait);
    setPrice("₺14.500.000");
    setLocation("Bodrum, Muğla");
    setArea("320 m²");
    setRooms("4+1");
    setFloor("Müstakil");
    setBadgeText("SATILIK LÜKS VİLLA");
    setCaptionText("Lüks Bodrum villamız satıştadır! Özel yüzme havuzlu, geniş bahçeli ve büyüleyici deniz manzaralı. Detaylı bilgi ve randevu için DM atabilir veya arayabilirsiniz.");
    setPropertyPhotos([sampleHouse]);
    toast.success("Örnek test verileri yüklendi!");
  };

  // Hashtag ekleme
  const handleAddHashtags = () => {
    const tags = "\n\n#emlak #satılıkkonut #gayrimenkul #emlakdanışmanı #lükskonut #satılıkvilla #yatırım #realestate #realtor #emlakdünyası";
    if (!captionText.includes("#emlak")) {
      setCaptionText((prev) => prev + tags);
      toast.success("Popüler Instagram etiketleri eklendi! 🏷️");
    } else {
      toast.info("Etiketler zaten açıklamaya eklenmiş.");
    }
  };

  // Fotoğraf seçimi & resize
  const handleSelfieSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Lütfen bir fotoğraf dosyası seçin");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setSelfiePreview(dataUrl);
        setPortraitPreview(dataUrl);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 1024;
          let w = img.width,
            h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) {
              h = (h / w) * MAX;
              w = MAX;
            } else {
              w = (w / h) * MAX;
              h = MAX;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);

          const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
          const quality = mime === "image/jpeg" ? 0.85 : 1;
          const resizedDataUrl = canvas.toDataURL(mime, quality);
          const base64 = resizedDataUrl.split(",")[1];

          setSelfieBase64(base64);
          setSelfieType(mime);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // AI Portre üretimi
  const handleGeneratePortrait = useCallback(async () => {
    if (!selfieBase64) return;

    setGeneratingPortrait(true);
    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selfieBase64,
          mimeType: selfieType,
          style: selectedStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Portre oluşturulamadı");
        return;
      }

      const dataUrl = `data:${data.portrait.mimeType};base64,${data.portrait.imageBase64}`;
      setPortraitPreview(dataUrl);
      if (data.portrait.isFallback) {
        toast.info(data.portrait.fallbackReason || "Fotoğrafınız portre kartı için hazırlandı.");
      } else {
        toast.success("Profesyonel portre oluşturuldu! 🎉");
      }
      setStep(2);
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setGeneratingPortrait(false);
    }
  }, [selfieBase64, selfieType, selectedStyle]);

  // Mülk fotoğrafı ekleme
  const handlePropertyPhotos = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const remaining = 9 - propertyPhotos.length;
      if (remaining <= 0) {
        toast.error("En fazla 9 mülk fotoğrafı yükleyebilirsiniz");
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remaining);

      filesToProcess.forEach((file) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX = 1920;
            let w = img.width,
              h = img.height;
            if (w > MAX || h > MAX) {
              if (w > h) {
                h = (h / w) * MAX;
                w = MAX;
              } else {
                w = (w / h) * MAX;
                h = MAX;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, w, h);
            const resized = canvas.toDataURL("image/jpeg", 0.9);
            setPropertyPhotos((prev) => [...prev, resized]);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });

      e.target.value = "";
    },
    [propertyPhotos.length]
  );

  const removePropertyPhoto = (index: number) => {
    setPropertyPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const movePhotoLeft = (index: number) => {
    if (index <= 0) return;
    setPropertyPhotos((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const movePhotoRight = (index: number) => {
    if (index >= propertyPhotos.length - 1) return;
    setPropertyPhotos((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  // Slaytları render et
  const handleRenderSlides = useCallback(async () => {
    if (!portraitPreview) return;

    setRendering(true);
    try {
      const blobs: Blob[] = [];

      // Kapak slaytı
      const coverBlob = await renderCoverSlide({
        portraitSrc: portraitPreview,
        theme,
        aspectRatio,
        overlay: {
          price: price || "Fiyat Bilgisi",
          location: location || "Konum",
          area: area || "m²",
          rooms: rooms || undefined,
          floor: floor || undefined,
          badgeText: badgeText || undefined,
          agentName: profile?.full_name || "Emlak Danışmanı",
          officeName: profile?.office_name || undefined,
          logoUrl: profile?.logo_url || undefined,
        },
      });
      blobs.push(coverBlob);

      // Mülk slaytları
      for (const photo of propertyPhotos) {
        const propBlob = await renderPropertySlide({
          photoSrc: photo,
          theme,
          aspectRatio,
          brand: {
            officeName: profile?.office_name || undefined,
            phone: profile?.phone_number || undefined,
          },
        });
        blobs.push(propBlob);
      }

      const urls = blobs.map((b) => URL.createObjectURL(b));
      slideUrls.forEach((u) => URL.revokeObjectURL(u));

      setSlideBlobs(blobs);
      setSlideUrls(urls);
      toast.success(`${blobs.length} slayt başarıyla oluşturuldu!`);
    } catch (err) {
      console.error("Render error:", err);
      toast.error("Slaytlar oluşturulurken hata oluştu");
    } finally {
      setRendering(false);
    }
  }, [
    portraitPreview,
    price,
    location,
    area,
    rooms,
    floor,
    badgeText,
    theme,
    aspectRatio,
    profile,
    propertyPhotos,
    slideUrls,
  ]);

  // ZIP olarak indir
  const handleDownloadZip = useCallback(async () => {
    if (slideBlobs.length === 0) return;

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      slideBlobs.forEach((blob, i) => {
        const name =
          i === 0 ? "01_kapak_portre.png" : `${String(i + 1).padStart(2, "0")}_mulk_foto.png`;
        zip.file(name, blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "instagram_ilan_karti.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ZIP dosyası indirildi!");
    } catch {
      toast.error("İndirme başarısız");
    }
  }, [slideBlobs]);

  const handleDownloadSingle = (index: number) => {
    const blob = slideBlobs[index];
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagram_slayt_${index + 1}.png`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (profile?.plan === "free") {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Instagram İlan Kartı Oluşturucu
        </h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          Bu özellik <strong>Bireysel</strong> ve <strong>Ofis</strong> planlarına
          özeldir. Yapay zeka ile profesyonel portre üretimi, Instagram carousel
          kartları oluşturma ve ZIP indirme özelliklerinden yararlanmak için
          planınızı yükseltin.
        </p>
        <Button
          onClick={() => router.push("/pricing")}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white"
        >
          Planları İncele
        </Button>
      </div>
    );
  }

  const canProceedStep1 = !!portraitPreview;
  const canProceedStep2 = !!price && !!location && !!captionText;
  const canProceedStep3 = propertyPhotos.length >= 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Camera className="w-6 h-6 text-indigo-400" />
              Instagram İlan Kartı
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              AI portre + mülk fotoğrafları ile lüks carousel postlar tasarlayın
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadDemoData}
          className="border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/10 text-xs shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
          ✨ Örnek Verilerle Dene
        </Button>
      </div>

      {/* Adım göstergesi */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: "Portre" },
          { n: 2, label: "Bilgiler & Tema" },
          { n: 3, label: "Fotoğraflar" },
          { n: 4, label: "Önizleme" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (n < step) setStep(n);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                n === step
                  ? "bg-indigo-500 text-white"
                  : n < step
                  ? "bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30"
                  : "bg-white/5 text-slate-500 cursor-default"
              }`}
            >
              {n < step ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span>{n}</span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </button>
            {n < 4 && (
              <div
                className={`w-6 h-px ${
                  n < step ? "bg-emerald-500/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ================================== */}
      {/* ADIM 1 — Portre Yükleme & AI Üretimi */}
      {/* ================================== */}
      {step === 1 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              Adım 1: Fotoğrafınızı Yükleyin & AI Portre Oluşturun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-slate-300 mb-2 block">
                Kendi Fotoğrafınız (Selfie veya Profil Fotoğrafı)
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleSelfieSelect}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl p-8 text-center cursor-pointer transition-colors group"
              >
                {selfiePreview ? (
                  <div className="flex items-center justify-center gap-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selfiePreview}
                      alt="Yüklenen fotoğraf"
                      className="w-32 h-32 object-cover rounded-xl border border-white/10"
                    />
                    <div className="text-left">
                      <p className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Fotoğraf yüklendi
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Değiştirmek için tıklayın
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3 group-hover:text-indigo-400 transition-colors" />
                    <p className="text-slate-300 font-medium">
                      Fotoğrafınızı sürükleyin veya tıklayın
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      JPEG, PNG veya WebP • Maks 4MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selfiePreview && (
              <div>
                <Label className="text-slate-300 mb-3 block">
                  AI Portre Stili Seçin
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {PORTRAIT_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setSelectedStyle(style.value)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        selectedStyle === style.value
                          ? "bg-indigo-500/10 border-indigo-500/40 text-white"
                          : "bg-white/3 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{style.emoji}</span>
                      <span className="text-sm font-medium block">
                        {style.label}
                      </span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {style.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selfiePreview && (
              <Button
                onClick={handleGeneratePortrait}
                disabled={generatingPortrait || !selfieBase64}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white h-12 text-base"
              >
                {generatingPortrait ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin mr-2"
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
                    AI Portre Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Profesyonel AI Portre Oluştur & Devam Et
                  </>
                )}
              </Button>
            )}

            {portraitPreview && (
              <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <p className="text-emerald-400 text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Portreniz Kapak Kartı İçin Hazır!
                </p>
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={portraitPreview}
                    alt="AI Portre"
                    className="w-48 h-48 object-cover rounded-xl border border-emerald-500/20"
                  />
                  <div className="space-y-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGeneratePortrait}
                      disabled={generatingPortrait}
                      className="text-slate-400 hover:text-white text-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Tekrar Üret
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Devam Et
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================== */}
      {/* ADIM 2 — Mülk Bilgileri, Tema & Format */}
      {/* ================================== */}
      {step === 2 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              🎨 Adım 2: Mülk Bilgileri, Tasarım Teması & Metin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tasarım Teması & Boyut Seçimi */}
            <div className="grid sm:grid-cols-2 gap-4 p-4 bg-white/3 border border-white/10 rounded-xl">
              <div>
                <Label className="text-slate-300 mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  Tasarım Teması
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                        theme === t.value
                          ? "bg-indigo-500/20 border-indigo-500 text-white font-medium"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-lg mb-0.5">{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-300 mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  📏 Slayt Boyutu (Format)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAspectRatio("4:5")}
                    className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                      aspectRatio === "4:5"
                        ? "bg-indigo-500/20 border-indigo-500 text-white font-medium"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block text-sm font-bold mb-0.5">4:5 Dikey</span>
                    1080×1350 (Varsayılan)
                  </button>

                  <button
                    onClick={() => setAspectRatio("1:1")}
                    className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                      aspectRatio === "1:1"
                        ? "bg-indigo-500/20 border-indigo-500 text-white font-medium"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block text-sm font-bold mb-0.5">1:1 Kare</span>
                    1080×1080 (Klasik)
                  </button>
                </div>
              </div>
            </div>

            {/* Form Girişleri */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ig-price" className="text-slate-300">
                  Fiyat *
                </Label>
                <Input
                  id="ig-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="₺4.850.000"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig-location" className="text-slate-300">
                  Konum *
                </Label>
                <Input
                  id="ig-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Kadıköy, İstanbul"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig-area" className="text-slate-300">
                  Alan (m²)
                </Label>
                <Input
                  id="ig-area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="145 m²"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ig-rooms" className="text-slate-300">
                  Oda Sayısı
                </Label>
                <Input
                  id="ig-rooms"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  placeholder="3+1"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig-floor" className="text-slate-300">
                  Kat Bilgisi
                </Label>
                <Input
                  id="ig-floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="4. Kat"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig-badge" className="text-slate-300">
                  Rozet Etiketi
                </Label>
                <Input
                  id="ig-badge"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="SATILIK LÜKS DAİRE"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ig-caption" className="text-slate-300">
                  Instagram Açıklama Metni (Caption) *
                </Label>
                <button
                  onClick={handleAddHashtags}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Hash className="w-3.5 h-3.5" />
                  Hashtag Ekle
                </button>
              </div>
              <Textarea
                id="ig-caption"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="İlan metninizi buraya yapıştırın veya yazın..."
                rows={6}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-y"
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Geri
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Devam Et
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================== */}
      {/* ADIM 3 — Mülk Fotoğrafları & Sıralama */}
      {/* ================================== */}
      {step === 3 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-emerald-400" />
                Adım 3: Mülk Fotoğrafları (En fazla 9 adet)
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs border-white/10 text-slate-400"
              >
                {propertyPhotos.length} / 9 fotoğraf
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-slate-400 text-sm">
              Ev, villa veya iş yeri fotoğraflarını yükleyin. Fotoğrafların
              sırasını değiştirmek için yön oklarını kullanabilirsiniz.
            </p>

            <input
              ref={propertyFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handlePropertyPhotos}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {propertyPhotos.map((photo, i) => (
                <div key={i} className="relative group aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Mülk ${i + 1}`}
                    className="w-full h-full object-cover rounded-xl border border-white/10"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className="bg-black/70 text-white text-[10px] border-0">
                      {i + 2}. slayt
                    </Badge>
                  </div>

                  {/* Sıralama & Silme Butonları */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1.5">
                    {i > 0 && (
                      <button
                        onClick={() => movePhotoLeft(i)}
                        className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
                        title="Sola taşı"
                      >
                        <MoveLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removePropertyPhoto(i)}
                      className="w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-600"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {i < propertyPhotos.length - 1 && (
                      <button
                        onClick={() => movePhotoRight(i)}
                        className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
                        title="Sağa taşı"
                      >
                        <MoveRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {propertyPhotos.length < 9 && (
                <button
                  onClick={() => propertyFileRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs">Fotoğraf Ekle</span>
                </button>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Geri
              </Button>
              <Button
                onClick={async () => {
                  setStep(4);
                  setTimeout(() => {
                    handleRenderSlides();
                  }, 300);
                }}
                disabled={!canProceedStep3}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Slaytları Oluştur & Önizle
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================== */}
      {/* ADIM 4 — Önizleme & İndirme */}
      {/* ================================== */}
      {step === 4 && (
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  📱 Adım 4: Önizleme & İndirme
                </CardTitle>
                {slideBlobs.length > 0 && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {slideBlobs.length} slayt hazır ({aspectRatio})
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {rendering ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <svg
                    className="w-10 h-10 text-indigo-400 animate-spin mb-4"
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
                  <p className="text-white font-medium">
                    Slaytlar oluşturuluyor...
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    Yüksek kalitede tuval işleniyor
                  </p>
                </div>
              ) : (
                <>
                  <InstagramCarouselPreview
                    slides={slideUrls}
                    caption={captionText}
                  />

                  {slideBlobs.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                      <Button
                        onClick={handleDownloadZip}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white h-11"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Tümünü İndir (ZIP)
                      </Button>

                      {slideBlobs.map((_, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSingle(i)}
                          className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Slayt {i + 1}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between pt-2 border-t border-white/5">
                <Button
                  variant="ghost"
                  onClick={() => setStep(3)}
                  className="text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Geri
                </Button>
                <Button
                  onClick={handleRenderSlides}
                  disabled={rendering}
                  variant="ghost"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Tekrar Oluştur
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
