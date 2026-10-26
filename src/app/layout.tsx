import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "İlan Asistanı — Yapay Zeka ile Emlak İlan Metni Oluşturun",
  description:
    "Mülk bilgilerinizi girin, yapay zeka destekli İlan Asistanı ile saniyeler içinde 3 farklı tonda profesyonel emlak ilan metni oluşturun. Emlakçılar için otomatik ilan yazma aracı.",
  keywords:
    "emlak ilan metni yazma, otomatik ilan oluşturma, emlak ilan asistanı, yapay zeka ilan yazma, emlakçı araçları",
  openGraph: {
    title: "İlan Asistanı — Yapay Zeka ile Emlak İlan Metni Oluşturun",
    description:
      "Saniyeler içinde 3 farklı tonda profesyonel emlak ilan metni oluşturun.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className="dark h-full antialiased">
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-slate-950 text-white"
      >
        <a href="#main-content" className="skip-link">Ana içeriğe geç</a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
