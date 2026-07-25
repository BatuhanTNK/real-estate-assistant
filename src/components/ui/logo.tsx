import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  size = "md",
  showText = true,
  className = "",
  href = "/",
}: LogoProps) {
  // Sizing mapping
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const badgeSizes = {
    sm: "p-1.5 rounded-lg",
    md: "p-2 rounded-xl",
    lg: "p-2.5 rounded-2xl",
    xl: "p-3 rounded-2xl",
  };

  const content = (
    <div className={`inline-flex items-center gap-3 group ${className}`}>
      {/* Icon Badge */}
      <div className="relative">
        {/* Glow effect behind logo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-2xl blur-md opacity-40 group-hover:opacity-80 transition duration-500 group-hover:scale-105" />
        
        {/* Main Logo Container */}
        <div className={`relative ${badgeSizes[size]} bg-slate-900 border border-white/15 shadow-xl flex items-center justify-center`}>
          <svg
            className={`${iconSizes[size]} text-white`}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="roof-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Modern House / Building Icon with AI Sparkles */}
            {/* Building Silhouette */}
            <path
              d="M20 5L6 16V34C6 35.1046 6.89543 36 8 36H32C33.1046 36 34 35.1046 34 34V16L20 5Z"
              fill="url(#logo-grad)"
              fillOpacity="0.15"
              stroke="url(#logo-grad)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner Modern Structure */}
            <path
              d="M14 36V22C14 20.8954 14.8954 20 16 20H24C25.1046 20 26 20.8954 26 22V36"
              stroke="url(#roof-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Window Grid Lines */}
            <circle cx="20" cy="14" r="2.5" fill="url(#logo-grad)" />

            {/* AI Sparkle Star Top Right */}
            <path
              d="M31 6C31 8.5 32.5 10 35 10C32.5 10 31 11.5 31 14C31 11.5 29.5 10 27 10C29.5 10 31 8.5 31 6Z"
              fill="#34d399"
            />
          </svg>
        </div>
      </div>

      {/* Brand Name Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-extrabold tracking-tight text-white flex items-center gap-1.5`}>
            İlan
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Asistanı
            </span>
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
