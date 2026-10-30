/**
 * Canvas-based Multi-Platform (Sahibinden, Instagram, Facebook) slide renderer.
 * Supports:
 * - 4:5 (1080×1350 — Instagram / Facebook Dikey)
 * - 1:1 (1080×1080 — Instagram / Facebook Kare)
 * - 4:3 (1200×900  — Sahibinden.com Standart İlan Görseli)
 * - 16:9 (1600×900 — Sahibinden Vitrin / Facebook Yatay Paylaşım)
 * - 9:16 (1080×1920 — Instagram / Facebook Story & Reels)
 * Client-side DOM Canvas API kullanır.
 */

export type StudioPlatform = "instagram" | "facebook" | "sahibinden";
export type SlideTheme = "modern_dark" | "gold_luxury" | "clean_glass" | "sahibinden_vitrin";
export type AspectRatio = "4:5" | "1:1" | "4:3" | "16:9" | "9:16";
export type CoverLayoutType = "property_focused" | "agent_focused" | "minimal_corporate";

export interface CoverSlideOptions {
  /** Kapak ana görseli (mülk veya portre) */
  coverImageSrc?: string;
  /** Portre görsel (Geriye dönük uyumluluk veya agent_focused modu için) */
  portraitSrc?: string;
  /** Dairesel rozet olarak kullanılacak emlakçı avatarı (property_focused modu) */
  avatarSrc?: string;
  /** Kapak düzeni */
  layoutType?: CoverLayoutType;
  /** Mülk bilgileri overlay */
  overlay: {
    price: string;
    location: string;
    area: string; // ör. "120 m²"
    rooms?: string; // ör. "3+1"
    floor?: string; // ör. "4. Kat"
    badgeText?: string; // ör. "FIRSAT İLAN" veya "SATILIK VİLLA"
    agentName?: string;
    officeName?: string;
    logoUrl?: string;
    phone?: string;
  };
  /** Tema seçimi */
  theme?: SlideTheme;
  /** Çıktı boyutu */
  aspectRatio?: AspectRatio;
}

export interface PropertySlideOptions {
  /** Mülk fotoğrafı data URL */
  photoSrc: string;
  /** Slayt oda / alan etiketi (örn: "Geniş Salon", "Açık Mutfak", "Teras") */
  tag?: string;
  /** Alt bilgi çubuğu */
  brand?: {
    officeName?: string;
    phone?: string;
  };
  /** Tema seçimi */
  theme?: SlideTheme;
  /** Çıktı boyutu */
  aspectRatio?: AspectRatio;
}

