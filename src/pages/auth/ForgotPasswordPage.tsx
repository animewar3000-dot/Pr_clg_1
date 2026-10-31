import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetSchema } from '../../lib/validations';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout, AuthSubmitLabel } from '../../components/AuthLayout';
import type { z } from 'zod';

type FormData = z.infer<typeof passwordResetSchema>;
const fieldClass = "mt-2 w-full rounded-xl border border-[#172B4D]/15 bg-white px-4 py-3.5 text-sm text-[#13171F] outline-none transition placeholder:text-slate-400 focus:border-[#386BE8] focus:ring-4 focus:ring-[#386BE8]/10";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request a reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="ACCOUNT RECOVERY" title={sent ? "Check your inbox." : "Let's get you back in."} description={sent ? "If the account can receive recovery email, follow the secure link to choose a new password." : "Enter your college email and we’ll request a secure password reset link."}>
      {sent ? (
        <div className="rounded-2xl border border-[#14A89C]/25 bg-[#E6F5F1] p-5">
          <div className="text-3xl font-black text-[#16846F]">✓</div>
          <p className="mt-3 text-sm leading-6 text-slate-600">Check your inbox and follow the password reset instructions. You can safely close this page.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label htmlFor="email" className="text-sm font-bold text-[#172B4D]">College email</label>
            <input id="email" type="email" autoComplete="email" {...register('email')} className={fieldClass} placeholder="you@college.edu" aria-invalid={Boolean(errors.email)} />
            {errors.email && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-[#386BE8] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#386BE8]/15 transition hover:-translate-y-0.5 hover:bg-[#2859CB] disabled:cursor-not-allowed disabled:opacity-60">
            <AuthSubmitLabel loading={isLoading}>Send reset link</AuthSubmitLabel>
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-600"><Link to="/auth/login" className="font-extrabold text-[#386BE8] hover:underline">Back to sign in</Link></p>
    </AuthLayout>
  );
}
