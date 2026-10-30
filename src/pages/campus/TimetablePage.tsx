import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock } from 'lucide-react';
import type { TimetableEntry } from '../../lib/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TimetablePage() {
  const { profile } = useAuth();
  const supabase = getSupabase();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['timetable', profile?.section_id],
    queryFn: async () => {
      if (!supabase || !profile?.section_id) return [];
      const { data } = await supabase
        .from('timetable_entries')
        .select('*, subject:subjects(name, code), faculty:profiles!faculty_id(display_name)')
        .eq('section_id', profile.section_id)
        .eq('semester_id', profile.semester_id)
        .order('day_of_week')
        .order('start_time');
      return (data || []) as (TimetableEntry & { subject?: { name: string; code: string }; faculty?: { display_name: string } })[];
    },
    enabled: !!supabase && !!profile?.section_id,
  });

  const groupedByDay = entries?.reduce((acc, entry) => {
    if (!acc[entry.day_of_week]) acc[entry.day_of_week] = [];
    acc[entry.day_of_week].push(entry);
    return acc;
  }, {} as Record<number, typeof entries>);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading timetable...</div>
      ) : !profile?.section_id ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Your section has not been assigned yet. Contact administration.</p>
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No timetable entries available for your section.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDay || {}).map(([day, dayEntries]) => (
            <div key={day} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{DAYS[parseInt(day)]}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {(dayEntries as typeof entries)?.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex items-center gap-4">
                    <span className="text-sm font-mono text-gray-500 w-28">
                      {entry.start_time} - {entry.end_time}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{entry.subject?.name || 'TBD'}</p>
                      <p className="text-xs text-gray-500">{entry.subject?.code} • {entry.faculty?.display_name || 'TBD'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
