import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemReportSchema } from '../../lib/validations';
import { Plus, Search, MapPin } from 'lucide-react';
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

  const { data: reports, isLoading } = useQuery({
    queryKey: ['item-reports', profile?.college_id, filter, search],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      let query = supabase.from('item_reports').select('*, reporter:profiles!reporter_id(display_name)').eq('college_id', profile.college_id).order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('report_type', filter);
      if (search) query = query.ilike('title', `%${search}%`);
      const { data } = await query.limit(50);
      return (data || []) as ItemReport[];
    },
    enabled: !!supabase && !!profile,
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

      {isLoading ? (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
