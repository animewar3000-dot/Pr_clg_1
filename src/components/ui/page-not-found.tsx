import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, Home, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../BrandMark';

type Particle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  hue: 'blue' | 'mint';
};

function CircleAnimation({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let particles: Particle[] = [];

    const makeParticles = () => {
      const count = width < 640 ? 48 : 108;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1 + Math.random() * 2.2,
        speed: 0.12 + Math.random() * 0.32,
        alpha: 0.12 + Math.random() * 0.35,
        hue: Math.random() > 0.72 ? 'mint' : 'blue',
      }));
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      makeParticles();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = particle.hue === 'mint'
          ? `rgba(92, 221, 195, ${particle.alpha})`
          : `rgba(102, 145, 255, ${particle.alpha})`;
        context.fill();

        if (!reducedMotion) {
          particle.x -= particle.speed;
          particle.y += Math.sin((particle.x + particle.y) * 0.006) * 0.08;
          if (particle.x < -8) {
            particle.x = width + 8;
            particle.y = Math.random() * height;
          }
        }
      }

      if (!reducedMotion) frameId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    const handleResize = () => {
      resize();
      if (reducedMotion) draw();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

function StickFigure({ variant = 0 }: { variant?: number }) {
  const accent = variant % 2 === 0 ? '#F5A623' : '#63DCC2';
  return (
    <svg viewBox="0 0 48 76" className="h-14 w-10 sm:h-[4.5rem] sm:w-12" fill="none" aria-hidden="true">
      <circle cx="24" cy="10" r="7" stroke="#DCE6FF" strokeWidth="3" />
      <path d="M24 18v25M24 25 9 35M24 25l14 8M24 43 12 65M24 43l13 21" stroke="#DCE6FF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 19v10" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <circle cx="39" cy="32" r="3" fill={accent} />
    </svg>
  );
}

function CharactersAnimation({ reducedMotion }: { reducedMotion: boolean }) {
  const figures = [
    { left: '7%', delay: 0, duration: 4.8, rotate: -5 },
    { left: '29%', delay: 0.8, duration: 5.6, rotate: 4 },
    { left: '65%', delay: 0.3, duration: 5.1, rotate: -4 },
    { left: '88%', delay: 1.1, duration: 6, rotate: 5 },
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-5 h-20 overflow-hidden sm:bottom-8 sm:h-24">
      {figures.map((figure, index) => (
        <motion.div
          key={figure.left}
          className="absolute bottom-0 opacity-55"
          style={{ left: figure.left }}
          animate={reducedMotion ? undefined : { y: [0, -10, 0], rotate: [figure.rotate, -figure.rotate, figure.rotate] }}
          transition={{ duration: figure.duration, delay: figure.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <StickFigure variant={index} />
        </motion.div>
      ))}
      <div className="absolute inset-x-0 bottom-1 border-t border-dashed border-white/10" />
    </div>
  );
}

export default function NotFoundPage() {
  const navigate = useNavigate();
  const reducedMotion = Boolean(useReducedMotion());

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return (
    <main className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#172B4D] px-4 py-10 text-[#F8F4EC] sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-36 h-[28rem] w-[28rem] rounded-full bg-[#386BE8]/20 blur-[100px]" />
        <div className="absolute -bottom-48 -right-24 h-[32rem] w-[32rem] rounded-full bg-[#14A89C]/10 blur-[110px]" />
        <div className="absolute left-1/2 top-1/2 h-[min(84vw,46rem)] w-[min(84vw,46rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.06]" />
        <div className="absolute left-1/2 top-1/2 h-[min(62vw,34rem)] w-[min(62vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[.08]" />
      </div>

      <CircleAnimation reducedMotion={reducedMotion} />
      <CharactersAnimation reducedMotion={reducedMotion} />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mb-10 flex w-full items-center justify-center sm:mb-12"
        >
          <BrandMark inverse size="lg" />
        </motion.header>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: reducedMotion ? 0 : 0.08, ease: 'easeOut' }}
          className="flex w-full flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A623]/25 bg-[#F5A623]/10 px-4 py-2 text-[10px] font-extrabold tracking-[.2em] text-[#FFC96A] sm:text-xs">
            <Sparkles size={14} />
            PAGE NOT FOUND
          </div>

          <div className="relative mt-5 select-none font-black leading-[.82] tracking-[-.09em]" aria-label="404">
            <span className="text-[clamp(7.5rem,28vw,18rem)] text-[#F8F4EC]">4</span>
            <span className="relative inline-block text-[clamp(7.5rem,28vw,18rem)] text-[#6F98FF]">
              0
              <span className="absolute left-1/2 top-1/2 h-[.19em] w-[.19em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5A623] shadow-[0_0_35px_rgba(245,166,35,.55)]" />
            </span>
            <span className="text-[clamp(7.5rem,28vw,18rem)] text-[#F8F4EC]">4</span>
          </div>

          <h1 className="mt-6 max-w-2xl text-balance text-2xl font-extrabold tracking-[-.04em] text-white sm:mt-8 sm:text-4xl">
            Looks like you took a wrong turn.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#DCE6FF]/70 sm:text-base">
            The page you’re looking for may have moved, is no longer available, or the link might be incorrect.
            Let’s get you back to your campus.
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:mt-9 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[.06] px-6 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/10 focus-visible:outline-offset-4"
            >
              <ArrowLeft size={17} />
              Go back
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#386BE8] px-6 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(56,107,232,.25)] transition hover:-translate-y-0.5 hover:bg-[#2F60D5] focus-visible:outline-offset-4"
            >
              <Home size={17} />
              Go to CampOS
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-9 inline-flex items-center gap-2 text-[10px] font-bold tracking-[.13em] text-white/35 sm:text-xs">
            <Compass size={14} />
            CAMPOS · YOUR CAMPUS, CONNECTED
          </div>
        </motion.div>
      </div>
    </main>
  );
}
