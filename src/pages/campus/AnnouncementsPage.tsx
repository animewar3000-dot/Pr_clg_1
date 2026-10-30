import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Megaphone } from 'lucide-react';
import type { Announcement } from '../../lib/types';

export function AnnouncementsPage() {
  const { profile } = useAuth();
  const supabase = getSupabase();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data } = await supabase
        .from('announcements')
        .select('*, publisher:profiles!published_by(display_name)')
        .eq('college_id', profile.college_id)
        .order('published_at', { ascending: false })
        .limit(50);
      return (data || []) as Announcement[];
    },
    enabled: !!supabase && !!profile,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading announcements...</div>
      ) : !announcements || announcements.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {a.priority !== 'normal' && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {a.priority.toUpperCase()}
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a.scope}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mt-2">{a.title}</h2>
                </div>
                <span className="text-xs text-gray-500">{new Date(a.published_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 mt-3 whitespace-pre-wrap">{a.content}</p>
              <p className="text-xs text-gray-400 mt-3">
                Published by {(a.publisher as { display_name?: string })?.display_name || 'Administration'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
