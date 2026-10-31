import { AlertTriangle, CheckCircle2, Circle, Code2, Database, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';

const steps = [
  { title: 'Create or open your Supabase project', description: 'Use the college-owned Supabase project. In Project Settings → API, copy the Project URL and the anon/public key (or publishable key supported by your client setup).' },
  { title: 'Add the frontend environment variables', description: 'In Netlify → Site configuration → Environment variables, add both variables for the deploy contexts you use (production, deploy previews and branch deploys). Then trigger a fresh deploy.' },
  { title: 'Apply the database migrations', description: 'Run the checked-in SQL migrations in order using the Supabase CLI or SQL Editor. Confirm that required tables and Row Level Security policies exist before inviting users.' },
  { title: 'Configure authentication and storage', description: 'Enable Email authentication, set the allowed redirect URLs to your Netlify domain, and create the private storage buckets and access policies required by the application.' },
];

export function SetupGuidePage() {
  return (
    <main className="min-h-screen bg-[#F8F5EC] px-4 py-10 text-[#13171F] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" />
          <p className="mt-5 text-xs font-black tracking-[.2em] text-[#386BE8]">FIRST-TIME CONFIGURATION</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#172B4D] sm:text-4xl">One connection left.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">The CampOS frontend could not detect the required Supabase URL and public key in this deployment.</p>
        </div>

        <section className="rounded-3xl border border-[#172B4D]/10 bg-white p-5 shadow-[0_18px_55px_rgba(23,43,77,.08)] sm:p-8">
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h2 className="font-extrabold text-[#172B4D]">Supabase environment variables are missing</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">This is a deployment configuration issue, not a page-rendering failure. Authentication, database-backed pages and private campus data stay unavailable until the real project credentials are added.</p>
            </div>
          </div>

          <div className="mt-7 space-y-7">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E9F0FF] text-[#386BE8]">
                  {index === 0 ? <Database size={18} /> : index === 1 ? <KeyRound size={18} /> : index === 2 ? <Code2 size={18} /> : <ShieldCheck size={18} />}
                </div>
                <div className="min-w-0 flex-1 border-b border-slate-100 pb-6 last:border-0">
                  <p className="text-[10px] font-black tracking-[.15em] text-[#386BE8]">STEP 0{index + 1}</p>
                  <h3 className="mt-1 font-extrabold text-[#172B4D]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-2xl bg-[#101A2B] p-4 text-[12px] leading-6 text-[#75D7CC] shadow-inner sm:p-5">
            <p className="mb-2 font-black tracking-widest text-white/55">NETLIFY ENVIRONMENT VARIABLES</p>
            <code className="block break-all">VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co</code>
            <code className="block break-all">VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY</code>
            <p className="mt-3 text-[11px] leading-5 text-white/55">Use the actual values from your Supabase project. Never put the service-role key in a VITE_ variable or the browser.</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href="https://app.netlify.com/projects/campusiq-w0dw/configuration/env" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#386BE8] px-4 text-sm font-extrabold text-white transition hover:bg-[#2859CB]">
              Open Netlify variables <ExternalLink size={15} />
            </a>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#172B4D]/15 bg-white px-4 text-sm font-extrabold text-[#172B4D] transition hover:bg-slate-50">
              Open Supabase <ExternalLink size={15} />
            </a>
          </div>

          <div className="mt-7 rounded-2xl border border-[#172B4D]/10 bg-[#F8F5EC] p-4">
            <h3 className="flex items-center gap-2 font-extrabold text-[#172B4D]"><CheckCircle2 size={17} className="text-[#14A89C]" /> What is verified right now</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#14A89C]" /> The React frontend and public landing page load.</li>
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#14A89C]" /> The setup page correctly identifies the missing backend configuration.</li>
              <li className="flex gap-2"><Circle size={15} className="mt-0.5 shrink-0 text-slate-400" /> Supabase connection, migrations and live campus workflows still need configuration and testing.</li>
            </ul>
          </div>
        </section>
        <p className="mt-6 text-center text-xs text-slate-400">CampOS · Your campus, in one place.</p>
      </div>
    </main>
  );
}
