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
import type { ListingFormData } from "@/lib/ai/validation";
import { InstagramCarouselPreview } from "@/components/instagram/instagram-carousel-preview";
import { LiveSlidePreview } from "@/components/instagram/live-slide-preview";
import {
  renderCoverSlide,
  renderPropertySlide,
  SlideTheme,
  AspectRatio,
  CoverLayoutType,
  StudioPlatform,
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
  Tag,
  Wand2,
  Copy,
} from "lucide-react";

const PLATFORM_CONFIGS: {
  id: StudioPlatform;
  label: string;
  badge: string;
  desc: string;
  icon: string;
  defaultRatio: AspectRatio;
  defaultTheme?: SlideTheme;
}[] = [
  {
    id: "sahibinden",
    label: "Sahibinden.com",
    badge: "İlan & Vitrin",
    desc: "4:3 / 16:9 vitrin görselleri ve kurumsal ilan açıklaması",
    icon: "🏠",
    defaultRatio: "4:3",
    defaultTheme: "sahibinden_vitrin",
  },
  {
    id: "instagram",
    label: "Instagram",
    badge: "Carousel & Story",
    desc: "4:5 dikey, 1:1 kare veya 9:16 Reels/Story kartları ve keşfet metni",
    icon: "📸",
    defaultRatio: "4:5",
    defaultTheme: "modern_dark",
  },
  {
    id: "facebook",
    label: "Facebook",
    badge: "Akış & Marketplace",
    desc: "1:1 kare / 16:9 yatay paylaşım kartları ve grup/Marketplace metni",
    icon: "📘",
    defaultRatio: "1:1",
    defaultTheme: "modern_dark",
  },
];

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
    value: "sahibinden_vitrin",
    label: "Sahibinden Vitrin",
    desc: "Sarı-siyah vitrin vurgusu, dikkat çekici",
    emoji: "🏠",
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

const ASPECT_RATIO_OPTIONS: {
  value: AspectRatio;
  label: string;
  size: string;
  platforms: string;
}[] = [
  {
    value: "4:3",
    label: "4:3 İlan",
    size: "1200×900",
    platforms: "Sahibinden Standart",
  },
  {
    value: "16:9",
    label: "16:9 Yatay",
    size: "1600×900",
    platforms: "Vitrin & Facebook",
  },
  {
    value: "4:5",
    label: "4:5 Dikey",
    size: "1080×1350",
    platforms: "Instagram & FB",
  },
  {
    value: "1:1",
    label: "1:1 Kare",
    size: "1080×1080",
    platforms: "Instagram & Marketplace",
  },
  {
    value: "9:16",
    label: "9:16 Story",
    size: "1080×1920",
    platforms: "Hikaye & Reels",
  },
];

const QUICK_ROOM_TAGS = [
  "Salon & Oturma Alanı",
  "Açık Mutfak",
  "Ebeveyn Yatak Odası",
  "Geniş Teras & Manzara",
  "Lüks Banyo & Jakuzi",
  "Dış Cephe & Bahçe",
  "Özel Havuz",
  "Giyinme Odası",
];

interface Profile {
  plan: string;
  full_name: string | null;
  office_name: string | null;
  logo_url: string | null;
  phone_number: string | null;
}

interface SavedListing {
  id: string;
  property_type: string;
  input_data: Partial<Omit<ListingFormData, "location">> & {
    location?: Partial<ListingFormData["location"]> | string;
    arsaAlani?: string;
  };
  output_kisa: string | null;
  output_samimi: string | null;
  output_resmi: string | null;
  created_at: string;
}

interface PropertyPhotoItem {
  id: string;
  url: string;
  tag: string;
}

