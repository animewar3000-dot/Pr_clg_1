import type { HTMLAttributes } from 'react';

type BrandMarkProps = HTMLAttributes<HTMLSpanElement> & {
  compact?: boolean;
  inverse?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-9 w-12 rounded-lg',
  md: 'h-11 w-[3.7rem] rounded-xl',
  lg: 'h-14 w-[4.7rem] rounded-2xl',
};

/**
 * The single CampOS brand component.
 * Keep every logo instance pointed at the supplied SVG so the mark stays
 * consistent across the landing page, authenticated shell and navigation.
 */
export function BrandMark({
  compact = false,
  inverse = false,
  size = 'md',
  className = '',
  ...props
}: BrandMarkProps) {
  return (
    <span className={`inline-flex min-w-0 shrink-0 items-center gap-3 ${className}`} {...props}>
      <span className={`relative block shrink-0 overflow-hidden bg-[#F5F5EF] ${sizeClasses[size]} ${inverse ? 'ring-1 ring-white/20' : 'ring-1 ring-[#172B4D]/10'}`}>
        <img
          src="/campos-logo.svg"
          alt="CampOS"
          className="h-full w-full object-cover"
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