export function getDimensions(aspectRatio: AspectRatio = "4:5") {
  switch (aspectRatio) {
    case "1:1":
      return { width: 1080, height: 1080 };
    case "4:3":
      return { width: 1200, height: 900 };
    case "16:9":
      return { width: 1600, height: 900 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "4:5":
    default:
      return { width: 1080, height: 1350 };
  }
}

/**
 * Verilen src'yi bir HTMLImageElement olarak yükler.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi"));
    img.src = src;
  });
}

/**
 * Görseli canvas'a "cover" modu ile çizer (kırparak doldurur).
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;

  if (imgRatio > targetRatio) {
    sw = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Dairesel kırpılmış görsel çizer.
 */
function drawCircularImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  centerX: number,
  centerY: number,
  radius: number,
  borderColor: string = "rgba(255, 255, 255, 0.9)",
  borderWidth: number = 4
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const d = radius * 2;
  ctx.drawImage(img, centerX - radius, centerY - radius, d, d);
  ctx.restore();

  if (borderWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + borderWidth / 2, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Kapak slaytını render eder.
 */
export async function renderCoverSlide(
  options: CoverSlideOptions
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Font hazır olmasa da devam et
    }
  }

  const ratio = options.aspectRatio || "4:5";
  const { width, height } = getDimensions(ratio);
  const isLandscape = ratio === "4:3" || ratio === "16:9";
  const isSquare = ratio === "1:1";
  const theme = options.theme || "modern_dark";
  const layoutType = options.layoutType || "property_focused";
  const mainImageSrc = options.coverImageSrc || options.portraitSrc || "";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 1. Ana Arka Plan Görseli — cover
  if (mainImageSrc) {
    try {
      const mainImg = await loadImage(mainImageSrc);
      drawImageCover(ctx, mainImg, 0, 0, width, height);
    } catch (e) {
      console.warn("Ana kapak görseli yüklenemedi:", e);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Tema Temelli Gradient / Overlay Çizimi
  if (theme === "modern_dark") {
    const gradientH =
      height * (isLandscape ? 0.68 : layoutType === "agent_focused" ? 0.58 : 0.62);
    const gradient = ctx.createLinearGradient(0, height - gradientH, 0, height);
    gradient.addColorStop(0, "rgba(2, 6, 23, 0)");
    gradient.addColorStop(0.35, "rgba(2, 6, 23, 0.72)");
    gradient.addColorStop(1, "rgba(2, 6, 23, 0.98)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - gradientH, width, gradientH);
  } else if (theme === "gold_luxury" || theme === "sahibinden_vitrin") {
    const gradientH = height * (isLandscape ? 0.7 : 0.64);
    const gradient = ctx.createLinearGradient(0, height - gradientH, 0, height);
    gradient.addColorStop(0, "rgba(15, 23, 42, 0)");
    gradient.addColorStop(0.35, "rgba(15, 23, 42, 0.84)");
    gradient.addColorStop(1, "rgba(10, 15, 26, 0.98)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - gradientH, width, gradientH);

    // Üst Şerit (Altın veya Sahibinden Sarısı)
    const topGrad = ctx.createLinearGradient(0, 0, width, 0);
    if (theme === "sahibinden_vitrin") {
      topGrad.addColorStop(0, "#facc15");
      topGrad.addColorStop(0.5, "#fde047");
      topGrad.addColorStop(1, "#eab308");
    } else {
      topGrad.addColorStop(0, "#fbbf24");
      topGrad.addColorStop(0.5, "#fef08a");
      topGrad.addColorStop(1, "#d97706");
    }
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, 10);
  } else if (theme === "clean_glass") {
    const cardH =
      height * (isLandscape ? 0.52 : isSquare ? 0.48 : 0.44);
    const padX = 48;
    const cardY = height - cardH - (isLandscape ? 32 : 44);
    const cardW = width - padX * 2;

    ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
    ctx.beginPath();
    ctx.roundRect(cardY > 0 ? padX : 30, cardY, cardW, cardH, 24);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.stroke();
  }

  // 3. Bilgi Metinleri & Rozet
  const pad = isLandscape ? 52 : 56;
  const { overlay } = options;

  const badgeY =
    height - (isLandscape ? 305 : isSquare ? 350 : 410);

  if (overlay.badgeText) {
    ctx.font = `bold ${isLandscape ? 20 : 22}px Inter, system-ui, sans-serif`;
    const badgeText = overlay.badgeText.toUpperCase();
    const badgeW = ctx.measureText(badgeText).width + 32;
    const badgeH = isLandscape ? 34 : 38;

    ctx.fillStyle =
      theme === "sahibinden_vitrin"
        ? "#facc15"
        : theme === "gold_luxury"
        ? "#d97706"
        : theme === "clean_glass"
        ? "#6366f1"
        : "#4f46e5";
    ctx.beginPath();
    ctx.roundRect(pad, badgeY, badgeW, badgeH, 10);
    ctx.fill();

    ctx.fillStyle = theme === "sahibinden_vitrin" ? "#0f172a" : "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, pad + 16, badgeY + badgeH / 2);
  }

  // Fiyat
  const priceY =
    height - (isLandscape ? 220 : isSquare ? 260 : 310);
  ctx.textBaseline = "bottom";
  ctx.font = `bold ${isLandscape ? 58 : 66}px Inter, Outfit, system-ui, sans-serif`;
  ctx.fillStyle =
    theme === "sahibinden_vitrin"
      ? "#fde047"
      : theme === "gold_luxury"
      ? "#fef08a"
      : "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.fillText(overlay.price || "Fiyat Belirtilmedi", pad, priceY);

  // Detaylar Satırı (Konum • m² • Oda • Kat)
  const detailY = priceY + (isLandscape ? 38 : 44);
  ctx.shadowBlur = 0;
  ctx.font = `500 ${isLandscape ? 26 : 30}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";

  const detailsParts = [
    overlay.location ? `📍 ${overlay.location}` : null,
    overlay.area ? `📐 ${overlay.area}` : null,
    overlay.rooms ? `🚪 ${overlay.rooms}` : null,
    overlay.floor ? `🏢 ${overlay.floor}` : null,
  ].filter(Boolean);

  ctx.fillText(detailsParts.join("   •   "), pad, detailY);

  // Ayırıcı Çizgi
  const lineY = detailY + (isLandscape ? 22 : 28);
  ctx.fillStyle =
    theme === "sahibinden_vitrin"
      ? "rgba(250, 204, 21, 0.45)"
      : theme === "gold_luxury"
      ? "rgba(245, 158, 11, 0.4)"
      : "rgba(255,255,255,0.18)";
  ctx.fillRect(pad, lineY, width - pad * 2, 2);

  // Footer: Danışman / Ofis / Avatar
  const footerY = lineY + (isLandscape ? 26 : 36);

  if (layoutType === "property_focused" && options.avatarSrc) {
    try {
      const avatarImg = await loadImage(options.avatarSrc);
      const avatarRadius = isLandscape ? 36 : 42;
      const avatarX = pad + avatarRadius;
      const avatarY = footerY + avatarRadius - 8;

      const ringColor =
        theme === "sahibinden_vitrin"
          ? "#facc15"
          : theme === "gold_luxury"
          ? "#f59e0b"
          : theme === "clean_glass"
          ? "#818cf8"
          : "#6366f1";
      drawCircularImage(ctx, avatarImg, avatarX, avatarY, avatarRadius, ringColor, 3.5);

      const textLeft = pad + avatarRadius * 2 + 24;
      ctx.font = `600 ${isLandscape ? 25 : 28}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.textBaseline = "top";
      ctx.fillText(overlay.agentName || "Emlak Danışmanı", textLeft, footerY);

      if (overlay.officeName || overlay.phone) {
        ctx.font = `400 ${isLandscape ? 19 : 21}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        const officeLine = [overlay.officeName, overlay.phone]
          .filter(Boolean)
          .join(" • ");
        ctx.fillText(officeLine, textLeft, footerY + 32);
      }
    } catch (e) {
      console.warn("Avatar yüklenemedi:", e);
      drawDefaultFooterText();
    }
  } else {
    drawDefaultFooterText();
  }

  function drawDefaultFooterText() {
    ctx.textBaseline = "top";
    if (layoutType !== "minimal_corporate") {
      ctx.font = `600 ${isLandscape ? 25 : 28}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.fillText(overlay.agentName || "Emlak Danışmanı", pad, footerY);

      if (overlay.officeName || overlay.phone) {
        ctx.font = `400 ${isLandscape ? 20 : 22}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        const sub = [overlay.officeName, overlay.phone].filter(Boolean).join(" • ");
        ctx.fillText(sub, pad, footerY + 32);
      }
    } else {
      ctx.font = `700 ${isLandscape ? 25 : 28}px Inter, system-ui, sans-serif`;
      ctx.fillStyle =
        theme === "sahibinden_vitrin"
          ? "#fde047"
          : theme === "gold_luxury"
          ? "#fef08a"
          : "rgba(255,255,255,0.95)";
      ctx.fillText(overlay.officeName || "Gayrimenkul & Danışmanlık", pad, footerY);

      if (overlay.phone) {
        ctx.font = `500 ${isLandscape ? 20 : 22}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(`İletişim: ${overlay.phone}`, pad, footerY + 32);
      }
    }
  }

  // Logo (Varsa sağ alt köşe)
  if (overlay.logoUrl) {
    try {
      const logoImg = await loadImage(overlay.logoUrl);
      const logoH = 48;
      const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
      ctx.drawImage(logoImg, width - pad - logoW, lineY + 16, logoW, logoH);
    } catch {
      // Logo yüklenemezse sessizce geç
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Slayt oluşturulamadı"));
      },
      "image/png",
      1
    );
  });
}

