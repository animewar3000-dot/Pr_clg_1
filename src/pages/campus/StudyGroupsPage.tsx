import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studyGroupSchema } from '../../lib/validations';
import { Plus, GraduationCap, Users } from 'lucide-react';
import { useState } from 'react';
import type { StudyGroup } from '../../lib/types';
import type { z } from 'zod';

type FormData = z.infer<typeof studyGroupSchema>;

export function StudyGroupsPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: groups, isLoading } = useQuery({
    queryKey: ['study-groups', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data } = await supabase.from('study_groups').select('*').eq('college_id', profile.college_id).order('created_at', { ascending: false });
      return (data || []) as StudyGroup[];
    },
    enabled: !!supabase && !!profile,
  });

  const { data: memberships } = useQuery({
    queryKey: ['study-group-memberships', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase.from('study_group_members').select('group_id').eq('user_id', user.id);
      return (data || []).map(d => d.group_id);
    },
    enabled: !!supabase && !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!supabase || !user) throw new Error('Not configured');
      const { error } = await supabase.from('study_group_members').insert({ group_id: groupId, user_id: user.id, role: 'member' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study-group-memberships'] }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!supabase || !profile || !user) throw new Error('Not configured');
      const { error } = await supabase.from('study_groups').insert({
        college_id: profile.college_id,
        name: data.name,
        description: data.description,
        subject_id: data.subjectId || null,
        max_members: data.maxMembers,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      setShowCreate(false);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(studyGroupSchema) as any,
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Study Groups</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Group
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Create Study Group</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
              <input type="number" {...register('maxMembers', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading groups...</div>
      ) : !groups || groups.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No study groups yet. Create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const isMember = memberships?.includes(group.id);
            return (
              <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600 mt-2">{group.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="h-3 w-3" /> Max {group.max_members} members
                  </span>
                  {isMember ? (
                    <span className="text-xs text-green-600 font-medium">✓ Joined</span>
                  ) : (
                    <button onClick={() => joinMutation.mutate(group.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Join</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
