import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock3, Shield, Users } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type PendingCampusUser = {
  id: string;
  display_name: string;
  email: string;
  campus_id: string | null;
  created_at: string;
};

export function AdminPage() {
  const { hasAnyRole, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const isAdmin = hasAnyRole(['college_admin', 'super_admin', 'department_admin']);
  const canApprove = hasAnyRole(['college_admin', 'super_admin']);

  const pendingQuery = useQuery<PendingCampusUser[]>({
    queryKey: ['admin', 'pending-users', profile?.college_id],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.rpc('list_pending_campus_users');
      if (error) throw error;
      return (data || []) as PendingCampusUser[];
    },
    enabled: Boolean(supabase && profile && isAdmin),
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.rpc('approve_campus_user', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pending-users', profile?.college_id] });
      await queryClient.invalidateQueries({ queryKey: ['admin-stats', profile?.college_id] });
    },
  });

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[#172B4D]/10 bg-white p-10 text-center shadow-sm">
        <Shield className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="mt-4 text-xl font-black text-[#172B4D]">Administrative access only</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Your account does not have permission to open this workspace.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[.2em] text-[#386BE8]">CAMPOS / CONTROL ROOM</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#172B4D]">Administration</h1>
          <p className="mt-2 text-sm text-slate-500">Review campus access requests and protect your college community.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#172B4D]/10 bg-white px-4 py-3 text-xs font-bold text-slate-600">
          <Users size={16} className="text-[#386BE8]" /> {profile?.college_id ? 'College workspace' : 'Workspace'}
        </div>
      </header>

      <section className="rounded-3xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[.18em] text-[#386BE8]">ACCESS CONTROL</p>
            <h2 className="mt-2 text-xl font-black text-[#172B4D]">Pending verifications</h2>
            <p className="mt-1 text-sm text-slate-500">New registrations stay restricted until an authorized administrator approves them.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-3 py-2 text-xs font-extrabold text-[#946200]">
            <Clock3 size={14} /> {pendingQuery.data?.length ?? '—'} waiting
          </span>
        </div>

        {pendingQuery.isLoading ? (
          <div className="mt-6 space-y-3" aria-label="Loading verification requests">
            {[0, 1, 2].map(item => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : pendingQuery.isError ? (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div><p className="font-bold">Could not load verification requests.</p><p className="mt-1">{pendingQuery.error instanceof Error ? pendingQuery.error.message : 'Check that migration 002 has been applied and your administrator role is active.'}</p></div>
          </div>
        ) : pendingQuery.data?.length ? (
          <div className="mt-6 divide-y divide-slate-100">
            {pendingQuery.data.map(candidate => (
              <div key={candidate.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#E9F0FF] font-black text-[#386BE8]">
                  {candidate.display_name.trim().slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-[#172B4D]">{candidate.display_name}</p>
                  <p className="truncate text-sm text-slate-500">{candidate.email}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    {candidate.campus_id || 'Campus ID pending'} · Requested {new Date(candidate.created_at).toLocaleDateString()}
                  </p>
                </div>
                {canApprove ? (
                  <button
                    type="button"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(candidate.id)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#172B4D] px-4 text-sm font-extrabold text-white transition hover:bg-[#386BE8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} /> Approve account
                  </button>
                ) : (
                  <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">View only</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <CheckCircle2 size={26} className="mx-auto text-[#14A89C]" />
            <p className="mt-3 font-extrabold text-[#172B4D]">No pending requests</p>
            <p className="mt-1 text-sm text-slate-500">New verified college registrations will appear here.</p>
          </div>
        )}

        {approveMutation.isError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Approval failed: {approveMutation.error instanceof Error ? approveMutation.error.message : 'Please try again.'}
          </p>
        )}
        {approveMutation.isSuccess && (
          <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            Account approved. The verification queue has been refreshed.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[#172B4D]/10 bg-[#F8F5EC] p-5">
        <h3 className="font-extrabold text-[#172B4D]">Security note</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Role assignments, suspensions, moderation decisions and institutional configuration remain restricted to trusted administrative workflows. This screen currently implements account approval only; it does not pretend that the other controls are live.
        </p>
      </section>
    </div>
  );
}
