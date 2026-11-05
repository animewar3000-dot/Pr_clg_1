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
        <img src="/campos-mark.svg" alt="CampOS logo" className="relative z-10 h-full w-full object-contain" draggable={false} />
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