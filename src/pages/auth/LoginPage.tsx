import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../lib/validations';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout, AuthSubmitLabel } from '../../components/AuthLayout';
import type { z } from 'zod';

type LoginFormData = z.infer<typeof loginSchema>;

const fieldClass = "mt-2 w-full rounded-xl border border-[#172B4D]/15 bg-white px-4 py-3.5 text-sm text-[#13171F] outline-none transition placeholder:text-slate-400 focus:border-[#386BE8] focus:ring-4 focus:ring-[#386BE8]/10";

export function LoginPage() {
  const { signIn, error: authError } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch {
      // Authentication errors are displayed by AuthContext.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="WELCOME BACK" title="Sign in to your campus." description="Use your verified college identity to return to your campus spaces.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {authError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</div>}
        <div>
          <label htmlFor="email" className="text-sm font-bold text-[#172B4D]">Email address</label>
          <div className="relative mt-2"><Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="email" type="email" autoComplete="username" {...register('email')} className={`${fieldClass} mt-0 min-h-12 pl-11`} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} /></div>
          {errors.email && <p id="email-error" role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-bold text-[#172B4D]">Password</label>
            <Link to="/auth/forgot-password" className="text-xs font-bold text-[#386BE8] hover:underline">Forgot password?</Link>
          </div>
          <div className="relative mt-2"><LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" {...register('password')} className={`${fieldClass} mt-0 min-h-12 pl-11 pr-12`} placeholder="Enter your password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
          <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#172B4D]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          {errors.password && <p id="password-error" role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isLoading} className="inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-[#2859CB] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#386BE8]/15 transition hover:-translate-y-0.5 hover:bg-[#2859CB] disabled:cursor-not-allowed disabled:opacity-60">
          <AuthSubmitLabel loading={isLoading}>Sign in</AuthSubmitLabel>
        </button>
        <p className="text-center text-sm text-slate-600">New to CampOS? <Link to="/auth/register" className="font-extrabold text-[#386BE8] hover:underline">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}
