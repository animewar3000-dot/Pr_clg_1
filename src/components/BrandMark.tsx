import type { HTMLAttributes } from 'react';

type BrandMarkProps = HTMLAttributes<HTMLSpanElement> & {
  compact?: boolean;
  inverse?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-11 w-11 rounded-[15px]',
  lg: 'h-14 w-14 rounded-[18px]',
};

export function BrandMark({ compact = false, inverse = false, size = 'md', className = '', ...props }: BrandMarkProps) {
  const stroke = inverse ? '#172B4D' : '#F8F7F2';
  return (
    <span className={`inline-flex shrink-0 items-center gap-3 ${className}`} {...props}>
      <span className={`relative grid shrink-0 place-items-center overflow-hidden ${sizeClasses[size]} ${inverse ? 'bg-white' : 'bg-[#172B4D]'} shadow-[0_8px_22px_rgba(23,43,77,.2)] ring-1 ring-black/5`}>
        <svg viewBox="0 0 48 48" className="relative z-10 h-[82%] w-[82%]" role="img" aria-label="CampOS logo">
          <defs>
            <linearGradient id="campos-roof" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7EA5FF" />
              <stop offset="1" stopColor="#386BE8" />
            </linearGradient>
          </defs>
          <path d="M7.5 20.5 24 7.5l16.5 13" fill="none" stroke="url(#campos-roof)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11.5 20v19h25V20" fill="none" stroke={stroke} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M19 39V26h10v13" fill="none" stroke="#14B8A6" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M15.5 24h17" stroke={stroke} strokeOpacity=".38" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="36.5" cy="11.5" r="3.4" fill="#F5A82E" />
          <circle cx="36.5" cy="11.5" r="5.5" fill="#F5A82E" fillOpacity=".16" />
        </svg>
        <span className="absolute -bottom-4 -right-4 h-8 w-8 rounded-full bg-[#14B8A6]/20 blur-md" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className={`block text-[1.12rem] font-black tracking-[-.055em] ${inverse ? 'text-white' : 'text-[#172B4D]'}`}>Camp<span className="text-[#386BE8]">OS</span></span>
          <span className={`mt-1 block text-[8px] font-extrabold tracking-[.19em] ${inverse ? 'text-white/55' : 'text-slate-500'}`}>CAMPUS OPERATING SYSTEM</span>
        </span>
      )}
    </span>
  );
}