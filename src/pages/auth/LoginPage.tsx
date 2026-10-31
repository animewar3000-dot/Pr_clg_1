import { useState } from 'react';
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
          <label htmlFor="email" className="text-sm font-bold text-[#172B4D]">College email</label>
          <input id="email" type="email" autoComplete="username" {...register('email')} className={fieldClass} placeholder="you@college.edu" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
          {errors.email && <p id="email-error" role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-bold text-[#172B4D]">Password</label>
            <Link to="/auth/forgot-password" className="text-xs font-bold text-[#386BE8] hover:underline">Forgot password?</Link>
          </div>
          <input id="password" type="password" autoComplete="current-password" {...register('password')} className={fieldClass} placeholder="Enter your password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
          {errors.password && <p id="password-error" role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isLoading} className="inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-[#386BE8] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#386BE8]/15 transition hover:-translate-y-0.5 hover:bg-[#2859CB] disabled:cursor-not-allowed disabled:opacity-60">
          <AuthSubmitLabel loading={isLoading}>Sign in</AuthSubmitLabel>
        </button>
        <p className="text-center text-sm text-slate-600">New to CampusIQ? <Link to="/auth/register" className="font-extrabold text-[#386BE8] hover:underline">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}
