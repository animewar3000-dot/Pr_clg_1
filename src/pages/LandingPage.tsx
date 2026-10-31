import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  Compass,
  FileSearch,
  GraduationCap,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';

const features = [
  { icon: Users, number: '01', title: 'Find your people', description: 'Section-wise rooms, subject spaces, private messages and study groups keep conversations close to the work.' },
  { icon: BookOpen, number: '02', title: 'A better resource hub', description: 'Search notes, previous papers, lecture slides and lab manuals with academic filters and secure access.' },
  { icon: Search, number: '03', title: 'Lost & Found', description: 'Report a lost item, share something you found and follow a protected claim process.' },
  { icon: Wrench, number: '04', title: 'Campus request desk', description: 'Raise a facilities issue and follow its status through a timestamped service workflow.' },
  { icon: CalendarDays, number: '05', title: 'Campus life, connected', description: 'Discover official announcements, events, clubs, permitted listings and academic schedules.' },
  { icon: Sparkles, number: '06', title: 'CampOS assistant', description: 'Ask questions against approved campus documents, with source references and permission-aware retrieval.' },
];

const faqs = [
  { question: 'Who can use CampOS?', answer: 'CampOS is designed for verified students, faculty, administrators and authorized campus support staff. Access depends on the institution’s registration and approval process.' },
  { question: 'How do I get my CampOS ID?', answer: 'Create an account using the college-approved identity process. Your unique CampOS ID is assigned by the platform after the relevant account checks.' },
  { question: 'Are private messages visible to everyone?', answer: 'No. Private conversations are intended for their authorized participants. Access controls must be enforced by the backend, not just hidden in the interface.' },
  { question: 'Does the AI assistant make up college policies?', answer: 'It should answer from documents the signed-in user is allowed to access, cite its sources and say when the approved information is not available.' },
];

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

