import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemReportSchema } from '../../lib/validations';
import { Plus, Search, MapPin, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import type { ItemReport } from '../../lib/types';
import type { z } from 'zod';

type FormData = z.infer<typeof itemReportSchema>;

export function LostFoundPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [claimingReportId, setClaimingReportId] = useState<string | null>(null);
  const [claimDescription, setClaimDescription] = useState('');

  const { data: reports, isLoading, isError: reportsError } = useQuery({
    queryKey: ['item-reports', profile?.college_id, filter, search],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      let query = supabase.from('item_reports').select('*, reporter:profiles!reporter_id(display_name)').eq('college_id', profile.college_id).order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('report_type', filter);
      if (search) query = query.ilike('title', `%${search}%`);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data || []) as ItemReport[];
    },
    enabled: !!supabase && !!profile,
  });

  const claimsQuery = useQuery({
    queryKey: ['my-item-claims', user?.id],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.rpc('list_my_item_claims');
      if (error) throw error;
      return (data || []) as Array<{ id: string; report_id: string; claimant_id: string; claimant_name: string; description: string; status: string; created_at: string }>;
    },
    enabled: Boolean(supabase && user && profile?.account_status === 'active'),
  });

  const claimMutation = useMutation({
    mutationFn: async ({ reportId, description }: { reportId: string; description: string }) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.rpc('claim_lost_found_item', { p_report_id: reportId, p_description: description });
      if (error) throw error;
    },
    onSuccess: async () => {
      setClaimingReportId(null);
      setClaimDescription('');
      await queryClient.invalidateQueries({ queryKey: ['item-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['my-item-claims'] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ claimId, decision }: { claimId: string; decision: 'verified' | 'rejected' }) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.rpc('review_item_claim', { p_claim_id: claimId, p_decision: decision });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['item-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['my-item-claims'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!supabase || !profile || !user) throw new Error('Not configured');
      const { error } = await supabase.from('item_reports').insert({
        college_id: profile.college_id,
        report_type: data.reportType,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        date: data.date,
        reporter_id: user.id,
        contact_preference: data.contactPreference,
        status: 'open',
        image_urls: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-reports'] });
      setShowCreate(false);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(itemReportSchema),
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Report Item
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Report an Item</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select {...register('reportType')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="lost">I Lost Something</option>
                  <option value="found">I Found Something</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input {...register('category')} placeholder="e.g., Electronics, Books, Keys" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input {...register('title')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input {...register('location')} placeholder="Where was it lost/found?" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" {...register('date')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.date && <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Preference</label>
              <select {...register('contactPreference')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="platform_message">Platform Message</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {(['all', 'lost', 'found'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded text-sm font-medium ${filter === f ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>

      {createMutation.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{createMutation.error instanceof Error ? createMutation.error.message : 'Report could not be submitted.'}</p>}
      {claimMutation.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{claimMutation.error instanceof Error ? claimMutation.error.message : 'Claim could not be submitted.'}</p>}
      {reviewMutation.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{reviewMutation.error instanceof Error ? reviewMutation.error.message : 'Claim decision could not be saved.'}</p>}
      {reportsError ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Lost & Found reports could not be loaded. Check your account approval and database migration status.</p>
      ) : isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading reports...</div>
      ) : !reports || reports.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No items reported yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${report.report_type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {report.report_type.toUpperCase()}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-2">{report.title}</h3>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{report.status}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{report.description}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{report.location}</span>
                <span>•</span>
                <span>{new Date(report.date).toLocaleDateString()}</span>
              </div>
              {report.reporter_id === user?.id && (claimsQuery.data || []).filter(claim => claim.report_id === report.id).length > 0 && (
                <div className="mt-4 rounded-xl border border-[#172B4D]/10 bg-[#F8FAFC] p-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#172B4D]"><ShieldCheck size={14} /> Ownership claims</p>
                  {(claimsQuery.data || []).filter(claim => claim.report_id === report.id && claim.status === 'pending').map(claim => (
                    <div key={claim.id} className="mt-3 border-t border-slate-200 pt-3">
                      <p className="text-sm font-bold text-[#172B4D]">{claim.claimant_name}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{claim.description}</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ claimId: claim.id, decision: 'verified' })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={13} /> Verify return</button>
                        <button type="button" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ claimId: claim.id, decision: 'rejected' })} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"><X size={13} /> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {report.reporter_id !== user?.id && report.status === 'open' && (
                <div className="mt-4">
                  {claimingReportId === report.id ? (
                    <div className="space-y-2 rounded-xl border border-[#386BE8]/20 bg-[#F4F7FF] p-3">
                      <label className="block text-xs font-bold text-[#172B4D]" htmlFor={`claim-${report.id}`}>Describe identifying details only the owner would know</label>
                      <textarea id={`claim-${report.id}`} value={claimDescription} onChange={event => setClaimDescription(event.target.value)} rows={3} maxLength={2000} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#386BE8]" placeholder="Describe distinguishing marks, contents or other proof…" />
                      <div className="flex gap-2">
                        <button type="button" disabled={claimDescription.trim().length < 10 || claimMutation.isPending} onClick={() => claimMutation.mutate({ reportId: report.id, description: claimDescription.trim() })} className="rounded-lg bg-[#386BE8] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{claimMutation.isPending ? 'Submitting…' : 'Submit private claim'}</button>
                        <button type="button" onClick={() => { setClaimingReportId(null); setClaimDescription(''); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setClaimingReportId(report.id); setClaimDescription(''); }} className="rounded-lg border border-[#386BE8]/20 bg-[#F4F7FF] px-3 py-2 text-xs font-bold text-[#2859CB]">I can identify this item</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
