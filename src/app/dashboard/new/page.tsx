"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ResultCards } from "@/components/listing-results/result-cards";

const propertyTypes = [
  { value: "Daire", label: "🏢 Daire" },
  { value: "Villa", label: "🏡 Villa" },
  { value: "Arsa", label: "🌍 Arsa" },
  { value: "İşyeri", label: "🏬 İşyeri" },
  { value: "Diğer", label: "📦 Diğer" },
];

const ozelliklerOptions = [
  "Asansör",
  "Otopark",
  "Güvenlik",
  "Deniz Manzarası",
  "Balkon",
  "Havuz",
  "Bahçe",
  "Akıllı Ev Sistemi",
  "Ebeveyn Banyosu",
  "Giyinme Odası",
  "Teras",
  "Sauna",
  "Spor Salonu",
  "Çocuk Oyun Alanı",
  "Jeneratör",
  "Yangın Merdiveni",
];

const isitmaTipleri = [
  "Doğalgaz (Kombi)",
  "Merkezi Sistem",
  "Yerden Isıtma",
  "Klima",
  "Soba",
  "Diğer",
];

const altyapiOptions = [
  "Elektrik",
  "Su",
  "Doğalgaz",
  "Kanalizasyon",
  "Yol",
  "İnternet",
];

const yakinCevreOptions = [
  "Okul",
  "Hastane",
  "AVM",
  "Metro / Tramvay",
  "Otobüs Durağı",
  "Market",
  "Park / Yeşil Alan",
  "Cami",
  "Eczane",
  "Spor Tesisi",
];

const cepheYonleri = [
  "Kuzey",
  "Güney",
  "Doğu",
  "Batı",
  "Güneydoğu",
  "Güneybatı",
  "Kuzeydoğu",
  "Kuzeybatı",
];

