import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-slate-950 text-white"
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
