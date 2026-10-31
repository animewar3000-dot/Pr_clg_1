import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasswordSchema } from '../../lib/validations';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout, AuthSubmitLabel } from '../../components/AuthLayout';
import type { z } from 'zod';

type FormData = z.infer<typeof updatePasswordSchema>;
const fieldClass = "mt-2 w-full rounded-xl border border-[#172B4D]/15 bg-white px-4 py-3.5 text-sm text-[#13171F] outline-none transition placeholder:text-slate-400 focus:border-[#386BE8] focus:ring-4 focus:ring-[#386BE8]/10";

export function ResetPasswordPage() {
  const { updatePassword, user, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError('');
    try {
      await updatePassword(data.password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your password.');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoading && !user) {
    return (
      <AuthLayout eyebrow="SECURE ACCOUNT RECOVERY" title="This reset link is not active." description="The link may have expired or already been used. Request a new reset email to continue.">
        <Link to="/auth/forgot-password" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#386BE8] px-5 font-bold text-white">Request a new link</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="SECURE ACCOUNT RECOVERY" title={done ? "Password updated." : "Choose a new password."} description={done ? "Your password has been changed. Return to the sign-in page." : "Choose a strong password you do not use on another site."}>
      {done ? (
        <Link to="/auth/login" className="font-extrabold text-[#386BE8] hover:underline">Continue to sign in →</Link>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label htmlFor="password" className="text-sm font-bold text-[#172B4D]">New password</label>
            <input id="password" type="password" autoComplete="new-password" {...register('password')} className={fieldClass} aria-invalid={Boolean(errors.password)} />
            {errors.password && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-bold text-[#172B4D]">Confirm new password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} className={fieldClass} aria-invalid={Boolean(errors.confirmPassword)} />
            {errors.confirmPassword && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={saving || isLoading} className="inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-[#386BE8] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#2859CB] disabled:cursor-not-allowed disabled:opacity-60">
            <AuthSubmitLabel loading={saving}>Update password</AuthSubmitLabel>
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