interface ListingResult {
  resmi: string;
  samimi: string;
  kisa: string;
}

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);

  // Form state — Genel
  const [propertyType, setPropertyType] = useState("");
  const [ilanTuru, setIlanTuru] = useState(""); // Kiralık / Satılık
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [mahalle, setMahalle] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  // İletişim
  const [contactPhone, setContactPhone] = useState("");

  // Ortak detaylar (Daire / Villa / İşyeri)
  const [yapıDurumu, setYapıDurumu] = useState("");
  const [cepheYonu, setCepheYonu] = useState("");
  const [esyaDurumu, setEsyaDurumu] = useState("");
  const [krediyeUygun, setKrediyeUygun] = useState("");
  const [takasaAcik, setTakasaAcik] = useState("");
  const [siteIcinde, setSiteIcinde] = useState("");
  const [yakinCevre, setYakinCevre] = useState<string[]>([]);

  // Daire/Villa fields
  const [metrekareNet, setMetrekareNet] = useState("");
  const [metrekareBrut, setMetrekareBrut] = useState("");
  const [odaSayisi, setOdaSayisi] = useState("");
  const [banyoSayisi, setBanyoSayisi] = useState("");
  const [bulunduguKat, setBulunduguKat] = useState("");
  const [katSayisi, setKatSayisi] = useState("");
  const [binaYasi, setBinaYasi] = useState("");
  const [isitmaTipi, setIsitmaTipi] = useState("");
  const [aidat, setAidat] = useState("");
  const [ozellikler, setOzellikler] = useState<string[]>([]);

  // Arsa fields
  const [alan, setAlan] = useState("");
  const [imarDurumu, setImarDurumu] = useState("");
  const [cepheBilgisi, setCepheBilgisi] = useState("");
  const [altyapi, setAltyapi] = useState<string[]>([]);
  const [tapuDurumu, setTapuDurumu] = useState("");

  // İşyeri fields
  const [metrekareIsyeri, setMetrekareIsyeri] = useState("");
  const [katPlaza, setKatPlaza] = useState("");
  const [duzen, setDuzen] = useState("");

  const handleOzellikToggle = (ozellik: string) => {
    setOzellikler((prev) =>
      prev.includes(ozellik)
        ? prev.filter((o) => o !== ozellik)
        : [...prev, ozellik]
    );
  };

  const handleAltyapiToggle = (item: string) => {
    setAltyapi((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleYakinCevreToggle = (item: string) => {
    setYakinCevre((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData: Record<string, unknown> = {
      propertyType,
      ilanTuru,
      location: { il, ilce, mahalle },
      price,
      notes,
      contactPhone,
      yapıDurumu,
      cepheYonu,
      esyaDurumu,
      krediyeUygun,
      takasaAcik,
      siteIcinde,
      yakinCevre,
    };

    // Mülk tipine göre ek alanlar
    if (propertyType === "Daire" || propertyType === "Villa") {
      formData.metpirlareNet = metrekareNet;
      formData.metrekareBrut = metrekareBrut;
      formData.odaSayisi = odaSayisi;
      formData.banyoSayisi = banyoSayisi;
      formData.bulunduguKat = bulunduguKat;
      formData.katSayisi = katSayisi;
      formData.binaYasi = binaYasi;
      formData.isitmaTipi = isitmaTipi;
      formData.aidat = aidat;
      formData.ozellikler = ozellikler;
    } else if (propertyType === "Arsa") {
      formData.alan = alan;
      formData.imarDurumu = imarDurumu;
      formData.cepheBilgisi = cepheBilgisi;
      formData.altyapi = altyapi;
      formData.tapuDurumu = tapuDurumu;
    } else if (propertyType === "İşyeri") {
      formData.metrekare = metrekareIsyeri;
      formData.katPlaza = katPlaza;
      formData.duzen = duzen;
    }

    try {
      const response = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.limitReached) {
          toast.error("Aylık limitinize ulaştınız", {
            description: "Devam etmek için planınızı yükseltin.",
            action: {
              label: "Planları Gör",
              onClick: () => router.push("/pricing"),
            },
          });
        } else {
          toast.error(data.error || "Bir hata oluştu");
        }
        return;
      }

      setResult(data.result);
      toast.success("İlan metni başarıyla oluşturuldu!", {
        description: `Kalan hakkınız: ${data.remainingCount}`,
      });
    } catch {
      toast.error("Bir şeyler ters gitti, lütfen tekrar deneyin");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    handleSubmit(new Event("submit") as unknown as React.FormEvent);
  };

  const showDaireVilla = propertyType === "Daire" || propertyType === "Villa";
  const showArsa = propertyType === "Arsa";
  const showIsyeri = propertyType === "İşyeri";
  const showOrtak = showDaireVilla || showIsyeri || propertyType === "Diğer";

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="text-slate-400 hover:text-white hover:bg-white/5"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Yeni İlan Oluştur</h1>
          <p className="text-slate-400 text-sm mt-1">Mülk bilgilerini girin, AI ilan metninizi yazsın</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ───── Temel Bilgiler ───── */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Temel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Mülk Tipi & İlan Türü */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Mülk Tipi *</Label>
                    <Select value={propertyType} onValueChange={(v) => setPropertyType(v ?? "")} required>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Mülk tipi seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10 focus:bg-white/10">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">İlan Türü *</Label>
                    <Select value={ilanTuru} onValueChange={(v) => setIlanTuru(v ?? "")} required>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Satılık / Kiralık" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="Satılık" className="text-white hover:bg-white/10 focus:bg-white/10">Satılık</SelectItem>
                        <SelectItem value="Kiralık" className="text-white hover:bg-white/10 focus:bg-white/10">Kiralık</SelectItem>
                        <SelectItem value="Devren Satılık" className="text-white hover:bg-white/10 focus:bg-white/10">Devren Satılık</SelectItem>
                        <SelectItem value="Devren Kiralık" className="text-white hover:bg-white/10 focus:bg-white/10">Devren Kiralık</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Konum */}
                <div>
                  <Label className="text-slate-300 mb-2 block">Konum *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="İl" value={il} onChange={(e) => setIl(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    <Input placeholder="İlçe" value={ilce} onChange={(e) => setIlce(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    <Input placeholder="Mahalle" value={mahalle} onChange={(e) => setMahalle(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                  </div>
                </div>

                {/* Fiyat */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Fiyat (TL) *</Label>
                  <Input
                    type="text"
                    placeholder={ilanTuru === "Kiralık" || ilanTuru === "Devren Kiralık" ? "15.000 / ay" : "4.500.000"}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ───── Daire / Villa Detayları ───── */}
            {showDaireVilla && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      {propertyType} Detayları
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Net m²</Label>
                      <Input type="number" placeholder="120" value={metrekareNet} onChange={(e) => setMetrekareNet(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Brüt m²</Label>
                      <Input type="number" placeholder="140" value={metrekareBrut} onChange={(e) => setMetrekareBrut(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Oda Sayısı</Label>
                      <Input placeholder="3+1" value={odaSayisi} onChange={(e) => setOdaSayisi(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Banyo Sayısı</Label>
                      <Input type="number" placeholder="2" value={banyoSayisi} onChange={(e) => setBanyoSayisi(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Bina Yaşı</Label>
                      <Input placeholder="5" value={binaYasi} onChange={(e) => setBinaYasi(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Bulunduğu Kat</Label>
                      <Input placeholder="5" value={bulunduguKat} onChange={(e) => setBulunduguKat(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Toplam Kat</Label>
                      <Input placeholder="10" value={katSayisi} onChange={(e) => setKatSayisi(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Aidat (TL/ay)</Label>
                      <Input type="text" placeholder="1.500" value={aidat} onChange={(e) => setAidat(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Isıtma Tipi</Label>
                      <Select value={isitmaTipi} onValueChange={(v) => setIsitmaTipi(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {isitmaTipleri.map((tip) => (
                            <SelectItem key={tip} value={tip} className="text-white hover:bg-white/10 focus:bg-white/10">
                              {tip}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Cephe Yönü</Label>
                      <Select value={cepheYonu} onValueChange={(v) => setCepheYonu(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {cepheYonleri.map((yon) => (
                            <SelectItem key={yon} value={yon} className="text-white hover:bg-white/10 focus:bg-white/10">
                              {yon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Özellikler */}
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-sm">Özellikler</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ozelliklerOptions.map((ozellik) => (
                        <label
                          key={ozellik}
                          className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                        >
                          <Checkbox
                            checked={ozellikler.includes(ozellik)}
                            onCheckedChange={() => handleOzellikToggle(ozellik)}
                            className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                          />
                          {ozellik}
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ───── Arsa Detayları ───── */}
            {showArsa && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Arsa Detayları
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Alan (m²)</Label>
                      <Input type="number" placeholder="500" value={alan} onChange={(e) => setAlan(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">İmar Durumu</Label>
                      <Input placeholder="Konut imarlı" value={imarDurumu} onChange={(e) => setImarDurumu(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Cephe Bilgisi</Label>
                      <Input placeholder="Güney cephe, 20m" value={cepheBilgisi} onChange={(e) => setCepheBilgisi(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Tapu Durumu</Label>
                      <Input placeholder="Müstakil parsel" value={tapuDurumu} onChange={(e) => setTapuDurumu(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-400 text-sm">Altyapı</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {altyapiOptions.map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                        >
                          <Checkbox
                            checked={altyapi.includes(item)}
                            onCheckedChange={() => handleAltyapiToggle(item)}
                            className="border-white/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ───── İşyeri Detayları ───── */}
            {showIsyeri && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                      İşyeri Detayları
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Metrekare</Label>
                      <Input type="number" placeholder="200" value={metrekareIsyeri} onChange={(e) => setMetrekareIsyeri(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Kat / Plaza</Label>
                      <Input placeholder="3. kat, ABC Plaza" value={katPlaza} onChange={(e) => setKatPlaza(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Düzen</Label>
                      <Select value={duzen} onValueChange={(v) => setDuzen(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="Açık Ofis" className="text-white hover:bg-white/10 focus:bg-white/10">Açık Ofis</SelectItem>
                          <SelectItem value="Kapalı Ofis" className="text-white hover:bg-white/10 focus:bg-white/10">Kapalı Ofis</SelectItem>
                          <SelectItem value="Karma" className="text-white hover:bg-white/10 focus:bg-white/10">Karma</SelectItem>
                          <SelectItem value="Dükkan" className="text-white hover:bg-white/10 focus:bg-white/10">Dükkan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Cephe Yönü</Label>
                      <Select value={cepheYonu} onValueChange={(v) => setCepheYonu(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {cepheYonleri.map((yon) => (
                            <SelectItem key={yon} value={yon} className="text-white hover:bg-white/10 focus:bg-white/10">
                              {yon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ───── Ek Durum Bilgileri (Arsa hariç herkes) ───── */}
            {showOrtak && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Durum Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Yapı Durumu</Label>
                      <Select value={yapıDurumu} onValueChange={(v) => setYapıDurumu(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="Sıfır" className="text-white hover:bg-white/10 focus:bg-white/10">Sıfır (Yeni)</SelectItem>
                          <SelectItem value="İkinci El" className="text-white hover:bg-white/10 focus:bg-white/10">İkinci El</SelectItem>
                          <SelectItem value="Tadilatlı" className="text-white hover:bg-white/10 focus:bg-white/10">Tadilatlı</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Eşya Durumu</Label>
                      <Select value={esyaDurumu} onValueChange={(v) => setEsyaDurumu(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="Eşyalı" className="text-white hover:bg-white/10 focus:bg-white/10">Eşyalı</SelectItem>
                          <SelectItem value="Eşyasız" className="text-white hover:bg-white/10 focus:bg-white/10">Eşyasız</SelectItem>
                          <SelectItem value="Yarı Eşyalı" className="text-white hover:bg-white/10 focus:bg-white/10">Yarı Eşyalı</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Krediye Uygun</Label>
                      <Select value={krediyeUygun} onValueChange={(v) => setKrediyeUygun(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="Evet" className="text-white hover:bg-white/10 focus:bg-white/10">Evet</SelectItem>
                          <SelectItem value="Hayır" className="text-white hover:bg-white/10 focus:bg-white/10">Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Takasa Açık</Label>
                      <Select value={takasaAcik} onValueChange={(v) => setTakasaAcik(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="Evet" className="text-white hover:bg-white/10 focus:bg-white/10">Evet</SelectItem>
                          <SelectItem value="Hayır" className="text-white hover:bg-white/10 focus:bg-white/10">Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Site İçinde</Label>
                      <Select value={siteIcinde} onValueChange={(v) => setSiteIcinde(v ?? "")}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="Evet" className="text-white hover:bg-white/10 focus:bg-white/10">Evet</SelectItem>
                          <SelectItem value="Hayır" className="text-white hover:bg-white/10 focus:bg-white/10">Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ───── Yakın Çevre Olanakları ───── */}
            {propertyType && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Yakın Çevre Olanakları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {yakinCevreOptions.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                      >
                        <Checkbox
                          checked={yakinCevre.includes(item)}
                          onCheckedChange={() => handleYakinCevreToggle(item)}
                          className="border-white/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ───── Ek Notlar & İletişim ───── */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Ek Bilgiler & İletişim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-300">Telefon Numarası</Label>
                  <Input
                    type="tel"
                    placeholder="0532 XXX XX XX"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">Girdiğiniz numara, oluşturulan ilan metninin sonunda yer alacaktır.</p>
                </div>

                <Separator className="bg-white/5" />

                <div className="space-y-2">
                  <Label className="text-slate-300">Ek Notlar</Label>
                  <Textarea
                    placeholder="Öne çıkarmak istediğiniz özellikler, yakın çevredeki olanaklar, özel durumlar vb."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium py-6 text-base shadow-lg shadow-indigo-500/20"
                  disabled={loading || !propertyType || !ilanTuru || !il || !ilce || !price}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      İlan metni oluşturuluyor...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      İlan Metni Oluştur
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Results */}
        <div>
          {loading && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-6">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">AI ilan metninizi yazıyor...</h3>
                  <p className="text-slate-400 text-sm">Bu işlem birkaç saniye sürebilir</p>

                  <div className="mt-8 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-white/5 rounded w-20 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-full mb-1" />
                        <div className="h-3 bg-white/5 rounded w-4/5 mb-1" />
                        <div className="h-3 bg-white/5 rounded w-3/5" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <div className="sticky top-6">
              <ResultCards result={result} onRegenerate={handleRegenerate} />
            </div>
          )}

          {!result && !loading && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-6">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Sonuçlar burada görünecek</h3>
                  <p className="text-slate-400 text-sm">Formu doldurup &quot;İlan Metni Oluştur&quot; butonuna tıklayın</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
