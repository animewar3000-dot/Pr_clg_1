import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, Users } from 'lucide-react';
import type { Event } from '../../lib/types';

export function EventsPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('college_id', profile.college_id)
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(50);
      return (data || []) as Event[];
    },
    enabled: !!supabase && !!profile,
  });

  const { data: registrations } = useQuery({
    queryKey: ['event-registrations', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase.from('event_registrations').select('event_id').eq('user_id', user.id).eq('status', 'registered');
      return (data || []).map(d => d.event_id);
    },
    enabled: !!supabase && !!user,
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!supabase || !user) throw new Error('Not configured');
      const { error } = await supabase.from('event_registrations').insert({
        event_id: eventId,
        user_id: user.id,
        status: 'registered',
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-registrations'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Events</h1>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading events...</div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No upcoming events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => {
            const isRegistered = registrations?.includes(event.id);
            return (
              <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  {event.max_capacity && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>Max {event.max_capacity} participants</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  {isRegistered ? (
                    <span className="text-sm text-green-600 font-medium">✓ Registered</span>
                  ) : (
                    <button
                      onClick={() => registerMutation.mutate(event.id)}
                      disabled={registerMutation.isPending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Register
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
