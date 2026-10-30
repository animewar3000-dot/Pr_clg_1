import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Users } from 'lucide-react';
import type { Club } from '../../lib/types';

export function ClubsPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  const { data: clubs, isLoading } = useQuery({
    queryKey: ['clubs', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data } = await supabase.from('clubs').select('*').eq('college_id', profile.college_id).order('name');
      return (data || []) as Club[];
    },
    enabled: !!supabase && !!profile,
  });

  const { data: memberships } = useQuery({
    queryKey: ['club-memberships', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase.from('club_memberships').select('club_id').eq('user_id', user.id);
      return (data || []).map(d => d.club_id);
    },
    enabled: !!supabase && !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async (clubId: string) => {
      if (!supabase || !user) throw new Error('Not configured');
      const { error } = await supabase.from('club_memberships').insert({ club_id: clubId, user_id: user.id, role: 'member' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['club-memberships'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Clubs & Communities</h1>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading clubs...</div>
      ) : !clubs || clubs.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No clubs available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => {
            const isMember = memberships?.includes(club.id);
            return (
              <div key={club.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900">{club.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">{club.category}</span>
                <p className="text-sm text-gray-600 mt-2">{club.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {club.member_count} members
                  </span>
                  {isMember ? (
                    <span className="text-xs text-green-600 font-medium">✓ Member</span>
                  ) : (
                    <button onClick={() => joinMutation.mutate(club.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Join Club
                    </button>
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
