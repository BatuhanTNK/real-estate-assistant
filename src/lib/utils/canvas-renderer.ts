/**
 * Canvas-based Instagram slide renderer.
 * 1080×1350 (4:5 dikey) veya 1080×1080 (1:1 kare) formatında slaytlar çizer.
 * Client-side DOM Canvas API kullanır.
 */

export type SlideTheme = "modern_dark" | "gold_luxury" | "clean_glass";
export type AspectRatio = "4:5" | "1:1";

export interface CoverSlideOptions {
  /** Portre görsel (HTMLImageElement veya data URL) */
  portraitSrc: string;
  /** Mülk bilgileri overlay */
  overlay: {
    price: string;
    location: string;
    area: string; // ör. "120 m²"
    rooms?: string; // ör. "3+1"
    floor?: string; // ör. "4. Kat"
    badgeText?: string; // ör. "FIRSAT İLAN" veya "SATILIK VİLLA"
    agentName: string;
    officeName?: string;
    logoUrl?: string;
  };
  /** Tema seçimi */
  theme?: SlideTheme;
  /** Çıktı boyutu */
  aspectRatio?: AspectRatio;
}

export interface PropertySlideOptions {
  /** Mülk fotoğrafı data URL */
  photoSrc: string;
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
 * Kapak slaytını render eder.
 */
export async function renderCoverSlide(
  options: CoverSlideOptions
): Promise<Blob> {
  const { width, height } = getDimensions(options.aspectRatio);
  const theme = options.theme || "modern_dark";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 1. Portre görsel — cover
  const portraitImg = await loadImage(options.portraitSrc);
  drawImageCover(ctx, portraitImg, 0, 0, width, height);

  // 2. Tema Temelli Gradient / Overlay Çizimi
  if (theme === "modern_dark") {
    // Koyu Alt Gradient
    const gradientH = height * 0.58;
    const gradient = ctx.createLinearGradient(0, height - gradientH, 0, height);
    gradient.addColorStop(0, "rgba(2, 6, 23, 0)");
    gradient.addColorStop(0.35, "rgba(2, 6, 23, 0.65)");
    gradient.addColorStop(1, "rgba(2, 6, 23, 0.96)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - gradientH, width, gradientH);
  } else if (theme === "gold_luxury") {
    // Lüks Altın & Siyah Gradient
    const gradientH = height * 0.6;
    const gradient = ctx.createLinearGradient(0, height - gradientH, 0, height);
    gradient.addColorStop(0, "rgba(15, 23, 42, 0)");
    gradient.addColorStop(0.4, "rgba(15, 23, 42, 0.75)");
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
    // Minimalist Cam (Frosted Glass) Kart Overlay
    const cardH = height * 0.44;
    const padX = 48;
    const cardY = height - cardH - 48;
    const cardW = width - padX * 2;

    // Cam Arka Plan
    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.beginPath();
    ctx.roundRect(cardY > 0 ? padX : 30, cardY, cardW, cardH, 24);
    ctx.fill();

    // Cam Kenarlık
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.stroke();
  }

  // 3. Bilgi Metinleri
  const pad = 56;
  const { overlay } = options;

  // Özel Rozet (Badge - örn SATILIK VİLLA)
  if (overlay.badgeText) {
    ctx.font = "bold 22px Inter, system-ui, sans-serif";
    const badgeText = overlay.badgeText.toUpperCase();
    const badgeW = ctx.measureText(badgeText).width + 32;
    const badgeH = 38;
    const badgeY = height - (options.aspectRatio === "1:1" ? 340 : 390);

    ctx.fillStyle = theme === "gold_luxury" ? "#d97706" : "#6366f1";
    ctx.beginPath();
    ctx.roundRect(pad, badgeY, badgeW, badgeH, 12);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, pad + 16, badgeY + badgeH / 2);
  }

  // Fiyat
  const priceY = height - (options.aspectRatio === "1:1" ? 250 : 290);
  ctx.textBaseline = "bottom";
  ctx.font = "bold 68px Inter, Outfit, system-ui, sans-serif";
  ctx.fillStyle = theme === "gold_luxury" ? "#fef08a" : "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.fillText(overlay.price, pad, priceY);

  // Detaylar Satırı (Konum • m² • Oda • Kat)
  const detailY = priceY + 46;
  ctx.shadowBlur = 0;
  ctx.font = "500 32px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";

  const detailsParts = [
    `📍 ${overlay.location}`,
    overlay.area ? `📐 ${overlay.area}` : null,
    overlay.rooms ? `🚪 ${overlay.rooms}` : null,
    overlay.floor ? `🏢 ${overlay.floor}` : null,
  ].filter(Boolean);

  ctx.fillText(detailsParts.join("   •   "), pad, detailY);

  // Ayırıcı Çizgi
  const lineY = detailY + 30;
  ctx.fillStyle =
    theme === "gold_luxury"
      ? "rgba(245, 158, 11, 0.4)"
      : "rgba(255,255,255,0.18)";
  ctx.fillRect(pad, lineY, width - pad * 2, 2);

  // Emlakçı Adı & Ofis Bilgisi
  const footerY = lineY + 45;
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.fillText(overlay.agentName, pad, footerY);

  if (overlay.officeName) {
    ctx.font = "400 22px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(overlay.officeName, pad, footerY + 28);
  }

  // Logo (Varsa sağ alt köşe)
  if (overlay.logoUrl) {
    try {
      const logoImg = await loadImage(overlay.logoUrl);
      const logoH = 46;
      const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
      ctx.drawImage(logoImg, width - pad - logoW, lineY + 20, logoW, logoH);
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
  const { width, height } = getDimensions(options.aspectRatio);
  const theme = options.theme || "modern_dark";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 1. Mülk fotoğrafı — cover
  const photoImg = await loadImage(options.photoSrc);
  drawImageCover(ctx, photoImg, 0, 0, width, height);

  // 2. Alt marka çubuğu
  if (options.brand?.officeName || options.brand?.phone) {
    const barHeight = 80;
    const barGradient = ctx.createLinearGradient(
      0,
      height - barHeight * 1.8,
      0,
      height
    );
    barGradient.addColorStop(0, "rgba(0,0,0,0)");
    barGradient.addColorStop(0.5, "rgba(2, 6, 23, 0.5)");
    barGradient.addColorStop(1, "rgba(2, 6, 23, 0.88)");
    ctx.fillStyle = barGradient;
    ctx.fillRect(0, height - barHeight * 1.8, width, barHeight * 1.8);

    const pad = 44;
    ctx.textBaseline = "bottom";

    if (options.brand.officeName) {
      ctx.font = "600 26px Inter, system-ui, sans-serif";
      ctx.fillStyle = theme === "gold_luxury" ? "#fef08a" : "rgba(255,255,255,0.92)";
      ctx.fillText(options.brand.officeName, pad, height - 28);
    }

    if (options.brand.phone) {
      ctx.font = "500 24px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      const phoneWidth = ctx.measureText(options.brand.phone).width;
      ctx.fillText(options.brand.phone, width - pad - phoneWidth, height - 28);
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
