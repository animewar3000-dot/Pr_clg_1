import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../lib/validations';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout, AuthSubmitLabel } from '../../components/AuthLayout';
import type { z } from 'zod';

type RegisterFormData = z.infer<typeof registerSchema>;
const fieldClass = "mt-2 w-full rounded-xl border border-[#172B4D]/15 bg-white px-4 py-3 text-sm text-[#13171F] outline-none transition placeholder:text-slate-400 focus:border-[#386BE8] focus:ring-4 focus:ring-[#386BE8]/10";

export function RegisterPage() {
  const { signUp, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.displayName, data.collegeCode);
      setSuccess(true);
    } catch {
      // Authentication errors are displayed by AuthContext.
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout eyebrow="REGISTRATION RECEIVED" title="Your next chapter starts soon." description="Your account request has been submitted. Follow the verification instructions sent to your college email.">
        <div className="rounded-2xl border border-[#14A89C]/25 bg-[#E6F5F1] p-5">
          <div className="text-3xl font-black text-[#16846F]">✓</div>
          <h2 className="mt-3 text-lg font-extrabold text-[#172B4D]">Check your college inbox</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Email verification and the institution’s approval process must be completed before protected campus features become available.</p>
        </div>
        <Link to="/auth/login" className="mt-6 inline-flex font-extrabold text-[#386BE8] hover:underline">Go to sign in →</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="CREATE YOUR CAMPUS IDENTITY" title="Start with your details." description="Use the details your college can verify. Your unique CampusIQ ID is generated after approval.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {authError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</div>}
        <div>
          <label htmlFor="displayName" className="text-sm font-bold text-[#172B4D]">Full name</label>
          <input id="displayName" autoComplete="name" {...register('displayName')} className={fieldClass} placeholder="Your name as on college records" aria-invalid={Boolean(errors.displayName)} />
          {errors.displayName && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{errors.displayName.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-bold text-[#172B4D]">College email</label>
          <input id="email" type="email" autoComplete="email" {...register('email')} className={fieldClass} placeholder="you@college.edu" aria-invalid={Boolean(errors.email)} />
          {errors.email && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="collegeCode" className="text-sm font-bold text-[#172B4D]">College code</label>
          <input id="collegeCode" autoComplete="off" {...register('collegeCode')} className={fieldClass} placeholder="Your official college code" aria-invalid={Boolean(errors.collegeCode)} />
          {errors.collegeCode && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{errors.collegeCode.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-bold text-[#172B4D]">Password</label>
          <input id="password" type="password" autoComplete="new-password" {...register('password')} className={fieldClass} placeholder="At least 8 characters" aria-invalid={Boolean(errors.password)} />
          {errors.password && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isLoading} className="inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-[#386BE8] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#386BE8]/15 transition hover:-translate-y-0.5 hover:bg-[#2859CB] disabled:cursor-not-allowed disabled:opacity-60">
          <AuthSubmitLabel loading={isLoading}>Create account</AuthSubmitLabel>
        </button>
        <p className="text-center text-sm text-slate-600">Already registered? <Link to="/auth/login" className="font-extrabold text-[#386BE8] hover:underline">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}
