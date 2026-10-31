import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  const reducedMotion = useReducedMotion();

  return (
    <main className="min-h-screen bg-[#F8F5EC] px-4 py-6 text-[#13171F] sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-[#172B4D]/10 bg-white shadow-[0_24px_80px_rgba(23,43,77,.10)] lg:grid-cols-[.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-[#172B4D] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-[#386BE8]/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#14A89C]/20 blur-3xl" />
          <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3 text-lg font-black">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#386BE8] text-2xl">C</span>
            CampusIQ
          </Link>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : .55 }}
            className="relative z-10"
          >
            <p className="text-xs font-black tracking-[.2em] text-[#75D7CC]">CAMPUS LIFE / VOL. 01</p>
            <h2 className="mt-6 max-w-lg text-6xl font-black uppercase leading-[.9] tracking-[-.05em] xl:text-7xl">
              A new chapter<br />starts here<span className="text-[#F5A82E]">.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/70">
              One verified identity. A whole campus of people, ideas and opportunities.
            </p>
            <div className="mt-10 max-w-md rotate-[-2deg] rounded-2xl border-[3px] border-[#13171F] bg-[#F8F5EC] p-6 text-[#13171F] shadow-[8px_9px_0_#13171F]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-[#386BE8]">YOUR CAMPUS. CONNECTED.</span>
                <Sparkles className="text-[#F55C4A]" size={20} aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-black uppercase leading-none">Find your<br />people. Build<br />your story.</p>
              <div className="mt-5 inline-flex rounded-lg bg-[#F5A82E] px-3 py-2 text-xs font-black">ISSUE NO. 001</div>
            </div>
          </motion.div>
          <p className="relative z-10 text-xs font-bold tracking-widest text-white/50">SECURE ACCESS / VERIFIED CAMPUS COMMUNITY</p>
        </section>

        <section className="flex items-center justify-center px-2 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-lg">
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#386BE8]">
              <ArrowLeft size={16} aria-hidden="true" /> Back to CampusIQ
            </Link>
            <p className="text-xs font-black tracking-[.18em] text-[#386BE8]">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-.045em] text-[#13171F] sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-lg leading-7 text-slate-600">{description}</p>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : .4, delay: reducedMotion ? 0 : .08 }}
              className="mt-8 rounded-3xl border border-[#172B4D]/10 bg-[#F8F5EC] p-5 shadow-sm sm:p-7"
            >
              {children}
            </motion.div>
            <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-[#14A89C]" aria-hidden="true" />
              Campus access is subject to your college’s identity verification and approval process.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthSubmitLabel({ loading, children }: { loading: boolean; children: ReactNode }) {
  return <span className="inline-flex items-center justify-center gap-2">{loading ? 'Please wait…' : children}<ArrowRight size={17} aria-hidden="true" /></span>;
}
