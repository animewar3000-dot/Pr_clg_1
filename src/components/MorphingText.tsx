import { useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

const MORPH_TIME = 1.25;
const COOLDOWN_TIME = 1.7;
const MAX_FRAME_DELTA = 0.05;

interface MorphingTextProps {
  className?: string;
  texts: string[];
  label?: string;
}

/**
 * Cross-morphs short phrases with an SVG alpha threshold.
 * The animation uses requestAnimationFrame and pauses for reduced-motion users.
 */
function useMorphingText(texts: string[], reducedMotion: boolean) {
  const textIndexRef = useRef(0);
  const morphElapsedRef = useRef(0);
  const cooldownElapsedRef = useRef(0);
  const isMorphingRef = useRef(false);
  const lastFrameRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback((fraction: number) => {
    const current = text1Ref.current;
    const next = text2Ref.current;
    if (!current || !next || texts.length === 0) return;

    const index = textIndexRef.current % texts.length;
    current.textContent = texts[index];
    next.textContent = texts[(index + 1) % texts.length];

    const progress = Math.max(0, Math.min(1, fraction));
    const outgoingBlur = (progress * 8).toFixed(2);
    const incomingBlur = ((1 - progress) * 8).toFixed(2);

    current.style.filter = progress === 0 ? 'none' : `blur(${outgoingBlur}px)`;
    current.style.opacity = String(Math.pow(1 - progress, 0.4));
    next.style.filter = progress === 1 ? 'none' : `blur(${incomingBlur}px)`;
    next.style.opacity = String(Math.pow(progress, 0.4));
  }, [texts]);

  const showCurrentText = useCallback(() => {
    setStyles(0);
  }, [setStyles]);

  useEffect(() => {
    if (!texts.length) return;

    textIndexRef.current = 0;
    morphElapsedRef.current = 0;
    cooldownElapsedRef.current = 0;
    isMorphingRef.current = false;
    lastFrameRef.current = null;
    showCurrentText();

    if (reducedMotion || texts.length < 2) return;

    const animate = (now: number) => {
      if (lastFrameRef.current !== null) {
        const delta = Math.min((now - lastFrameRef.current) / 1000, MAX_FRAME_DELTA);

        if (!isMorphingRef.current) {
          cooldownElapsedRef.current += delta;
          if (cooldownElapsedRef.current >= COOLDOWN_TIME) {
            isMorphingRef.current = true;
            morphElapsedRef.current = 0;
          }
        } else {
          morphElapsedRef.current += delta;
          const progress = Math.min(morphElapsedRef.current / MORPH_TIME, 1);
          setStyles(progress);

          if (progress >= 1) {
            textIndexRef.current = (textIndexRef.current + 1) % texts.length;
            isMorphingRef.current = false;
            cooldownElapsedRef.current = 0;
            morphElapsedRef.current = 0;
            showCurrentText();
          }
        }
      }

      lastFrameRef.current = now;
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
    };
  }, [texts, reducedMotion, setStyles, showCurrentText]);

  return { text1Ref, text2Ref };
}

function SvgFilters() {
  return (
    <svg aria-hidden="true" className="pointer-events-none fixed h-0 w-0" width="0" height="0">
      <defs>
        <filter id="campos-morph-threshold" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 255 -140"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function MorphingText({ texts, className = '', label }: MorphingTextProps) {
  const reducedMotion = useReducedMotion();
  const safeTexts = texts.filter(text => text.trim().length > 0);
  const { text1Ref, text2Ref } = useMorphingText(safeTexts, Boolean(reducedMotion));

  if (!safeTexts.length) return null;

  return (
    <>
      <span
        role="text"
        aria-label={label || safeTexts.join(' · ')}
        className={`relative block h-[1.12em] w-full overflow-visible leading-none [filter:url(#campos-morph-threshold)_blur(0.35px)] ${className}`}
      >
        <span ref={text1Ref} aria-hidden="true" className="absolute inset-x-0 top-0 m-auto block w-full" />
        <span ref={text2Ref} aria-hidden="true" className="absolute inset-x-0 top-0 m-auto block w-full" />
      </span>
      <SvgFilters />
    </>
  );
}
