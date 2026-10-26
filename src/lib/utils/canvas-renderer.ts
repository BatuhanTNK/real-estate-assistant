/**
 * Canvas-based Instagram slide renderer.
 * 1080×1350 (4:5 dikey) veya 1080×1080 (1:1 kare) formatında slaytlar çizer.
 * Client-side DOM Canvas API kullanır.
 */

export type SlideTheme = "modern_dark" | "gold_luxury" | "clean_glass";
export type AspectRatio = "4:5" | "1:1";
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

function getDimensions(aspectRatio: AspectRatio = "4:5") {
  return aspectRatio === "1:1"
    ? { width: 1080, height: 1080 }
    : { width: 1080, height: 1350 };
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

  // Dış Halka / Çerçeve
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

  const { width, height } = getDimensions(options.aspectRatio);
  const theme = options.theme || "modern_dark";
  const layoutType = options.layoutType || "property_focused";
  const mainImageSrc =
    options.coverImageSrc || options.portraitSrc || "";

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
    const gradientH = height * (layoutType === "agent_focused" ? 0.58 : 0.62);
    const gradient = ctx.createLinearGradient(0, height - gradientH, 0, height);
    gradient.addColorStop(0, "rgba(2, 6, 23, 0)");
    gradient.addColorStop(0.35, "rgba(2, 6, 23, 0.72)");
    gradient.addColorStop(1, "rgba(2, 6, 23, 0.98)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - gradientH, width, gradientH);
  } else if (theme === "gold_luxury") {
    const gradientH = height * 0.64;
    const gradient = ctx.createLinearGradient(0, height - gradientH, 0, height);
    gradient.addColorStop(0, "rgba(15, 23, 42, 0)");
    gradient.addColorStop(0.35, "rgba(15, 23, 42, 0.82)");
    gradient.addColorStop(1, "rgba(10, 15, 26, 0.98)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - gradientH, width, gradientH);

    // Üst İnce Altın Çizgi
    const goldGrad = ctx.createLinearGradient(0, 0, width, 0);
    goldGrad.addColorStop(0, "#fbbf24");
    goldGrad.addColorStop(0.5, "#fef08a");
    goldGrad.addColorStop(1, "#d97706");
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, width, 8);
  } else if (theme === "clean_glass") {
    const cardH = height * (options.aspectRatio === "1:1" ? 0.48 : 0.44);
    const padX = 48;
    const cardY = height - cardH - 44;
    const cardW = width - padX * 2;

    ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
    ctx.beginPath();
    ctx.roundRect(cardXFallback(padX, cardY), cardY, cardW, cardH, 24);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.stroke();
  }

  function cardXFallback(padX: number, cardY: number) {
    return cardY > 0 ? padX : 30;
  }

  // 3. Bilgi Metinleri & Rozet
  const pad = 56;
  const { overlay } = options;

  // Özel Rozet (Badge - örn SATILIK LÜKS VİLLA)
  const isSquare = options.aspectRatio === "1:1";
  const badgeY = height - (isSquare ? 350 : 410);

  if (overlay.badgeText) {
    ctx.font = "bold 22px Inter, system-ui, sans-serif";
    const badgeText = overlay.badgeText.toUpperCase();
    const badgeW = ctx.measureText(badgeText).width + 32;
    const badgeH = 38;

    ctx.fillStyle =
      theme === "gold_luxury"
        ? "#d97706"
        : theme === "clean_glass"
        ? "#6366f1"
        : "#4f46e5";
    ctx.beginPath();
    ctx.roundRect(pad, badgeY, badgeW, badgeH, 12);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, pad + 16, badgeY + badgeH / 2);
  }

  // Fiyat
  const priceY = height - (isSquare ? 260 : 310);
  ctx.textBaseline = "bottom";
  ctx.font = "bold 66px Inter, Outfit, system-ui, sans-serif";
  ctx.fillStyle = theme === "gold_luxury" ? "#fef08a" : "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.fillText(overlay.price || "Fiyat Belirtilmedi", pad, priceY);

  // Detaylar Satırı (Konum • m² • Oda • Kat)
  const detailY = priceY + 44;
  ctx.shadowBlur = 0;
  ctx.font = "500 30px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";

  const detailsParts = [
    overlay.location ? `📍 ${overlay.location}` : null,
    overlay.area ? `📐 ${overlay.area}` : null,
    overlay.rooms ? `🚪 ${overlay.rooms}` : null,
    overlay.floor ? `🏢 ${overlay.floor}` : null,
  ].filter(Boolean);

  ctx.fillText(detailsParts.join("   •   "), pad, detailY);

  // Ayırıcı Çizgi
  const lineY = detailY + 28;
  ctx.fillStyle =
    theme === "gold_luxury"
      ? "rgba(245, 158, 11, 0.4)"
      : "rgba(255,255,255,0.18)";
  ctx.fillRect(pad, lineY, width - pad * 2, 2);

  // Footer: Danışman / Ofis / Avatar
  const footerY = lineY + 36;

  // Eğer Mülk Odaklı Kapak ve Avatar Varsa, Footer'da veya Sağ Köşede Avatar Çiz
  if (layoutType === "property_focused" && options.avatarSrc) {
    try {
      const avatarImg = await loadImage(options.avatarSrc);
      const avatarRadius = 42;
      const avatarX = pad + avatarRadius;
      const avatarY = footerY + avatarRadius - 8;

      const ringColor =
        theme === "gold_luxury"
          ? "#f59e0b"
          : theme === "clean_glass"
          ? "#818cf8"
          : "#6366f1";
      drawCircularImage(ctx, avatarImg, avatarX, avatarY, avatarRadius, ringColor, 3.5);

      // Metinleri avatarın sağına yaz
      const textLeft = pad + avatarRadius * 2 + 24;
      ctx.font = "600 28px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.textBaseline = "top";
      ctx.fillText(overlay.agentName || "Emlak Danışmanı", textLeft, footerY);

      if (overlay.officeName || overlay.phone) {
        ctx.font = "400 21px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        const officeLine = [overlay.officeName, overlay.phone]
          .filter(Boolean)
          .join(" • ");
        ctx.fillText(officeLine, textLeft, footerY + 34);
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
      ctx.font = "600 28px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.fillText(overlay.agentName || "Emlak Danışmanı", pad, footerY);

      if (overlay.officeName || overlay.phone) {
        ctx.font = "400 22px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        const sub = [overlay.officeName, overlay.phone].filter(Boolean).join(" • ");
        ctx.fillText(sub, pad, footerY + 34);
      }
    } else {
      // Minimal Kurumsal
      ctx.font = "700 28px Inter, system-ui, sans-serif";
      ctx.fillStyle = theme === "gold_luxury" ? "#fef08a" : "rgba(255,255,255,0.95)";
      ctx.fillText(overlay.officeName || "Gayrimenkul & Danışmanlık", pad, footerY);

      if (overlay.phone) {
        ctx.font = "500 22px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(`İletişim: ${overlay.phone}`, pad, footerY + 34);
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

  // Canvas → Blob
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

    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 26);
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
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
        theme === "gold_luxury" ? "#fef08a" : "rgba(255,255,255,0.94)";
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
