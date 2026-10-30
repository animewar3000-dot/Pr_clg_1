import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feedbackSchema } from '../../lib/validations';
import { MessageCircle } from 'lucide-react';
import type { FeedbackSubmission } from '../../lib/types';
import type { z } from 'zod';

type FormData = z.infer<typeof feedbackSchema>;

export function FeedbackPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const { data: myFeedback } = useQuery({
    queryKey: ['feedback', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase.from('feedback_submissions').select('*').eq('submitter_id', user.id).order('created_at', { ascending: false });
      return (data || []) as FeedbackSubmission[];
    },
    enabled: !!supabase && !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!supabase || !profile) throw new Error('Not configured');
      const { error } = await supabase.from('feedback_submissions').insert({
        college_id: profile.college_id,
        submitter_id: data.isAnonymous ? null : user?.id,
        category: data.category,
        title: data.title,
        content: data.content,
        is_anonymous: data.isAnonymous,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setSubmitted(true);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(feedbackSchema) as any,
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  if (submitted) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <div className="text-green-500 text-4xl mb-3">✓</div>
          <p className="text-gray-700 font-medium">Thank you for your feedback!</p>
          <p className="text-sm text-gray-500 mt-1">Your submission has been received and will be reviewed.</p>
          <button onClick={() => setSubmitted(false)} className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Feedback & Suggestions</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Submit Feedback</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select category</option>
                <option value="academic">Academic</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="platform">Platform Feature</option>
                <option value="general">General</option>
              </select>
              {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2">
                <input type="checkbox" {...register('isAnonymous')} className="rounded" />
                <span className="text-sm text-gray-700">Submit anonymously</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input {...register('title')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Feedback</label>
            <textarea {...register('content')} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            {errors.content && <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>}
          </div>
          <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {createMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      {myFeedback && myFeedback.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Submissions</h2>
          <div className="space-y-3">
            {myFeedback.map((fb) => (
              <div key={fb.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{fb.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${fb.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : fb.status === 'responded' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {fb.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{fb.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