/**
 * Mülk fotoğrafı slaytını render eder.
 */
export async function renderPropertySlide(
  options: PropertySlideOptions
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // font bypass
    }
  }

  const { width, height } = getDimensions(options.aspectRatio);
  const theme = options.theme || "modern_dark";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 1. Mülk fotoğrafı — cover
  const photoImg = await loadImage(options.photoSrc);
  drawImageCover(ctx, photoImg, 0, 0, width, height);

  // 2. Oda / Alan Etiketi (Opsiyonel şık buzlu cam rozet)
  if (options.tag && options.tag.trim()) {
    const pad = 44;
    ctx.font = "600 26px Inter, system-ui, sans-serif";
    const tagText = options.tag.trim();
    const tagW = ctx.measureText(tagText).width + 44;
    const tagH = 52;
    const tagX = pad;
    const tagY = pad;

    ctx.fillStyle =
      theme === "sahibinden_vitrin"
        ? "rgba(250, 204, 21, 0.92)"
        : "rgba(15, 23, 42, 0.78)";
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 26);
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle =
      theme === "sahibinden_vitrin"
        ? "rgba(15, 23, 42, 0.35)"
        : "rgba(255, 255, 255, 0.25)";
    ctx.stroke();

    ctx.fillStyle = theme === "sahibinden_vitrin" ? "#0f172a" : "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(tagText, tagX + 22, tagY + tagH / 2);
  }

  // 3. Alt marka çubuğu
  if (options.brand?.officeName || options.brand?.phone) {
    const barHeight = 85;
    const barGradient = ctx.createLinearGradient(
      0,
      height - barHeight * 1.8,
      0,
      height
    );
    barGradient.addColorStop(0, "rgba(0,0,0,0)");
    barGradient.addColorStop(0.5, "rgba(2, 6, 23, 0.6)");
    barGradient.addColorStop(1, "rgba(2, 6, 23, 0.92)");
    ctx.fillStyle = barGradient;
    ctx.fillRect(0, height - barHeight * 1.8, width, barHeight * 1.8);

    const pad = 44;
    ctx.textBaseline = "bottom";

    if (options.brand.officeName) {
      ctx.font = "600 26px Inter, system-ui, sans-serif";
      ctx.fillStyle =
        theme === "sahibinden_vitrin"
          ? "#fde047"
          : theme === "gold_luxury"
          ? "#fef08a"
          : "rgba(255,255,255,0.94)";
      ctx.fillText(options.brand.officeName, pad, height - 30);
    }

    if (options.brand.phone) {
      ctx.font = "500 24px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      const phoneWidth = ctx.measureText(options.brand.phone).width;
      ctx.fillText(options.brand.phone, width - pad - phoneWidth, height - 30);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Slayt oluşturulamadı"));
      },
      "image/png",
      1
    );
  });
}
