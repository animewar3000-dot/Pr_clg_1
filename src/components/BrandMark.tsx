import type { HTMLAttributes } from 'react';

type BrandMarkProps = HTMLAttributes<HTMLSpanElement> & {
  compact?: boolean;
  inverse?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-11 w-11 rounded-[14px]',
  lg: 'h-14 w-14 rounded-2xl',
};

export function BrandMark({ compact = false, inverse = false, size = 'md', className = '', ...props }: BrandMarkProps) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-3 ${className}`} {...props}>
      <span className={`grid shrink-0 place-items-center overflow-hidden ${sizeClasses[size]} ${inverse ? 'bg-white' : 'bg-[#172B4D]'} shadow-[0_5px_16px_rgba(23,43,77,.18)]`}>
        <svg viewBox="0 0 48 48" className="h-[78%] w-[78%]" role="img" aria-label="CampOS mark">
          <path d="M8 20.5 24 8l16 12.5" fill="none" stroke={inverse ? '#172B4D' : '#F8F5EC'} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 21v18h24V21" fill="none" stroke={inverse ? '#172B4D' : '#F8F5EC'} strokeWidth="2.7" strokeLinejoin="round" />
          <path d="M19 39V26h10v13" fill="none" stroke="#14B8A6" strokeWidth="3.4" strokeLinejoin="round" />
          <circle cx="34.5" cy="13.5" r="3.2" fill="#F5A82E" />
        </svg>
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className={`block text-[1.12rem] font-black tracking-[-.045em] ${inverse ? 'text-white' : 'text-[#172B4D]'}`}>Camp<span className="text-[#386BE8]">OS</span></span>
          <span className={`mt-1 block text-[8px] font-extrabold tracking-[.19em] ${inverse ? 'text-white/55' : 'text-slate-500'}`}>CAMPUS OPERATING SYSTEM</span>
        </span>
      )}
    </span>
  );
}
