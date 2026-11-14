import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MailPlus, Shield, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabase } from '../../lib/supabase';
import type { UserRole } from '../../lib/types';

type RoleScope = 'college' | 'department' | 'program' | 'section';
type ManagedRole = { role: UserRole; scope_type: RoleScope; scope_id: string; granted_at: string };
type ManagedUser = {
  id: string; display_name: string; email: string; campus_id: string | null;
  account_status: string; created_at: string; email_verified: boolean; role_assignments: ManagedRole[];
};
type ScopeOption = { id: string; label: string };

const roleLabels: Record<UserRole, string> = {
  student: 'Student', faculty: 'Faculty', class_representative: 'Class representative',
  club_moderator: 'Club moderator', support_staff: 'Support staff',
  department_admin: 'Department admin', college_admin: 'College admin', super_admin: 'Super admin',
};
const assignableRoles: UserRole[] = [
  'student', 'faculty', 'class_representative', 'club_moderator',
  'support_staff', 'department_admin', 'college_admin',
];
function roleScope(role: UserRole): RoleScope {
  if (role === 'department_admin') return 'department';
  if (role === 'class_representative') return 'section';
  return 'college';
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function UserRoleManagement() {
  const { profile, hasAnyRole } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const canManage = hasAnyRole(['college_admin', 'super_admin']);
  const isSuperAdmin = hasAnyRole(['super_admin']);
  const [inviteForm, setInviteForm] = useState({ displayName: '', email: '', collegeStudentId: '' });
  const [inviteNotice, setInviteNotice] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('faculty');
  const [scopeType, setScopeType] = useState<RoleScope>('college');
  const [scopeId, setScopeId] = useState('');

  const usersQuery = useQuery<ManagedUser[]>({
    queryKey: ['admin', 'managed-users', profile?.college_id],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.rpc('list_managed_campus_users');
      if (error) throw error;
      return (data || []) as ManagedUser[];
    },
    enabled: Boolean(supabase && profile?.college_id && canManage),
  });
  const collegeCodeQuery = useQuery<string>({
    queryKey: ['admin', 'college-code', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile?.college_id) throw new Error('College profile unavailable.');
      const { data, error } = await supabase.from('colleges').select('code').eq('id', profile.college_id).single();
      if (error) throw error;
      return data.code as string;
    },
    enabled: Boolean(supabase && profile?.college_id && canManage),
  });
  const scopeQuery = useQuery<ScopeOption[]>({
    queryKey: ['admin', 'role-scopes', profile?.college_id, scopeType],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.rpc('list_campus_scope_options', { p_scope_type: scopeType });
      if (error) throw error;
      return (data || []) as ScopeOption[];
    },
    enabled: Boolean(supabase && profile?.college_id && canManage),
  });

  const availableRoles = useMemo(
    () => assignableRoles.filter(role => role !== 'college_admin' || isSuperAdmin),
    [isSuperAdmin],
  );
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const users = usersQuery.data || [];
    return query ? users.filter(user =>
      (user.display_name + ' ' + user.email + ' ' + (user.campus_id || '')).toLowerCase().includes(query),
    ) : users;
  }, [search, usersQuery.data]);

  useEffect(() => {
    if (scopeQuery.data?.length && !scopeQuery.data.some(option => option.id === scopeId)) {
      setScopeId(scopeQuery.data[0].id);
    }
  }, [scopeId, scopeQuery.data]);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      if (!collegeCodeQuery.data) throw new Error('Could not load your college code.');
      const { data, error } = await supabase.functions.invoke('invite-campus-user', {
        body: {
          displayName: inviteForm.displayName.trim(),
          email: inviteForm.email.trim().toLowerCase(),
          collegeCode: collegeCodeQuery.data,
          collegeStudentId: inviteForm.collegeStudentId.trim(),
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.userId) throw new Error(data?.error || 'The invitation could not be created.');
      return data as { userId: string; email: string; invited: boolean };
    },
    onSuccess: async result => {
      setInviteNotice('Invitation sent to ' + result.email + '. Their account stays pending until email verification and administrator approval.');
      setInviteError('');
      setInviteForm({ displayName: '', email: '', collegeStudentId: '' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'managed-users', profile?.college_id] });
    },
    onError: error => { setInviteError(errorMessage(error)); setInviteNotice(''); },
  });
  const grantMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !selectedUser || !scopeId) throw new Error('Choose an account and a valid role scope.');
      const { error } = await supabase.rpc('manage_campus_role', {
        p_user_id: selectedUser, p_role: selectedRole, p_scope_type: scopeType,
        p_scope_id: scopeId, p_action: 'grant',
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'managed-users', profile?.college_id] });
    },
  });
  const revokeMutation = useMutation({
    mutationFn: async ({ userId, assignment }: { userId: string; assignment: ManagedRole }) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.rpc('manage_campus_role', {
        p_user_id: userId, p_role: assignment.role, p_scope_type: assignment.scope_type,
        p_scope_id: assignment.scope_id, p_action: 'revoke',
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'managed-users', profile?.college_id] });
    },
  });

  if (!canManage) return null;
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setScopeType(roleScope(role));
    setScopeId('');
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[.18em] text-[#7653C8]">IDENTITY & PERMISSIONS</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#172B4D]">Users & roles</h2>
          <p className="mt-1 text-sm text-slate-500">Invite campus members and control access with college-scoped permissions.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#172B4D]/10 bg-white px-4 py-3 text-xs font-bold text-slate-600">
          <ShieldCheck size={16} className="text-[#7653C8]" />
          {isSuperAdmin ? 'Super admin authority' : 'College admin authority'}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <form noValidate onSubmit={event => {
          event.preventDefault(); setInviteError(''); setInviteNotice(''); inviteMutation.mutate();
        }} className="rounded-3xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E9F0FF] text-[#386BE8]"><MailPlus size={20} /></span>
            <div>
              <h3 className="font-black text-[#172B4D]">Invite a member</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Send a secure email invitation. New accounts start as pending students.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-slate-600">Full name
              <input required minLength={2} maxLength={100} value={inviteForm.displayName} onChange={e => setInviteForm(v => ({ ...v, displayName: e.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172B4D] outline-none transition focus:border-[#386BE8] focus:bg-white focus:ring-2 focus:ring-[#386BE8]/10" placeholder="Member name" />
            </label>
            <label className="block text-xs font-bold text-slate-600">College email
              <input required type="email" maxLength={254} autoComplete="email" value={inviteForm.email} onChange={e => setInviteForm(v => ({ ...v, email: e.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172B4D] outline-none transition focus:border-[#386BE8] focus:bg-white focus:ring-2 focus:ring-[#386BE8]/10" placeholder="name@college.edu" />
            </label>
            <label className="block text-xs font-bold text-slate-600">College student ID
              <input required maxLength={80} value={inviteForm.collegeStudentId} onChange={e => setInviteForm(v => ({ ...v, collegeStudentId: e.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172B4D] outline-none transition focus:border-[#386BE8] focus:bg-white focus:ring-2 focus:ring-[#386BE8]/10" placeholder="Official student / staff ID" />
            </label>
          </div>
          {inviteError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{inviteError}</p>}
          {inviteNotice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800">{inviteNotice}</p>}
          {collegeCodeQuery.isError && <p role="alert" className="mt-3 text-xs text-red-700">College code could not be loaded. Check the college read policy.</p>}
          <button type="submit" disabled={inviteMutation.isPending || !collegeCodeQuery.data || !inviteForm.displayName.trim() || !inviteForm.email.trim() || !inviteForm.collegeStudentId.trim()} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#172B4D] px-4 text-sm font-extrabold text-white transition hover:bg-[#386BE8] disabled:cursor-not-allowed disabled:opacity-50">
            <UserPlus size={16} /> {inviteMutation.isPending ? 'Sending invitation…' : 'Send invitation'}
          </button>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">Invited users must verify their email. Administrators must still approve campus access.</p>
        </form>

        <div className="rounded-3xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F3EFFF] text-[#7653C8]"><Shield size={20} /></span>
            <div>
              <h3 className="font-black text-[#172B4D]">Grant a role</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Assign an existing account a role within your college or an approved academic scope.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-600 sm:col-span-2">Campus account
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172B4D] outline-none focus:border-[#7653C8] focus:ring-2 focus:ring-[#7653C8]/10">
                <option value="">Select an account</option>
                {(usersQuery.data || []).map(user => <option key={user.id} value={user.id}>{user.display_name} · {user.email}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-600">Role
              <select value={selectedRole} onChange={e => handleRoleChange(e.target.value as UserRole)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172B4D] outline-none focus:border-[#7653C8] focus:ring-2 focus:ring-[#7653C8]/10">
                {availableRoles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-600">Scope
              <select value={scopeType} onChange={e => { setScopeType(e.target.value as RoleScope); setScopeId(''); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172B4D] outline-none focus:border-[#7653C8] focus:ring-2 focus:ring-[#7653C8]/10">
                <option value="college">College</option><option value="department">Department</option>
                <option value="program">Program</option><option value="section">Section</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-600 sm:col-span-2">Apply to
              <select value={scopeId} onChange={e => setScopeId(e.target.value)} disabled={scopeQuery.isLoading || !scopeQuery.data?.length} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172B4D] outline-none focus:border-[#7653C8] focus:ring-2 focus:ring-[#7653C8]/10 disabled:opacity-60">
                <option value="">{scopeQuery.isLoading ? 'Loading scopes…' : 'Choose a scope'}</option>
                {(scopeQuery.data || []).map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
          </div>
          {grantMutation.isError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{errorMessage(grantMutation.error)}</p>}
          {grantMutation.isSuccess && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">Role assignment saved.</p>}
          {scopeQuery.isError && <p role="alert" className="mt-3 text-xs text-red-700">Could not load role scopes: {errorMessage(scopeQuery.error)}</p>}
          <button type="button" onClick={() => grantMutation.mutate()} disabled={grantMutation.isPending || !selectedUser || !scopeId} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7653C8] px-4 text-sm font-extrabold text-white transition hover:bg-[#6542B8] disabled:cursor-not-allowed disabled:opacity-50">
            <Check size={16} /> {grantMutation.isPending ? 'Saving role…' : 'Grant role'}
          </button>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">College Admins cannot grant College Admin or Super Admin access. Super Admin can grant College Admin access. Super Admin itself is bootstrap-only.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#172B4D]/10 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:px-6">
          <div><h3 className="font-black text-[#172B4D]">Campus accounts</h3><p className="mt-1 text-xs text-slate-500">{usersQuery.data?.length ?? 0} accounts in your college</p></div>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email or ID" aria-label="Search campus accounts" className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#386BE8] sm:w-64" />
        </div>
        {usersQuery.isLoading ? (
          <div className="space-y-3 p-6" aria-label="Loading campus accounts">{[0, 1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : usersQuery.isError ? (
          <p role="alert" className="p-6 text-sm text-red-700">Could not load campus accounts: {errorMessage(usersQuery.error)}</p>
        ) : filteredUsers.length ? (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map(user => (
              <article key={user.id} className="flex flex-col gap-3 p-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-extrabold text-[#172B4D]">{user.display_name}</p><p className="truncate text-xs text-slate-500">{user.email} · {user.campus_id || 'Campus ID pending'}</p></div>
                  <span className={'rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ' + (user.account_status === 'active' ? 'bg-emerald-50 text-emerald-700' : user.account_status === 'pending_verification' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                    {user.account_status.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {user.role_assignments.map((assignment, index) => (
                    <span key={assignment.role + '-' + assignment.scope_type + '-' + assignment.scope_id + '-' + index} className="inline-flex items-center gap-2 rounded-lg border border-[#172B4D]/10 bg-[#F8F9FC] px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
                      {roleLabels[assignment.role] || assignment.role}
                      <span className="font-medium text-slate-400">· {assignment.scope_type}</span>
                      {user.id !== profile?.id && (
                        <button type="button" onClick={() => revokeMutation.mutate({ userId: user.id, assignment })} disabled={revokeMutation.isPending} aria-label={'Remove ' + roleLabels[assignment.role] + ' from ' + user.display_name} className="rounded p-0.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {revokeMutation.isError && <p role="alert" className="text-xs text-red-700">{errorMessage(revokeMutation.error)}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Users size={20} /></div>
            <p className="mt-3 font-bold text-[#172B4D]">No matching accounts</p>
            <p className="mt-1 text-xs text-slate-500">Try another search, or invite a new campus member.</p>
          </div>
        )}
      </div>
    </section>
  );
}
