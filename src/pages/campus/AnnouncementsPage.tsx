import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, X, CalendarClock, AlertCircle } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement } from '../../lib/types';

export function AnnouncementsPage() {
  const { user, profile, hasAnyRole } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [expiresAt, setExpiresAt] = useState('');

  const canPublish = hasAnyRole(['faculty', 'department_admin', 'college_admin', 'super_admin']);

  const announcementsQuery = useQuery({
    queryKey: ['announcements', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('college_id', profile.college_id)
        .order('published_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Announcement[];
    },
    enabled: Boolean(supabase && profile),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !profile || !user) throw new Error('Sign in with an authorized faculty or administrator account.');
      if (title.trim().length < 4 || content.trim().length < 10) throw new Error('Add a clear title and at least 10 characters of announcement content.');
      const { error } = await supabase.from('announcements').insert({
        college_id: profile.college_id,
        title: title.trim(),
        content: content.trim(),
        scope: 'college',
        scope_id: null,
        priority,
        published_by: user.id,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setTitle('');
      setContent('');
      setPriority('normal');
      setExpiresAt('');
      setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ['announcements', profile?.college_id] });
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publishMutation.isPending) publishMutation.mutate();
  };

  const announcements = announcementsQuery.data || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[.2em] text-[#386BE8]">CAMPOS / OFFICIAL BULLETIN</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#172B4D]">Announcements</h1>
          <p className="mt-2 text-sm text-slate-500">Official updates published by authorized campus staff.</p>
        </div>
        {canPublish && (
          <button type="button" onClick={() => setShowCreate(value => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#386BE8] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#2859CB]">
            {showCreate ? <X size={16} /> : <Plus size={16} />} {showCreate ? 'Close' : 'Publish announcement'}
          </button>
        )}
      </header>

      {showCreate && canPublish && (
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-[10px] font-black tracking-[.16em] text-[#386BE8]">NEW OFFICIAL NOTICE</p>
            <h2 className="mt-1 text-xl font-black text-[#172B4D]">Publish to the college bulletin</h2>
            <p className="mt-1 text-xs text-slate-500">This first release publishes college-wide notices. Department and section targeting will be added with the academic directory configuration.</p>
          </div>
          <div>
            <label htmlFor="announcement-title" className="text-sm font-bold text-[#172B4D]">Title</label>
            <input id="announcement-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required minLength={4} className="mt-2 w-full rounded-xl border border-[#172B4D]/15 px-4 py-3 text-sm outline-none focus:border-[#386BE8]" placeholder="e.g. Semester examination timetable" />
          </div>
          <div>
            <label htmlFor="announcement-content" className="text-sm font-bold text-[#172B4D]">Announcement</label>
            <textarea id="announcement-content" value={content} onChange={event => setContent(event.target.value)} maxLength={10000} required minLength={10} rows={5} className="mt-2 w-full rounded-xl border border-[#172B4D]/15 px-4 py-3 text-sm outline-none focus:border-[#386BE8]" placeholder="Write the official details, dates and instructions…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="announcement-priority" className="text-sm font-bold text-[#172B4D]">Priority</label>
              <select id="announcement-priority" value={priority} onChange={event => setPriority(event.target.value as typeof priority)} className="mt-2 w-full rounded-xl border border-[#172B4D]/15 bg-white px-4 py-3 text-sm">
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label htmlFor="announcement-expiry" className="text-sm font-bold text-[#172B4D]">Expiry (optional)</label>
              <input id="announcement-expiry" type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} min={new Date().toISOString().slice(0,16)} className="mt-2 w-full rounded-xl border border-[#172B4D]/15 bg-white px-4 py-3 text-sm" />
            </div>
          </div>
          {publishMutation.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{publishMutation.error instanceof Error ? publishMutation.error.message : 'Announcement could not be published.'}</p>}
          <button type="submit" disabled={publishMutation.isPending || title.trim().length < 4 || content.trim().length < 10} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#172B4D] px-5 text-sm font-extrabold text-white transition hover:bg-[#386BE8] disabled:opacity-50">
            <Megaphone size={16} /> {publishMutation.isPending ? 'Publishing…' : 'Publish official notice'}
          </button>
        </form>
      )}

      {announcementsQuery.isError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Announcements could not be loaded. Check your campus approval and database policies.</div>
      ) : announcementsQuery.isLoading ? (
        <div className="space-y-3">{[0,1,2].map(item => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : announcements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#172B4D]/15 bg-white px-6 py-14 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-[#172B4D]">The bulletin is quiet</h2>
          <p className="mt-2 text-sm text-slate-500">Official campus announcements will appear here when published.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => (
            <article key={announcement.id} className="rounded-2xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' : announcement.priority === 'important' ? 'bg-amber-100 text-amber-800' : 'bg-[#E9F0FF] text-[#386BE8]'}`}>{announcement.priority}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">College-wide</span>
                </div>
                <span className="text-xs text-slate-400">{new Date(announcement.published_at).toLocaleString()}</span>
              </div>
              <h2 className="mt-3 text-xl font-black text-[#172B4D]">{announcement.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{announcement.content}</p>
              {announcement.expires_at && (
                <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400"><CalendarClock size={14} /> Expires {new Date(announcement.expires_at).toLocaleString()}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