export function LandingPage() {
  const reducedMotion = useReducedMotion();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const revealProps = {
    initial: reducedMotion ? false : 'hidden',
    whileInView: 'visible',
    viewport: { once: true, amount: 0.16 },
    variants: reveal,
    transition: { duration: reducedMotion ? 0 : 0.55, ease: 'easeOut' as const },
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8F5EC] text-[#13171F]">
      <header className="sticky top-0 z-40 border-b border-[#172B4D]/10 bg-[#F8F5EC]/95 backdrop-blur">
        <nav aria-label="Main navigation" className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="CampOS home">
            <BrandMark size="md" />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-[#386BE8]">Platform</a>
            <a href="#how-it-works" className="transition hover:text-[#386BE8]">How it works</a>
            <a href="#trust" className="transition hover:text-[#386BE8]">Trust & safety</a>
            <a href="#faq" className="transition hover:text-[#386BE8]">FAQs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth/login" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[#172B4D] transition hover:bg-white sm:inline-flex">Log in</Link>
            <Link to="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-[#386BE8] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#386BE8]/15 transition hover:-translate-y-0.5 hover:bg-[#2859CB]">
              Get started <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-8 lg:pb-28 lg:pt-24">
        <div className="relative z-10">
          <motion.div {...revealProps} className="inline-flex items-center gap-2 rounded-full border border-[#386BE8]/20 bg-white/70 px-4 py-2 text-xs font-extrabold tracking-[.16em] text-[#386BE8]">
            <span className="h-2 w-2 rounded-full bg-[#14A89C]" /> A BETTER WAY TO DO CAMPUS
          </motion.div>
          <motion.h1 {...revealProps} transition={{ duration: reducedMotion ? 0 : 0.62, delay: 0.06 }} className="mt-7 max-w-3xl font-black leading-[.91] tracking-[-.055em] text-[#13171F]">
            <span className="block text-[clamp(4rem,8vw,7.2rem)]">Your campus.</span>
            <span className="mt-2 block text-[clamp(4rem,8vw,7.2rem)] text-[#386BE8]">Connected<span className="text-[#F55C4A]">.</span></span>
          </motion.h1>
          <motion.p {...revealProps} transition={{ duration: reducedMotion ? 0 : 0.58, delay: 0.12 }} className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
            One place to connect with classmates, discover resources, stay updated and make campus life easier.
          </motion.p>
          <motion.div {...revealProps} transition={{ duration: reducedMotion ? 0 : 0.58, delay: 0.18 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth/register" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#386BE8] px-7 text-base font-extrabold text-white shadow-xl shadow-[#386BE8]/20 transition hover:-translate-y-1 hover:bg-[#2859CB]">
              Get started <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href="#features" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-[#172B4D]/15 bg-white px-7 text-base font-extrabold text-[#172B4D] transition hover:-translate-y-1 hover:border-[#386BE8]/40">
              Explore CampOS <Compass size={18} aria-hidden="true" />
            </a>
          </motion.div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold tracking-wide text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#14A89C]" /> VERIFIED CAMPUS IDENTITY</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <span>BUILT FOR REAL COLLEGE LIFE</span>
          </div>
        </div>

        <motion.div initial={reducedMotion ? false : { opacity: 0, scale: .96, rotate: 1.4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: reducedMotion ? 0 : .7, ease: 'easeOut' }} className="relative mx-auto w-full max-w-[620px]">
          <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-[#F5A82E]/30 blur-2xl" />
          <div className="absolute -right-6 bottom-8 h-40 w-40 rounded-full bg-[#14A89C]/25 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border-[3px] border-[#13171F] bg-[#172B4D] p-5 shadow-[12px_14px_0_#13171F] sm:p-7">
            <div className="absolute right-7 top-7 grid grid-cols-7 gap-2 opacity-30" aria-hidden="true">
              {Array.from({ length: 35 }).map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-white" />)}
            </div>
            <div className="relative flex items-center justify-between">
              <span className="rounded-lg bg-[#F5A82E] px-3 py-2 text-[10px] font-black tracking-[.13em] text-[#13171F]">CAMPUS LIFE / VOL. 01</span>
              <span className="text-xs font-black tracking-widest text-white/60">CIQ — 001</span>
            </div>
            <div className="relative mt-8 max-w-[400px] text-white">
              <p className="text-[clamp(2.8rem,5vw,4.6rem)] font-black uppercase leading-[.88] tracking-[-.05em]">Find your<br />campus crew<span className="text-[#F5A82E]">.</span></p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">A connected space for conversations, learning and everything happening around campus.</p>
            </div>
            <div className="relative mt-8 rounded-2xl border-[2px] border-[#13171F] bg-[#F8F5EC] p-4">
              <div className="flex items-center justify-between border-b border-[#13171F]/10 pb-3">
                <div className="flex items-center gap-2">
                  <BrandMark size="sm" />
                </div>
                <span className="rounded-full bg-[#DCE6FF] px-3 py-1 text-[10px] font-black text-[#2859CB]">CONCEPT VIEW</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#172B4D]/10 bg-white p-4">
                  <span className="text-[10px] font-black tracking-widest text-[#386BE8]">COMMUNITY</span>
                  <p className="mt-2 text-sm font-extrabold text-[#13171F]">Your section room</p>
                  <p className="mt-1 text-xs text-slate-500">Authorized spaces appear here.</p>
                </div>
                <div className="rounded-xl border border-[#172B4D]/10 bg-white p-4">
                  <span className="text-[10px] font-black tracking-widest text-[#14A89C]">ACADEMICS</span>
                  <p className="mt-2 text-sm font-extrabold text-[#13171F]">Resource library</p>
                  <p className="mt-1 text-xs text-slate-500">Find notes and study material.</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-[#172B4D]/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-[#386BE8]">CAMPUS UPDATES</span>
                  <span className="text-[10px] font-bold text-slate-400">LIVE DATA WHEN CONNECTED</span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-500">No official notices published yet.</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-3 hidden rotate-[-5deg] rounded-xl border-2 border-[#13171F] bg-[#F55C4A] px-4 py-3 text-sm font-black text-white shadow-[4px_5px_0_#13171F] sm:block">YOUR STORY STARTS HERE!</div>
          </div>
          <div className="absolute -left-5 top-1/2 hidden -rotate-6 rounded-xl border-2 border-[#13171F] bg-[#F5A82E] px-4 py-3 text-sm font-black text-[#13171F] shadow-[4px_5px_0_#13171F] md:block">LET'S CONNECT →</div>
        </motion.div>
      </section>

      <section id="features" className="scroll-mt-24 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...revealProps} className="max-w-2xl">
            <p className="text-xs font-black tracking-[.18em] text-[#386BE8]">THE CAMPUS TOOLKIT</p>
            <h2 className="mt-4 text-4xl font-black leading-[.98] tracking-[-.045em] text-[#13171F] sm:text-6xl">Built around your<br />actual campus day.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">Useful campus tools should work together, not make you jump between disconnected places.</p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article key={feature.number} initial={reducedMotion ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: .15 }} variants={reveal} transition={{ duration: reducedMotion ? 0 : .45, delay: reducedMotion ? 0 : index * .045 }} className="group rounded-3xl border border-[#172B4D]/10 bg-[#F8F5EC] p-7 transition hover:-translate-y-1 hover:border-[#386BE8]/30 hover:shadow-xl hover:shadow-[#172B4D]/5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#172B4D] text-white transition group-hover:bg-[#386BE8]"><Icon size={22} aria-hidden="true" /></span>
                    <span className="font-mono text-xs font-bold text-slate-400">{feature.number}</span>
                  </div>
                  <h3 className="mt-7 text-xl font-extrabold tracking-tight text-[#172B4D]">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-[#172B4D] py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr]">
          <motion.div {...revealProps}>
            <p className="text-xs font-black tracking-[.18em] text-[#75D7CC]">A SIMPLE START</p>
            <h2 className="mt-4 text-4xl font-black leading-[.98] tracking-[-.045em] sm:text-6xl">Join the<br />story.</h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/70">The right campus spaces start with the right identity and the right access.</p>
            <Link to="/auth/register" className="mt-8 inline-flex min-h-13 items-center gap-3 rounded-xl bg-[#F5A82E] px-6 font-extrabold text-[#13171F] transition hover:-translate-y-1">Start your registration <ArrowRight size={18} aria-hidden="true" /></Link>
          </motion.div>
          <div className="grid gap-4">
            {[
              ['01', 'Verify your identity', 'Register through your college-approved process.'],
              ['02', 'Find your spaces', 'Access rooms and resources that match your approved academic context.'],
              ['03', 'Stay connected', 'Message, discover and manage campus tasks from one home base.'],
            ].map(([number, title, description], index) => (
              <motion.div key={number} {...revealProps} transition={{ duration: reducedMotion ? 0 : .45, delay: reducedMotion ? 0 : index * .08 }} className="flex gap-5 rounded-2xl border border-white/15 bg-white/5 p-6">
                <span className="font-mono text-2xl font-black text-[#75D7CC]">{number}</span>
                <div><h3 className="text-xl font-extrabold">{title}</h3><p className="mt-2 leading-7 text-white/65">{description}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="scroll-mt-24 bg-[#F8F5EC] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...revealProps} className="grid gap-10 rounded-[2rem] border border-[#172B4D]/10 bg-white p-8 sm:p-12 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-xs font-black tracking-[.18em] text-[#386BE8]">BUILT ON TRUST</p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-.04em] text-[#13171F] sm:text-5xl">Campus access should feel personal. Security should be serious.</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {([
                [ShieldCheck, 'Verified identities', 'Registration and campus identity checks are controlled by the institution.'],
                [LockKeyhole, 'Private conversations', 'Private messages must be restricted to authorized participants.'],
                [GraduationCap, 'Role-aware spaces', 'Students, faculty and staff see the tools appropriate to their permissions.'],
                [FileSearch, 'Grounded AI answers', 'The assistant should cite approved documents and respect document access rules.'],
              ] as [LucideIcon, string, string][]).map(([Icon, title, description]) => (
                <div key={title as string} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E9F0FF] text-[#386BE8]"><Icon size={19} aria-hidden="true" /></span>
                  <div><h3 className="font-extrabold text-[#172B4D]">{title as string}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{description as string}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr]">
          <motion.div {...revealProps}>
            <p className="inline-flex items-center gap-2 text-xs font-black tracking-[.18em] text-[#386BE8]"><HelpCircle size={16} /> FAQ</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.04em] sm:text-5xl">Good to know.</h2>
            <p className="mt-5 max-w-sm leading-7 text-slate-600">A few things about campus access, privacy and how CampOS is meant to work.</p>
          </motion.div>
          <div className="divide-y divide-[#172B4D]/10 border-y border-[#172B4D]/10">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className="py-5">
                  <button type="button" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 text-left text-base font-extrabold text-[#172B4D] focus-visible:outline-[#14A89C]">
                    {faq.question}
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${isOpen ? 'rotate-45 bg-[#386BE8] text-white' : 'bg-[#E9F0FF] text-[#386BE8]'}`} aria-hidden="true">＋</span>
                  </button>
                  {isOpen && <p className="max-w-2xl pr-8 pt-4 leading-7 text-slate-600">{faq.answer}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F8F5EC] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 rounded-[2rem] bg-[#386BE8] p-8 text-white sm:p-12 lg:flex-row lg:items-center">
          <div><p className="text-xs font-black tracking-[.18em] text-white/70">YOUR CAMPUS. CONNECTED.</p><h2 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">Ready for your next chapter?</h2><p className="mt-4 max-w-xl leading-7 text-white/80">Start with your college identity and discover the spaces that belong to your campus journey.</p></div>
          <Link to="/auth/register" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#F5A82E] px-7 font-extrabold text-[#13171F] transition hover:-translate-y-1">Get started <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>

      <footer className="bg-[#13171F] px-5 py-10 text-white/70 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div><div className="flex items-center gap-3 text-lg font-black text-white"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#386BE8] text-white">C</span> CampOS</div><p className="mt-2 text-sm">Your campus. Connected.</p></div>
          <div className="flex flex-wrap gap-6 text-sm font-semibold"><a href="#features" className="hover:text-white">Platform</a><a href="#trust" className="hover:text-white">Trust & safety</a><a href="#faq" className="hover:text-white">FAQs</a><Link to="/auth/login" className="hover:text-white">Log in</Link></div>
          <p className="text-xs">© {new Date().getFullYear()} CampOS</p>
        </div>
      </footer>
    </main>
  );
}
