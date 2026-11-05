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

/** One shared CampOS mark used by the landing page, app shell and auth screens. */
export function BrandMark({
  compact = false,
  inverse = false,
  size = 'md',
  className = '',
  ...props
}: BrandMarkProps) {
  return (
    <span className={`inline-flex min-w-0 shrink-0 items-center gap-3 ${className}`} {...props}>
      <span className={`relative block shrink-0 overflow-hidden ${sizeClasses[size]} shadow-[0_6px_18px_rgba(23,43,77,.16)] ring-1 ring-[#172B4D]/10`}>
        <img
          src="/campos-logo.svg"
          alt="CampOS logo"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className={`block text-[1.12rem] font-black tracking-[-.055em] ${inverse ? 'text-white' : 'text-[#172B4D]'}`}>
            Camp<span className="text-[#386BE8]">OS</span>
          </span>
          <span className={`mt-1 block text-[8px] font-extrabold tracking-[.19em] ${inverse ? 'text-white/55' : 'text-slate-500'}`}>
            CAMPUS OPERATING SYSTEM
          </span>
        </span>
      )}
    </span>
  );
}
