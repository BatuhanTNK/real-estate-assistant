import Link from "next/link";
import type { MouseEventHandler } from "react";

interface LogoProps { size?: "sm" | "md" | "lg" | "xl"; showText?: boolean; className?: string; href?: string; onClick?: MouseEventHandler<HTMLAnchorElement>; }
export function Logo({ size = "md", showText = true, className = "", href = "/", onClick }: LogoProps) {
  const sizes = { sm: "size-7", md: "size-8", lg: "size-10", xl: "size-12" };
  const textSizes = { sm: "text-base", md: "text-lg", lg: "text-xl", xl: "text-2xl" };
  const content = <span className={"inline-flex items-center gap-2.5 " + className}>
    <span className={sizes[size] + " flex shrink-0 items-center justify-center rounded-lg border border-[#788f77]/40 bg-[#26382c] text-[#bdd7bd]"}>
      <svg className="h-[65%] w-[65%]" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M5 15 16 6l11 9M8 13v14h16V13M13 27v-9h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 3v6M21 6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
    {showText && <span className={textSizes[size] + " font-medium tracking-tight text-[#f3f3ed]"}>İlan<span className="font-normal text-[#b4c4b3]"> Asistanı</span><span className="sr-only"> — Ana sayfa</span></span>}
  </span>;
  return href ? <Link href={href} onClick={onClick} aria-label="İlan Asistanı — Ana sayfa">{content}</Link> : content;
}