export default function SocialMediaStudioPage() {
  const router = useRouter();
  const supabase = createClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const propertyFileRef = useRef<HTMLInputElement>(null);

  // Genel durum
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Hedef Platform Seçimi (Sahibinden, Instagram, Facebook)
  const [platform, setPlatform] = useState<StudioPlatform>("instagram");

  // Kayıtlı ilanlar
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>("");

  // Tasarım ve Format Seçimleri
  const [layoutType, setLayoutType] = useState<CoverLayoutType>("property_focused");
  const [theme, setTheme] = useState<SlideTheme>("modern_dark");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");

  // Adım 1 — Kapak & Portre
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [selfieType, setSelfieType] = useState<string>("image/jpeg");
  const [selectedStyle, setSelectedStyle] = useState("formal");
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);

  // Adım 2 — Mülk bilgileri & Platform metinleri
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("");
  const [floor, setFloor] = useState("");
  const [badgeText, setBadgeText] = useState("SATILIK LÜKS KONUT");
  const [platformCaptions, setPlatformCaptions] = useState<
    Record<StudioPlatform, string>
  >({
    sahibinden: "",
    instagram: "",
    facebook: "",
  });
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // Adım 3 — Mülk fotoğrafları
  const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhotoItem[]>([]);

  // Adım 4 — Çıktı
  const [slideBlobs, setSlideBlobs] = useState<Blob[]>([]);
  const [slideUrls, setSlideUrls] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);

  const currentCaption = platformCaptions[platform] || "";
  const setCurrentCaption = (val: string) => {
    setPlatformCaptions((prev) => ({ ...prev, [platform]: val }));
  };

  // Platform değiştirildiğinde önerilen boyut ve temayı uygula
  const handleSelectPlatform = (nextPlatform: StudioPlatform) => {
    setPlatform(nextPlatform);
    const cfg = PLATFORM_CONFIGS.find((p) => p.id === nextPlatform);
    if (cfg) {
      setAspectRatio(cfg.defaultRatio);
      if (nextPlatform === "sahibinden") {
        setTheme("sahibinden_vitrin");
      } else if (theme === "sahibinden_vitrin") {
        setTheme("modern_dark");
      }
    }
  };

  // Profil ve Geçmiş İlanları yükleme
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: profData } = await supabase
        .from("profiles")
        .select("plan, full_name, office_name, logo_url, phone_number")
        .eq("id", user.id)
        .single();

      if (profData) setProfile(profData as Profile);

      const { data: listData } = await supabase
        .from("listings")
        .select(
          "id, property_type, input_data, output_kisa, output_samimi, output_resmi, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25);

      if (listData) {
        setSavedListings(listData as SavedListing[]);
      }

      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kayıtlı ilandan bilgileri otomatik doldurma (3 platform metnini birden aktarır)
  const handleSelectSavedListing = (listingId: string) => {
    setSelectedListingId(listingId);
    if (!listingId) return;

    const listing = savedListings.find((l) => l.id === listingId);
    if (!listing) return;

    const input = listing.input_data || {};

    if (input.price) setPrice(input.price);

    if (input.location) {
      if (typeof input.location === "string") {
        setLocation(input.location);
      } else if (typeof input.location === "object") {
        const parts = [
          input.location.mahalle,
          input.location.ilce,
          input.location.il,
        ].filter(Boolean);
        setLocation(parts.join(", "));
      }
    }

    const m2 = input.metrekareNet || input.metrekareBrut || input.arsaAlani;
    if (m2) {
      setArea(String(m2).includes("m²") ? String(m2) : `${m2} m²`);
    }

    if (input.odaSayisi) setRooms(input.odaSayisi);
    if (input.bulunduguKat) setFloor(input.bulunduguKat);

    const ilanTuru = input.ilanTuru || "SATILIK";
    const propType = input.propertyType || listing.property_type || "KONUT";
    setBadgeText(`${ilanTuru.toUpperCase()} ${propType.toUpperCase()}`);

    setPlatformCaptions({
      sahibinden:
        listing.output_resmi ||
        listing.output_samimi ||
        listing.output_kisa ||
        "",
      instagram:
        listing.output_kisa ||
        listing.output_samimi ||
        listing.output_resmi ||
        "",
      facebook:
        listing.output_samimi ||
        listing.output_resmi ||
        listing.output_kisa ||
        "",
    });

    toast.success(
      "İlan bilgileri Sahibinden, Instagram ve Facebook için aktarıldı! 🚀"
    );
  };

  // Demo verilerle hızlı doldurma (3 platform için özel örnek içeriklerle)
  const handleLoadDemoData = () => {
    const samplePortrait =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%231e293b'/><circle cx='200' cy='150' r='70' fill='%236366f1'/><path d='M80 350 C80 250 320 250 320 350 Z' fill='%234f46e5'/><text x='200' y='380' text-anchor='middle' fill='white' font-family='sans-serif' font-size='20'>Örnek Emlakçı Portresi</text></svg>";
    const sampleHouse =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='%230f172a'/><polygon points='400,100 150,300 650,300' fill='%23e11d48'/><rect x='200' y='300' width='400' height='250' fill='%23f8fafc'/><rect x='340' y='400' width='120' height='150' fill='%23334155'/><rect x='240' y='350' width='80' height='80' fill='%2338bdf8'/><rect x='480' y='350' width='80' height='80' fill='%2338bdf8'/><text x='400' y='580' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='24'>Lüks Villa Fotoğrafı</text></svg>";
    const sampleInterior =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='%231e1b4b'/><rect x='100' y='350' width='600' height='180' fill='%234338ca' rx='20'/><text x='400' y='300' text-anchor='middle' fill='white' font-family='sans-serif' font-size='28'>Geniş Salon & Yemek Odası</text></svg>";

    setLayoutType("property_focused");
    setCoverPhoto(sampleHouse);
    setSelfiePreview(samplePortrait);
    setPortraitPreview(samplePortrait);
    setPrice("₺18.750.000");
    setLocation("Bodrum, Muğla");
    setArea("360 m²");
    setRooms("4+1");
    setFloor("Müstakil Villa");
    setBadgeText("SATILIK LÜKS VİLLA");
    setPlatformCaptions({
      sahibinden:
        "BODRUM YALIKAVAK'TA DENİZ MANZARALI MÜSTAKİL HAVUZLU 4+1 LÜKS VİLLA\n\n" +
        "• Konum: Muğla / Bodrum / Yalıkavak\n" +
        "• Kullanım Alanı: 360 m² Net\n" +
        "• Oda Sayısı: 4+1 ( tamamı ebeveyn banyolu )\n" +
        "• Yapı Tipi: Müstakil Dubleks Villa\n" +
        "• Fiyat: ₺18.750.000\n\n" +
        "Yalıkavak'ın en prestijli bölgesinde yer alan müstakil villamız; özel sonsuzluk havuzu, geniş peyzajlı bahçesi, akıllı ev otomasyon sistemi ve kapalı otoparkı ile dört mevsim ayrıcalıklı bir yaşam sunmaktadır.\n\n" +
        "Detaylı bilgi ve yerinde sunum randevusu için kurumsal iletişim hattımızdan ulaşabilirsiniz.",
      instagram:
        "✨ Bodrum Yalıkavak'ta Büyüleyici Deniz Manzaralı Müstakil Lüks Villa!\n\n" +
        "📍 Konum: Bodrum, Muğla\n" +
        "💰 Fiyat: ₺18.750.000\n" +
        "📐 Alan: 360 m² (4+1)\n" +
        "🏊‍♂️ Özel Sonsuzluk Havuzu & Geniş Peyzajlı Bahçe\n\n" +
        "Detaylı bilgi ve randevu için DM atabilir veya profilimizdeki iletişim numarasından bize ulaşabilirsiniz.\n\n" +
        "#bodrumvilla #satılıkvilla #lükskonut #gayrimenkul #yalıkavak #realestate",
      facebook:
        "🏡 Bodrum Yalıkavak'ta Satılık Müstakil Havuzlu 4+1 Lüks Villa\n\n" +
        "📍 Konum: Bodrum, Muğla\n" +
        "💰 Fiyat: ₺18.750.000\n" +
        "📐 Net Alan: 360 m² | 🚪 Oda: 4+1 | 🏢 Müstakil Villa\n\n" +
        "Geniş aile yaşamına ve yüksek kira getirili yatırıma uygun, deniz manzaralı, özel havuzlu ve müstakil tapulu lüks villamız satışa sunulmuştur. Krediye ve takasa uygundur.\n\n" +
        "📞 Detaylı bilgi, konum ve randevu için Messenger üzerinden mesaj gönderebilir veya doğrudan arayabilirsiniz.\n\n" +
        "#bodrumemlak #satılıkvilla #gayrimenkul #lükskonut",
    });
    setPropertyPhotos([
      { id: "1", url: sampleHouse, tag: "Dış Cephe & Havuz" },
      { id: "2", url: sampleInterior, tag: "Geniş Salon" },
    ]);
    toast.success("Sahibinden, Instagram ve Facebook için örnek veriler yüklendi!");
  };

  // AI ile Seçili Platform İçin Metin Üretimi
  const handleGenerateAiCaption = async (targetPlatform: StudioPlatform = platform) => {
    setGeneratingCaption(true);
    try {
      const res = await fetch("/api/generate-instagram-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: price || "Belirtilmedi",
          location: location || "Belirtilmedi",
          area: area || "",
          rooms: rooms || "",
          floor: floor || "",
          badgeText: badgeText || "Satılık İlan",
          platform: targetPlatform,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Açıklama üretilemedi");
        return;
      }

      setPlatformCaptions((prev) => ({
        ...prev,
        [targetPlatform]: data.caption,
      }));
      const pName =
        targetPlatform === "sahibinden"
          ? "Sahibinden.com"
          : targetPlatform === "facebook"
          ? "Facebook"
          : "Instagram";
      toast.success(`AI ile ${pName} metni oluşturuldu! ✨`);
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setGeneratingCaption(false);
    }
  };

  // Hashtag ekleme
  const handleAddHashtags = () => {
    if (platform === "sahibinden") {
      toast.info("Sahibinden.com ilan açıklamalarında hashtag kullanılmaz.");
      return;
    }
    const tags =
      platform === "facebook"
        ? "\n\n#emlak #satılıkkonut #gayrimenkul #yatırım"
        : "\n\n#emlak #satılıkkonut #gayrimenkul #emlakdanışmanı #lükskonut #satılıkvilla #yatırım #realestate #realtor #emlakdünyası";
    if (!currentCaption.includes("#emlak")) {
      setCurrentCaption(currentCaption + tags);
      toast.success("Popüler etiketler eklendi! 🏷️");
    } else {
      toast.info("Etiketler zaten açıklamaya eklenmiş.");
    }
  };

  // Kapak Mülk Fotoğrafı seçimi
  const handleCoverPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverPhoto(reader.result as string);
      toast.success("Kapak mülk fotoğrafı yüklendi!");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Selfie / Portre fotoğraf seçimi & resize
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
      e.target.value = "";
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
        toast.info(
          data.portrait.fallbackReason ||
            "Fotoğrafınız portre kartı için hazırlandı."
        );
      } else {
        toast.success("Profesyonel portre oluşturuldu! 🎉");
      }
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

            setPropertyPhotos((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                url: resized,
                tag: "",
              },
            ]);

            setCoverPhoto((currentCover) => currentCover || resized);
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

  const updatePhotoTag = (index: number, newTag: string) => {
    setPropertyPhotos((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], tag: newTag };
      }
      return copy;
    });
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

  // Slaytları render et (Adım 4)
  const handleRenderSlides = useCallback(async () => {
    const mainCoverSrc =
      layoutType === "agent_focused"
        ? portraitPreview
        : coverPhoto || propertyPhotos[0]?.url || portraitPreview;

    if (!mainCoverSrc) {
      toast.error("Kapak slaytı için en az bir görsel yüklenmelidir.");
      return;
    }

    setRendering(true);
    try {
      const blobs: Blob[] = [];

      // 1. Kapak slaytı
      const coverBlob = await renderCoverSlide({
        layoutType,
        coverImageSrc: mainCoverSrc,
        portraitSrc: portraitPreview || undefined,
        avatarSrc:
          layoutType === "property_focused"
            ? portraitPreview || undefined
            : undefined,
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
          phone: profile?.phone_number || undefined,
        },
      });
      blobs.push(coverBlob);

      // 2. Mülk slaytları
      for (const photoItem of propertyPhotos) {
        const propBlob = await renderPropertySlide({
          photoSrc: photoItem.url,
          tag: photoItem.tag || undefined,
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
      toast.success(`${blobs.length} görsel (${aspectRatio}) başarıyla oluşturuldu! 🎉`);
    } catch (err) {
      console.error("Render error:", err);
      toast.error("Görseller oluşturulurken hata oluştu");
    } finally {
      setRendering(false);
    }
  }, [
    layoutType,
    coverPhoto,
    propertyPhotos,
    portraitPreview,
    theme,
    aspectRatio,
    price,
    location,
    area,
    rooms,
    floor,
    badgeText,
    profile,
    slideUrls,
  ]);

  // ZIP olarak indir (görseller + platform metinleri .txt olarak)
  const handleDownloadZip = useCallback(async () => {
    if (slideBlobs.length === 0) return;

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      slideBlobs.forEach((blob, i) => {
        const name =
          i === 0
            ? `01_${platform}_kapak.png`
            : `${String(i + 1).padStart(2, "0")}_${platform}_mulk_foto.png`;
        zip.file(name, blob);
      });

      // Platform metinlerini de ZIP içerisine ekle
      const textParts: string[] = [];
      if (platformCaptions.sahibinden) {
        textParts.push(`=== SAHİBİNDEN.COM İLAN METNİ ===\n${platformCaptions.sahibinden}`);
      }
      if (platformCaptions.instagram) {
        textParts.push(`=== INSTAGRAM AÇIKLAMASI ===\n${platformCaptions.instagram}`);
      }
      if (platformCaptions.facebook) {
        textParts.push(`=== FACEBOOK / MARKETPLACE METNİ ===\n${platformCaptions.facebook}`);
      }
      if (textParts.length > 0) {
        zip.file("ilan_ve_sosyal_medya_metinleri.txt", textParts.join("\n\n\n"));
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${platform}_ilan_paketi.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Görseller ve platform metinleri ZIP olarak indirildi!");
    } catch {
      toast.error("İndirme başarısız");
    }
  }, [slideBlobs, platform, platformCaptions]);

  const handleDownloadSingle = (index: number) => {
    const blob = slideBlobs[index];
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${platform}_gorsel_${index + 1}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="w-8 h-8 text-indigo-500 animate-spin"
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
          Sosyal Medya &amp; İlan Stüdyosu
        </h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          Bu özellik <strong>Bireysel</strong> ve <strong>Ofis</strong> planlarına
          özeldir. <strong>Sahibinden.com</strong> vitrin görselleri,{" "}
          <strong>Instagram</strong> carousel/story ve{" "}
          <strong>Facebook Marketplace</strong> kartları oluşturmak için planınızı
          yükseltin.
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

  // Geçerlilik kontrolleri
  const canProceedStep1 =
    layoutType === "minimal_corporate"
      ? true
      : layoutType === "property_focused"
      ? true
      : !!portraitPreview;

  const canProceedStep2 = !!price && !!location;
  const canProceedStep3 = propertyPhotos.length >= 1;

  // Canlı önizleme için seçili kapak görseli
  const currentLiveCoverImage =
    layoutType === "agent_focused"
      ? portraitPreview
      : coverPhoto || propertyPhotos[0]?.url || portraitPreview;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Camera className="w-6 h-6 text-indigo-400" />
              Sosyal Medya &amp; İlan Stüdyosu
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Sahibinden.com vitrin görselleri, Instagram carousel/story ve Facebook paylaşımlarını tek yerden hazırlayın
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadDemoData}
          className="border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/10 text-xs shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          ✨ Örnek Verilerle Dene
        </Button>
      </div>

      {/* Hedef Platform Seçim Kartları (Sahibinden • Instagram • Facebook) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {PLATFORM_CONFIGS.map((p) => {
          const isSelected = platform === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPlatform(p.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                isSelected
                  ? p.id === "sahibinden"
                    ? "bg-yellow-400/10 border-yellow-400 text-white ring-1 ring-yellow-400/50"
                    : p.id === "facebook"
                    ? "bg-blue-500/15 border-blue-500 text-white ring-1 ring-blue-500/50"
                    : "bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500/50"
                  : "bg-white/3 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
              }`}
            >
              <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{p.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      isSelected
                        ? p.id === "sahibinden"
                          ? "bg-yellow-400 text-slate-950"
                          : p.id === "facebook"
                          ? "bg-blue-600 text-white"
                          : "bg-indigo-600 text-white"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {p.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Adım Göstergesi (Stepper) */}
      <div className="flex items-center gap-1.5 sm:gap-3 mb-8 overflow-x-auto pb-2">
        {[
          { n: 1, label: "Kapak & Portre" },
          { n: 2, label: "Platform, Boyut & Metin" },
          { n: 3, label: "Mülk Fotoğrafları" },
          { n: 4, label: "Önizleme & İndir" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (n < step) setStep(n);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                n === step
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : n < step
                  ? "bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30"
                  : "bg-white/5 text-slate-500 cursor-default"
              }`}
            >
              {n < step ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                  {n}
                </span>
              )}
              <span>{label}</span>
            </button>
            {n < 4 && (
              <div
                className={`w-4 sm:w-8 h-px ${
                  n < step ? "bg-emerald-500/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* İki Sütunlu Çalışma Alanı (Grid) */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Sol Sütun: Form & Kontroller */}
        <div className="lg:col-span-7 space-y-6">
          {/* ================================== */}
          {/* ADIM 1 — Kapak Modeli & Portre     */}
          {/* ================================== */}
          {step === 1 && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-400" />
                  Adım 1: Kapak Modeli &amp; Portre Seçimi
                </CardTitle>
                <p className="text-slate-400 text-xs">
                  Sahibinden vitrin fotoğrafı, Instagram veya Facebook kapağınız için
                  en uygun tasarım modelini seçin.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Kapak Modeli Seçici (3 Kart) */}
                <div>
                  <Label className="text-slate-300 mb-2.5 block text-xs font-semibold uppercase tracking-wider">
                    Kapak Tasarım Modeli
                  </Label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setLayoutType("property_focused")}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        layoutType === "property_focused"
                          ? "bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500"
                          : "bg-white/3 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">🌟</span>
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                          Önerilen
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white mb-1">
                        Mülk Odaklı
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Kapakta mülk fotoğrafı + köşede danışman rozeti
                      </div>
                    </button>

                    <button
                      onClick={() => setLayoutType("agent_focused")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        layoutType === "agent_focused"
                          ? "bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500"
                          : "bg-white/3 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
                      }`}
                    >
                      <span className="text-xl block mb-2">👔</span>
                      <div className="text-sm font-bold text-white mb-1">
                        Danışman Odaklı
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Tam boy profesyonel stüdyo portresi arka planda
                      </div>
                    </button>

                    <button
                      onClick={() => setLayoutType("minimal_corporate")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        layoutType === "minimal_corporate"
                          ? "bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500"
                          : "bg-white/3 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
                      }`}
                    >
                      <span className="text-xl block mb-2">🏢</span>
                      <div className="text-sm font-bold text-white mb-1">
                        Minimal Kurumsal
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        Portresiz; sadece mülk görseli ve ofis bilgisi
                      </div>
                    </button>
                  </div>
                </div>

                {/* Eğer Mülk Odaklı veya Minimal ise Kapak Mülk Fotoğrafı */}
                {layoutType !== "agent_focused" && (
                  <div>
                    <Label className="text-slate-300 mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                      <span>Kapak Mülk Fotoğrafı</span>
                      <span className="text-slate-400 text-[11px] font-normal normal-case">
                        (Boş bırakırsanız 3. adımdaki ilk fotoğraf kullanılır)
                      </span>
                    </Label>
                    <input
                      ref={coverPhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleCoverPhotoSelect}
                    />
                    <div
                      onClick={() => coverPhotoInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl p-5 text-center cursor-pointer transition-colors group bg-white/2"
                    >
                      {coverPhoto ? (
                        <div className="flex items-center justify-center gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverPhoto}
                            alt="Kapak Fotoğrafı"
                            className="w-24 h-24 object-cover rounded-lg border border-white/10"
                          />
                          <div className="text-left">
                            <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Kapak mülk görseli seçildi
                            </p>
                            <p className="text-slate-500 text-[11px] mt-1">
                              Görseli değiştirmek için tıklayın
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2">
                          <ImagePlus className="w-8 h-8 text-slate-500 mx-auto mb-2 group-hover:text-indigo-400 transition-colors" />
                          <p className="text-slate-300 text-xs font-medium">
                            Kapak için özel bir fotoğraf seçin veya tıklayın
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            JPEG, PNG veya WebP
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Danışman Portresi / Avatarı (Minimal hariç) */}
                {layoutType !== "minimal_corporate" && (
                  <div className="border-t border-white/5 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                        {layoutType === "property_focused"
                          ? "Emlakçı Avatar Portresi (Dairesel Rozet)"
                          : "Emlakçı Arka Plan Portresi"}
                      </Label>
                      {portraitPreview && (
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Hazır
                        </span>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleSelfieSelect}
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl p-5 text-center cursor-pointer transition-colors group bg-white/2"
                    >
                      {portraitPreview ? (
                        <div className="flex items-center justify-center gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={portraitPreview}
                            alt="Portre Fotoğrafı"
                            className="w-20 h-20 object-cover rounded-full border-2 border-indigo-500 shadow-md"
                          />
                          <div className="text-left">
                            <p className="text-white text-xs font-semibold">
                              Portre yüklendi
                            </p>
                            <p className="text-slate-400 text-[11px] mt-0.5">
                              Değiştirmek için tıklayın
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2">
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 group-hover:text-indigo-400 transition-colors" />
                          <p className="text-slate-300 text-xs font-medium">
                            Kendi fotoğrafınızı yükleyin (Selfie veya Vesikalık)
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Maks 4MB • Orijinal olarak kullanılabilir veya AI ile
                            dönüştürülebilir
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AI Portre Üretim Opsiyonu */}
                    {selfiePreview && (
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                            İsteğe Bağlı: AI ile Profesyonel Stüdyo Portresine
                            Dönüştür
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {PORTRAIT_STYLES.map((style) => (
                            <button
                              key={style.value}
                              onClick={() => setSelectedStyle(style.value)}
                              className={`p-2.5 rounded-lg border text-center transition-all text-xs ${
                                selectedStyle === style.value
                                  ? "bg-indigo-500/20 border-indigo-500 text-white font-medium"
                                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                              }`}
                            >
                              <span className="text-base block mb-0.5">
                                {style.emoji}
                              </span>
                              <span className="block font-semibold">
                                {style.label}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {style.desc}
                              </span>
                            </button>
                          ))}
                        </div>

                        <Button
                          onClick={handleGeneratePortrait}
                          disabled={generatingPortrait || !selfieBase64}
                          size="sm"
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs"
                        >
                          {generatingPortrait ? (
                            <>
                              <svg
                                className="w-4 h-4 animate-spin mr-2"
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
                              <Sparkles className="w-4 h-4 mr-1.5" />
                              Yapay Zeka ile Stüdyo Portresi Üret
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Adım 1 İlerleme */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4"
                  >
                    Devam Et (Platform &amp; Bilgiler)
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================================== */}
          {/* ADIM 2 — Mülk Bilgileri & Metin    */}
          {/* ================================== */}
          {step === 2 && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Palette className="w-5 h-5 text-indigo-400" />
                      Adım 2: Mülk Bilgileri, Format &amp; Platform Metni
                    </CardTitle>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Sahibinden, Instagram ve Facebook için görsel boyutunu,
                      temayı ve paylaşım metinlerini özelleştirin.
                    </p>
                  </div>

                  {/* Kayıtlı İlandan Doldur Dropdown */}
                  {savedListings.length > 0 && (
                    <div className="shrink-0">
                      <select
                        aria-label="Kayıtlı İlanlarımdan Getir"
                        value={selectedListingId}
                        onChange={(e) => handleSelectSavedListing(e.target.value)}
                        className="bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">📋 Kayıtlı İlandan Doldur...</option>
                        {savedListings.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.input_data?.price || "İlan"} —{" "}
                            {(typeof l.input_data?.location === "object"
                              ? l.input_data.location?.ilce
                              : l.input_data?.location) || l.property_type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Tasarım Teması & Boyut Seçimi */}
                <div className="space-y-4 p-3.5 bg-white/3 border border-white/10 rounded-xl">
                  <div>
                    <Label className="text-slate-300 mb-2 flex items-center gap-1.5 text-xs font-semibold">
                      <Palette className="w-3.5 h-3.5 text-indigo-400" />
                      Tasarım Teması
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {THEME_OPTIONS.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setTheme(t.value)}
                          className={`p-2 rounded-lg border text-center transition-all text-xs ${
                            theme === t.value
                              ? "bg-indigo-500/20 border-indigo-500 text-white font-medium"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-base mb-0.5">
                            {t.emoji}
                          </span>
                          <span className="block font-semibold">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 mb-2 flex items-center gap-1.5 text-xs font-semibold">
                      📏 Görsel Boyutu (Sahibinden / Instagram / Facebook)
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setAspectRatio(opt.value)}
                          className={`p-2 rounded-lg border text-center transition-all text-xs ${
                            aspectRatio === opt.value
                              ? "bg-indigo-500/20 border-indigo-500 text-white font-medium"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block text-xs font-bold">
                            {opt.label}
                          </span>
                          <span className="block text-[10px] text-indigo-300">
                            {opt.size}
                          </span>
                          <span className="block text-[9px] text-slate-400 mt-0.5 truncate">
                            {opt.platforms}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Girişleri */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ig-price" className="text-slate-300 text-xs">
                      Fiyat *
                    </Label>
                    <Input
                      id="ig-price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="₺4.850.000"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="ig-location"
                      className="text-slate-300 text-xs"
                    >
                      Konum *
                    </Label>
                    <Input
                      id="ig-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Kadıköy, İstanbul"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ig-area" className="text-slate-300 text-xs">
                      Alan (m²)
                    </Label>
                    <Input
                      id="ig-area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="145 m²"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm h-9"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ig-rooms" className="text-slate-300 text-xs">
                      Oda Sayısı
                    </Label>
                    <Input
                      id="ig-rooms"
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                      placeholder="3+1"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ig-floor" className="text-slate-300 text-xs">
                      Kat Bilgisi
                    </Label>
                    <Input
                      id="ig-floor"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="4. Kat"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ig-badge" className="text-slate-300 text-xs">
                      Rozet Etiketi
                    </Label>
                    <Input
                      id="ig-badge"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="SATILIK LÜKS DAİRE"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm h-9"
                    />
                  </div>
                </div>

                {/* Çoklu Platform Metin Alanı (Sahibinden / Instagram / Facebook Sekmeli) */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          { id: "sahibinden", label: "🏠 Sahibinden Metni" },
                          { id: "instagram", label: "📸 Instagram Metni" },
                          { id: "facebook", label: "📘 Facebook Metni" },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSelectPlatform(tab.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            platform === tab.id
                              ? "bg-indigo-600 text-white"
                              : "bg-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateAiCaption(platform)}
                        disabled={generatingCaption || !price}
                        className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2.5 border border-indigo-500/20"
                      >
                        {generatingCaption ? (
                          <>
                            <svg
                              className="w-3 h-3 animate-spin mr-1.5"
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
                            Metin Yazılıyor...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                            AI ile{" "}
                            {platform === "sahibinden"
                              ? "Sahibinden"
                              : platform === "facebook"
                              ? "Facebook"
                              : "Instagram"}{" "}
                            Metni Üret
                          </>
                        )}
                      </Button>

                      {platform !== "sahibinden" && (
                        <button
                          type="button"
                          onClick={handleAddHashtags}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors px-2 py-1"
                        >
                          <Hash className="w-3 h-3" />
                          Hashtag Ekle
                        </button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    id="ig-caption"
                    value={currentCaption}
                    onChange={(e) => setCurrentCaption(e.target.value)}
                    placeholder={
                      platform === "sahibinden"
                        ? "Sahibinden.com ilan açıklamanızı buraya yazın veya 'AI ile Sahibinden Metni Üret' butonunu kullanın..."
                        : platform === "facebook"
                        ? "Facebook / Marketplace paylaşım metninizi buraya yazın veya AI ile üretin..."
                        : "Instagram gönderi açıklamanızı buraya yazın veya AI ile üretin..."
                    }
                    rows={6}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-y text-xs sm:text-sm leading-relaxed"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-white text-xs h-9"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Geri
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4"
                  >
                    Devam Et (Fotoğraflar)
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================================== */}
          {/* ADIM 3 — Mülk Fotoğrafları & Etiket*/}
          {/* ================================== */}
          {step === 3 && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <ImagePlus className="w-5 h-5 text-emerald-400" />
                      Adım 3: Mülk Fotoğrafları &amp; Oda Etiketleri
                    </CardTitle>
                    <p className="text-slate-400 text-xs mt-0.5">
                      İç ve dış mekan fotoğraflarını yükleyin. Dilerseniz her
                      fotoğrafa oda etiketi ekleyin.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs border-white/10 text-slate-400 shrink-0"
                  >
                    {propertyPhotos.length} / 9 fotoğraf
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <input
                  ref={propertyFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePropertyPhotos}
                />

                {/* Fotoğraf Listesi & Etiket Düzenleyici */}
                <div className="space-y-3">
                  {propertyPhotos.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white/3 border border-white/10 rounded-xl"
                    >
                      {/* Küçük Önizleme */}
                      <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={`Mülk Fotoğrafı ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1">
                          <span className="bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {i + 2}. Görsel
                          </span>
                        </div>
                      </div>

                      {/* Etiket Seçici / Girişi */}
                      <div className="flex-1 w-full space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3 text-indigo-400" />
                            Görsel Oda Etiketi (Opsiyonel)
                          </span>
                        </div>
                        <Input
                          value={item.tag}
                          onChange={(e) => updatePhotoTag(i, e.target.value)}
                          placeholder="Örn: Geniş Salon, Açık Mutfak, Teras..."
                          className="bg-white/5 border-white/10 text-white text-xs h-8 placeholder:text-slate-500"
                        />
                        {/* Hızlı Çipler */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {QUICK_ROOM_TAGS.slice(0, 5).map((quickTag) => (
                            <button
                              key={quickTag}
                              type="button"
                              onClick={() => updatePhotoTag(i, quickTag)}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-400 border border-white/5 transition-colors"
                            >
                              + {quickTag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Eylem Butonları */}
                      <div className="flex items-center gap-1 self-end sm:self-center">
                        {i > 0 && (
                          <button
                            onClick={() => movePhotoLeft(i)}
                            className="w-7 h-7 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center hover:bg-white/10 hover:text-white"
                            title="Yukarı/Sola taşı"
                          >
                            <MoveLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {i < propertyPhotos.length - 1 && (
                          <button
                            onClick={() => movePhotoRight(i)}
                            className="w-7 h-7 rounded-lg bg-white/5 text-slate-300 flex items-center justify-center hover:bg-white/10 hover:text-white"
                            title="Aşağı/Sağa taşı"
                          >
                            <MoveRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => removePropertyPhoto(i)}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Fotoğraf Ekleme Kutusu */}
                  {propertyPhotos.length < 9 && (
                    <button
                      onClick={() => propertyFileRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors bg-white/2"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-xs font-medium">
                        Yeni Mülk Fotoğrafı Yükle ({9 - propertyPhotos.length}{" "}
                        kaldı)
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="text-slate-400 hover:text-white text-xs h-9"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Geri
                  </Button>
                  <Button
                    onClick={async () => {
                      setStep(4);
                      setTimeout(() => {
                        handleRenderSlides();
                      }, 250);
                    }}
                    disabled={!canProceedStep3}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4"
                  >
                    Görselleri Oluştur &amp; Önizle
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================================== */}
          {/* ADIM 4 — Önizleme & İndirme        */}
          {/* ================================== */}
          {step === 4 && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    📱 Adım 4: Çoklu Platform Önizleme &amp; İndirme
                  </CardTitle>
                  {slideBlobs.length > 0 && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      {slideBlobs.length} görsel hazır ({aspectRatio})
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
                    <p className="text-white font-medium text-sm">
                      Yüksek çözünürlüklü görseller oluşturuluyor...
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Tuval grafikleri ve tipografi işleniyor
                    </p>
                  </div>
                ) : (
                  <>
                    <InstagramCarouselPreview
                      slides={slideUrls}
                      caption={currentCaption}
                      aspectRatio={aspectRatio}
                      platform={platform}
                      onPlatformChange={(nextP) => {
                        setPlatform(nextP);
                      }}
                    />

                    {slideBlobs.length > 0 && (
                      <div className="space-y-4 pt-2">
                        {/* Ana İndirme Butonu */}
                        <div className="flex flex-wrap justify-center gap-3">
                          <Button
                            onClick={handleDownloadZip}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white h-11 px-6 shadow-lg shadow-emerald-950/30 text-sm font-semibold"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Tüm Paketi İndir (ZIP: Görseller + Metinler)
                          </Button>
                          {currentCaption && (
                            <Button
                              variant="outline"
                              onClick={async () => {
                                await navigator.clipboard.writeText(currentCaption);
                                toast.success("Seçili platform metni kopyalandı!");
                              }}
                              className="border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/10 h-11 px-5 text-sm"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Açıklama Metnini Kopyala
                            </Button>
                          )}
                        </div>

                        {/* Tekil İndirmeler */}
                        <div>
                          <span className="text-slate-400 text-xs font-semibold block mb-2 text-center uppercase tracking-wider">
                            Tek Tek Görsel İndir
                          </span>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {slideBlobs.map((_, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadSingle(i)}
                                className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                {i === 0 ? "Kapak / Vitrin" : `Görsel ${i + 1}`}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(3)}
                    className="text-slate-400 hover:text-white text-xs h-9"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Fotoğrafları Düzenle
                  </Button>
                  <Button
                    onClick={handleRenderSlides}
                    disabled={rendering}
                    variant="ghost"
                    className="text-indigo-400 hover:text-indigo-300 text-xs h-9"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Tekrar Oluştur
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ Sütun: Canlı Önizleme (Sticky Live Preview) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          {step < 4 ? (
            <LiveSlidePreview
              platform={platform}
              onPlatformChange={handleSelectPlatform}
              layoutType={layoutType}
              theme={theme}
              aspectRatio={aspectRatio}
              coverImage={currentLiveCoverImage}
              avatarImage={
                layoutType === "property_focused" ? portraitPreview : null
              }
              price={price}
              location={location}
              area={area}
              rooms={rooms}
              floor={floor}
              badgeText={badgeText}
              agentName={profile?.full_name || "Emlak Danışmanı"}
              officeName={profile?.office_name || undefined}
              phoneNumber={profile?.phone_number || undefined}
              logoUrl={profile?.logo_url || undefined}
            />
          ) : (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
              <span className="text-2xl block">🎉</span>
              <h3 className="text-white font-bold text-sm">
                Çoklu Platform Paketiniz Hazır!
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Sol taraftaki panelden <strong>Sahibinden.com</strong>,{" "}
                <strong>Instagram</strong> ve <strong>Facebook</strong>{" "}
                sekmeleri arasında geçiş yapabilir, görselleri ve metinleri tek
                tıkla indirebilirsiniz.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="border-white/10 text-slate-300 hover:text-white text-xs"
                >
                  Yeni Bir Tasarım Başlat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
