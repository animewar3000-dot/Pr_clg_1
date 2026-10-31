import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketCreateSchema } from '../../lib/validations';
import { Plus, Wrench } from 'lucide-react';
import type { Ticket, TicketCategory } from '../../lib/types';
import type { z } from 'zod';

type FormData = z.infer<typeof ticketCreateSchema>;

export function RequestDeskPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'my' | 'all'>('my');

  const { data: categories, isError: categoriesError } = useQuery({
    queryKey: ['ticket-categories', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data, error } = await supabase.from('ticket_categories').select('*').eq('college_id', profile.college_id).eq('is_active', true);
      if (error) throw error;
      return (data || []) as TicketCategory[];
    },
    enabled: !!supabase && !!profile,
  });

  const { data: tickets, isLoading, isError: ticketsError } = useQuery({
    queryKey: ['tickets', profile?.college_id, user?.id, filter],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      let query = supabase.from('tickets').select('*').eq('college_id', profile.college_id).order('created_at', { ascending: false });
      if (filter === 'my' && user) query = query.eq('requester_id', user.id);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data || []) as Ticket[];
    },
    enabled: !!supabase && !!profile,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!supabase || !profile || !user) throw new Error('Not configured');
      const { error } = await supabase.from('tickets').insert({
        college_id: profile.college_id,
        requester_id: user.id,
        category_id: data.categoryId,
        title: data.title,
        description: data.description,
        location: data.location || null,
        priority: data.priority,
        status: 'submitted',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowCreate(false);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(ticketCreateSchema),
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-indigo-100 text-indigo-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Request Desk</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Submit a Request</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('categoryId')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select a category</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input {...register('title')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input {...register('location')} placeholder="e.g., Block A, Room 203" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select {...register('priority')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setFilter('my')} className={`px-3 py-1.5 rounded text-sm font-medium ${filter === 'my' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>My Requests</button>
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded text-sm font-medium ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>All Requests</button>
      </div>

      {createMutation.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{createMutation.error instanceof Error ? createMutation.error.message : 'Request could not be submitted.'}</p>}
      {categoriesError || ticketsError ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Request Desk data could not be loaded. Check your account approval and database migration status.</p>
      ) : isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading tickets...</div>
      ) : !tickets || tickets.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">{ticket.public_id}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>{ticket.status.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-1">{ticket.title}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${ticket.priority === 'critical' ? 'bg-red-100 text-red-700' : ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                  {ticket.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{ticket.description}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(ticket.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
