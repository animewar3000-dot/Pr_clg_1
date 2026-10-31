import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, AlertCircle,
  FileText, MessageSquare, Search, Users, Wrench,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabase } from '../lib/supabase';

type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

type AnnouncementRecord = {
  id: string;
  title: string;
  priority: string;
  published_at: string;
};

type RoomRecord = {
  id: string;
  name: string;
  type: string;
};

type RoomMembership = {
  room: RoomRecord | null;
};

const quickActions = [
  { name: 'Campus rooms', description: 'Open your class and group spaces', href: '/rooms', icon: Users, tone: 'blue' },
  { name: 'Direct messages', description: 'Continue a private conversation', href: '/messages', icon: MessageSquare, tone: 'teal' },
  { name: 'Resource library', description: 'Find notes and study material', href: '/resources', icon: BookOpen, tone: 'amber' },
  { name: 'Lost & Found', description: 'Report or search for an item', href: '/lost-found', icon: Search, tone: 'coral' },
  { name: 'Request desk', description: 'Track a campus issue', href: '/request-desk', icon: Wrench, tone: 'navy' },
  { name: 'Events', description: 'Explore what is happening', href: '/events', icon: CalendarDays, tone: 'purple' },
];

const toneClasses: Record<string, string> = {
  blue: 'bg-[#E9F0FF] text-[#386BE8]',
  teal: 'bg-[#E4F5F1] text-[#128B81]',
  amber: 'bg-[#FFF3D9] text-[#9A6700]',
  coral: 'bg-[#FCEAE7] text-[#D84B3D]',
  navy: 'bg-[#E9EDF4] text-[#172B4D]',
  purple: 'bg-[#F0EAFE] text-[#7653C8]',
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function PanelHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-black tracking-[.18em] text-[#386BE8]">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#172B4D]">{title}</h2>
      </div>
      {href && linkLabel && <Link to={href} className="inline-flex items-center gap-1 text-xs font-extrabold text-[#386BE8] transition hover:gap-2">{linkLabel} <ArrowRight size={14} /></Link>}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3" aria-label="Loading campus data">
      {[0, 1, 2].map(item => <div key={item} className="flex gap-3 rounded-xl border border-slate-100 p-4"><div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" /></div></div>)}
    </div>
  );
}

export function DashboardPage() {
  const { profile, user } = useAuth();
  const supabase = getSupabase();
  const reducedMotion = useReducedMotion();
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] || 'there';

  const notificationsQuery = useQuery<NotificationRecord[]>({
    queryKey: ['notifications', user?.id, 'unread'],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, created_at')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as NotificationRecord[];
    },
    enabled: Boolean(supabase && user),
  });

  const announcementsQuery = useQuery<AnnouncementRecord[]>({
    queryKey: ['announcements', 'recent', user?.id, profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, priority, published_at')
        .eq('college_id', profile.college_id)
        .order('published_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data || []) as AnnouncementRecord[];
    },
    enabled: Boolean(supabase && profile),
  });

  const roomsQuery = useQuery<RoomMembership[]>({
    queryKey: ['rooms', 'my-rooms', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from('room_members')
        .select('room:rooms(id, name, type)')
        .eq('user_id', user.id)
        .limit(6);
      if (error) throw error;
      return (data || []) as unknown as RoomMembership[];
    },
    enabled: Boolean(supabase && user),
  });

  const rooms = useMemo(
    () => (roomsQuery.data || []).flatMap(membership => membership.room ? [membership.room] : []),
    [roomsQuery.data],
  );

  const reveal = reducedMotion ? {} : {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: .35, ease: 'easeOut' as const },
  };

  return (
    <div className="space-y-8">
      <motion.section {...reveal} className="relative overflow-hidden rounded-[2rem] bg-[#172B4D] p-6 text-white shadow-xl shadow-[#172B4D]/10 sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-28 h-80 w-80 rounded-full bg-[#386BE8]/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-[28%] h-40 w-40 rounded-full bg-[#14A89C]/20 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black tracking-[.16em] text-[#A9E7E0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75D7CC]" /> YOUR CAMPUS / TODAY
            </div>
            <h2 className="mt-6 text-4xl font-black leading-[.96] tracking-[-.045em] sm:text-5xl">Welcome back,<br /><span className="text-[#75D7CC]">{firstName}.</span></h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">Your campus conversations, learning resources and everyday services start here.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/rooms" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#F5A82E] px-5 text-sm font-extrabold text-[#13171F] transition hover:-translate-y-0.5 hover:bg-[#FFC45D]">Open campus rooms <ArrowRight size={16} /></Link>
              {profile?.campus_id && <span className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold text-white/80">ID · {profile.campus_id}</span>}
            </div>
            {profile?.account_status && profile.account_status !== 'active' && (
              <div className="mt-5 inline-flex max-w-xl items-start gap-2 rounded-xl border border-[#F5A82E]/30 bg-[#F5A82E]/10 px-4 py-3 text-xs leading-5 text-[#FFE2A7]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                Account status: <strong>{profile.account_status.replace(/_/g, ' ')}</strong>. Some campus features may remain restricted until verification is complete.
              </div>
            )}
          </div>
          <div className="relative hidden min-h-[245px] items-center justify-center lg:flex">
            <div className="absolute right-4 top-1 h-48 w-64 rotate-3 rounded-2xl border-2 border-[#13171F] bg-[#F8F5EC] p-5 text-[#13171F] shadow-[8px_8px_0_#13171F]">
              <p className="text-[10px] font-black tracking-[.17em] text-[#386BE8]">CAMPUSIQ / ISSUE 01</p>
              <p className="mt-5 text-3xl font-black uppercase leading-[.9]">Your day.<br />Your people.</p>
              <div className="mt-4 h-2 w-24 rounded bg-[#14A89C]" />
            </div>
            <div className="absolute bottom-0 left-1 rotate-[-7deg] rounded-xl border-2 border-[#13171F] bg-[#F55C4A] px-4 py-3 text-sm font-black text-white shadow-[4px_5px_0_#13171F]">LET'S MAKE IT COUNT</div>
            <div className="absolute right-0 top-0 grid grid-cols-7 gap-2 opacity-40" aria-hidden="true">
              {Array.from({ length: 35 }).map((_, index) => <span key={index} className="h-1.5 w-1.5 rounded-full bg-white" />)}
            </div>
          </div>
        </div>
      </motion.section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-black tracking-[.18em] text-[#386BE8]">CAMPUS TOOLKIT</p><h2 className="mt-2 text-xl font-extrabold text-[#172B4D]">Jump back in</h2></div>
          <p className="hidden text-xs font-medium text-slate-500 sm:block">Shortcuts to the places you use most.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action, index) => (
            <motion.div key={action.href} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .3, delay: reducedMotion ? 0 : index * .035 }}>
              <Link to={action.href} className="group flex h-full min-h-[150px] flex-col rounded-2xl border border-[#172B4D]/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-[#386BE8]/30 hover:shadow-lg hover:shadow-[#172B4D]/5">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClasses[action.tone]}`}><action.icon size={19} /></span>
                <span className="mt-5 text-sm font-extrabold text-[#172B4D]">{action.name}</span>
                <span className="mt-1 text-xs leading-5 text-slate-500">{action.description}</span>
                <ArrowRight size={15} className="mt-auto translate-x-0 text-[#386BE8] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-6">
          <PanelHeading eyebrow="KEEP AN EYE ON" title="Unread notifications" />
          <div className="mt-5">
            {notificationsQuery.isLoading ? <LoadingRows /> : notificationsQuery.isError ? (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Notifications could not be loaded. Refresh the page or check your connection.</div>
            ) : notificationsQuery.data?.length ? (
              <div className="space-y-3">
                {notificationsQuery.data.map(notification => (
                  <div key={notification.id} className="flex gap-3 rounded-xl bg-[#F8F5EC] p-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E9F0FF] text-[#386BE8]"><Bell size={17} /></span>
                    <div className="min-w-0 flex-1"><p className="font-bold text-[#172B4D]">{notification.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</p><p className="mt-2 text-[10px] font-semibold text-slate-400">{formatDate(notification.created_at)}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
                <CheckCircle2 size={22} className="mx-auto text-[#14A89C]" />
                <p className="mt-3 text-sm font-extrabold text-[#172B4D]">You’re all caught up.</p>
                <p className="mt-1 text-xs text-slate-500">Unread notifications will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-6">
          <PanelHeading eyebrow="FROM YOUR COLLEGE" title="Recent announcements" href="/announcements" linkLabel="View all" />
          <div className="mt-5">
            {announcementsQuery.isLoading ? <LoadingRows /> : announcementsQuery.isError ? (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Announcements could not be loaded. Refresh the page or check your connection.</div>
            ) : announcementsQuery.data?.length ? (
              <div className="space-y-3">
                {announcementsQuery.data.map(announcement => (
                  <div key={announcement.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-black tracking-widest text-[#386BE8]">OFFICIAL NOTICE</span>
                      {announcement.priority !== 'normal' && <span className="rounded-full bg-[#FFF3D9] px-2.5 py-1 text-[10px] font-black uppercase text-[#9A6700]">{announcement.priority}</span>}
                    </div>
                    <p className="mt-2 font-extrabold text-[#172B4D]">{announcement.title}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(announcement.published_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
                <FileText size={22} className="mx-auto text-[#386BE8]" />
                <p className="mt-3 text-sm font-extrabold text-[#172B4D]">No official notices yet.</p>
                <p className="mt-1 text-xs text-slate-500">Approved announcements will appear here when published.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-6">
        <PanelHeading eyebrow="YOUR COMMUNITY" title="Rooms you belong to" href="/rooms" linkLabel="Explore rooms" />
        <div className="mt-5">
          {roomsQuery.isLoading ? <LoadingRows /> : roomsQuery.isError ? (
            <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Your room memberships could not be loaded. Refresh the page or check your connection.</div>
          ) : rooms.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map(room => (
                <Link key={room.id} to={`/rooms/${room.id}`} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-[#386BE8]/30 hover:bg-[#F8FAFF]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#172B4D] text-white"><Users size={18} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-[#172B4D]">{room.name}</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{room.type.replace(/_/g, ' ')}</span></span>
                  <ArrowRight size={15} className="text-[#386BE8] transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-extrabold text-[#172B4D]">No room memberships yet.</p><p className="mt-1 text-sm text-slate-500">Rooms available to your academic profile will appear here.</p></div>
              <Link to="/rooms" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#172B4D] px-4 text-xs font-extrabold text-white transition hover:bg-[#386BE8]">Explore rooms <ArrowRight size={14} /></Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
