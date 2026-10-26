import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  legalDocs,
  legalDocIds,
  legalMetadata,
  isLegalDocId,
} from "@/app/legal/content";

export function generateStaticParams() {
  return legalDocIds.map((id) => ({ type: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isLegalDocId(type)) {
    return { title: "Bulunamadı — İlan Asistanı" };
  }
  return legalMetadata(type);
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isLegalDocId(type)) {
    notFound();
  }

  const doc = legalDocs[type];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">


      <article className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="size-4" />Ana sayfaya dön</Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {doc.title}
        </h1>
        <p className="mt-3 text-slate-400 leading-relaxed">{doc.description}</p>
        <p className="mt-2 text-sm text-slate-500">
          Son güncelleme: {doc.lastUpdated}
        </p>

        <div className="mt-10 space-y-10">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-white mb-3">
                {section.heading}
              </h2>
              <div className="space-y-2">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-slate-300 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-sm text-slate-500">
            Sorularınız mı var?{" "}
            <Link
              href="/legal/contact"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Bizimle iletişime geçin
            </Link>
            .
          </p>
        </div>
      </article>


    </div>
  );
}
