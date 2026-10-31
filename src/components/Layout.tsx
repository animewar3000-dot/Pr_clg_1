import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight, Bell, BookOpen, Bot, CalendarDays, ChevronLeft,
  ChevronRight, Clock3, Command, GraduationationCap,
  Heart, LayoutDashboard, LogOut, Menu, MessageCircle, MessageSquare,
  Plus, Search, ShieldCheck, ShoppingBag, Users, Wrench, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  { label: 'OVERVIEW', items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  { label: 'COMMUNITY', items: [
    { name: 'Campus rooms', href: '/rooms', icon: Users },
    { name: 'Direct messages', href: '/messages', icon: MessageSquare },
    { name: 'Study groups', href: '/study-groups', icon: GraduationCap },
    { name: 'Clubs', href: '/clubs', icon: Heart },
  ] },
  { label: 'ACADEMICS', items: [
    { name: 'Resource library', href: '/resources', icon: BookOpen },
    { name: 'Timetable', href: '/timetable', icon: Clock3 },
  ] },
  { label: 'CAMPUS LIFE', items: [
    { name: 'Announcements', href: '/announcements', icon: Bell },
    { name: 'Events', href: '/events', icon: CalendarDays },
    { name: 'Lost & Found', href: '/lost-found', icon: Search },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  ] },
  { label: 'SERVICES', items: [
    { name: 'Request desk', href: '/request-desk', icon: Wrench },
    { name: 'Feedback', href: '/feedback', icon: MessageCircle },
  ] },
  { label: 'INTELLIGENCE', items: [
    { name: 'CampusIQ AI', href: '/ai-assistant', icon: Bot },
  ] },
];

const quickLinks: NavItem[] = navigation.flatMap(group => group.items);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

export function Layout() {
  const { user, profile, signOut, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const isAdmin = hasAnyRole(['college_admin', 'super_admin', 'department_admin']);
  const activeItem = quickLinks.find(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'));
  const sidebarWidth = collapsed ? 'lg:pl-[88px]' : 'lg:pl-[264px]';
  const userLabel = profile?.display_name || user?.email || 'Campus member';

  const filteredLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return quickLinks;
    return quickLinks.filter(item => item.name.toLowerCase().includes(query));
  }, [searchQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      const isSlash = event.key === '/' && !isTypingTarget(event.target);
      if (isCommandK || isSlash) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpen(false);
        setQuickActionsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Unable to sign out:', error);
    }
  };

  const closeOverlays = () => {
    setMobileOpen(false);
    setQuickActionsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F5EC] text-[#13171F]">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/10 bg-[#172B4D] text-white transition-[width] duration-200 lg:flex ${collapsed ? 'w-[88px]' : 'w-[264px]'}`}>
        <SidebarContent
          collapsed={collapsed}
          isAdmin={isAdmin}
          userLabel={userLabel}
          campusId={profile?.campus_id}
          onCollapse={() => setCollapsed(value => !value)}
          onSignOut={handleSignOut}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#13171F]/55 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={reducedMotion ? false : { x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: reducedMotion ? 0 : .22, ease: 'easeOut' }}
              className="flex h-full w-[min(86vw,310px)] flex-col bg-[#172B4D] text-white shadow-2xl"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#386BE8] text-xl font-black">C</span>
                  <span className="font-extrabold">CampusIQ</span>
                </div>
                <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close navigation"><X size={20} /></button>
              </div>
              <SidebarNavigation isAdmin={isAdmin} onNavigate={closeOverlays} />
              <SidebarAccount userLabel={userLabel} campusId={profile?.campus_id} onSignOut={handleSignOut} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`min-h-screen transition-[padding] duration-200 ${sidebarWidth}`}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-[#172B4D]/10 bg-[#F8F5EC]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#172B4D]/10 bg-white text-[#172B4D] lg:hidden" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="hidden text-[10px] font-black tracking-[.18em] text-[#386BE8] sm:block">YOUR CAMPUS / CONNECTED</p>
            <h1 className="truncate text-base font-extrabold text-[#172B4D]">{activeItem?.name || 'CampusIQ'}</h1>
          </div>
          <button type="button" onClick={() => setSearchOpen(true)} className="flex h-10 min-w-0 items-center gap-3 rounded-xl border border-[#172B4D]/10 bg-white px-3 text-left text-sm text-slate-500 transition hover:border-[#386BE8]/40 sm:w-[260px] lg:w-[320px]" aria-label="Search CampusIQ pages (Control or Command K)">
            <Search size={16} className="shrink-0" />
            <span className="flex-1 truncate">Search CampusIQ pages...</span>
            <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:inline-flex"><Command size={10} /> K</kbd>
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="hidden text-right md:block">
              <p className="max-w-[170px] truncate text-xs font-extrabold text-[#172B4D]">{userLabel}</p>
              <p className="text-[10px] font-semibold text-slate-500">{profile?.campus_id || 'Campus member'}</p>
            </div>
            <button type="button" onClick={() => navigate('/profile')} className="grid h-10 w-10 place-items-center rounded-xl bg-[#172B4D] text-sm font-black text-white transition hover:bg-[#386BE8]" aria-label="Open profile">
              {(profile?.display_name || user?.email || 'C').slice(0, 1).toUpperCase()}
            </button>
          </div>
          <div className="relative">
            <button type="button" onClick={() => setQuickActionsOpen(value => !value)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#386BE8] px-3 text-sm font-extrabold text-white shadow-lg shadow-[#386BE8]/15 transition hover:-translate-y-0.5 hover:bg-[#2859CB] sm:px-4">
              <Plus size={17} /> <span className="hidden sm:inline">Quick action</span>
            </button>
            <AnimatePresence>
              {quickActionsOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-2xl border border-[#172B4D]/10 bg-white p-2 shadow-2xl">
                  {[
                    { label: 'Report a lost / found item', href: '/lost-found', icon: Search },
                    { label: 'Raise a service request', href: '/request-desk', icon: Wrench },
                    { label: 'Browse academic resources', href: '/resources', icon: BookOpen },
                    { label: 'Open campus rooms', href: '/rooms', icon: Users },
                  ].map(item => (
                    <button key={item.href} type="button" onClick={() => { navigate(item.href); setQuickActionsOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-[#F0F4FF] hover:text-[#2859CB]">
                      <item.icon size={17} /> {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Mobile primary navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#172B4D]/10 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur lg:hidden">
        {[
          { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Rooms', href: '/rooms', icon: Users },
          { name: 'Inbox', href: '/messages', icon: MessageSquare },
          { name: 'Library', href: '/resources', icon: BookOpen },
        ].map(item => (
          <NavLink key={item.href} to={item.href} className={({ isActive }) => `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold ${isActive ? 'text-[#386BE8]' : 'text-slate-400'}`}>
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold text-slate-400">
          <Menu size={18} /> More
        </button>
      </nav>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center bg-[#13171F]/50 px-4 pt-[12vh] backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: -12, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: .98 }}
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#172B4D]/10 bg-white shadow-2xl"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <Search size={19} className="text-[#386BE8]" />
                <input autoFocus value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Find a CampusIQ page..." className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#172B4D] outline-none placeholder:font-normal placeholder:text-slate-400" aria-label="Search CampusIQ pages" />
                <button type="button" onClick={() => setSearchOpen(false)} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-black text-slate-400">ESC</button>
              </div>
              <div className="max-h-[52vh] overflow-y-auto p-2">
                {filteredLinks.length ? filteredLinks.map(item => (
                  <button key={item.href} type="button" onClick={() => { navigate(item.href); setSearchOpen(false); setSearchQuery(''); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#F0F4FF]">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E9F0FF] text-[#386BE8]"><item.icon size={17} /></span>
                    <span className="flex-1 text-sm font-bold text-[#172B4D]">{item.name}</span>
                    <ArrowUpRight size={15} className="text-slate-400" />
                  </button>
                )) : <p className="px-4 py-8 text-center text-sm text-slate-500">No pages match “{searchQuery}”.</p>}
                {isAdmin && (
                  <button type="button" onClick={() => { navigate('/admin'); setSearchOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#F0F4FF]">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F3EFFF] text-[#7653C8]"><ShieldCheck size={17} /></span>
                    <span className="flex-1 text-sm font-bold text-[#172B4D]">Administration</span>
                    <ArrowUpRight size={15} className="text-slate-400" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Quick navigation</span><span>ESC to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({
  collapsed,
  isAdmin,
  userLabel,
  campusId,
  onCollapse,
  onSignOut,
}: {
  collapsed: boolean;
  isAdmin: boolean;
  userLabel: string;
  campusId?: string | null;
  onCollapse: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`flex h-[72px] shrink-0 items-center border-b border-white/10 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#386BE8] text-2xl font-black text-white">C</span>
          {!collapsed && <div className="min-w-0"><p className="truncate text-base font-black tracking-tight">CampusIQ</p><p className="text-[9px] font-bold tracking-[.16em] text-white/50">YOUR CAMPUS. CONNECTED.</p></div>}
        </div>
        <button type="button" onClick={onCollapse} className={`hidden rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white ${collapsed ? 'lg:hidden' : 'lg:block'}`} aria-label="Collapse sidebar"><ChevronLeft size={17} /></button>
        {collapsed && <button type="button" onClick={onCollapse} className="hidden rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white lg:block" aria-label="Expand sidebar"><ChevronRight size={17} /></button>}
      </div>
      <SidebarNavigation collapsed={collapsed} isAdmin={isAdmin} />
      <SidebarAccount collapsed={collapsed} userLabel={userLabel} campusId={campusId} onSignOut={onSignOut} />
    </div>
  );
}

function SidebarNavigation({ collapsed = false, isAdmin, onNavigate }: { collapsed?: boolean; isAdmin: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="CampusIQ navigation" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {navigation.map(group => (
        <div key={group.label}>
          {!collapsed && <p className="mb-2 px-3 text-[9px] font-black tracking-[.18em] text-white/40">{group.label}</p>}
          <div className="space-y-1">
            {group.items.map(item => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                title={collapsed ? item.name : undefined}
                className={({ isActive }) => `group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-[#386BE8] text-white shadow-lg shadow-black/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {!collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#75D7CC] opacity-0 transition group-[.active]:opacity-100" />}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
      {isAdmin && (
        <div>
          {!collapsed && <p className="mb-2 px-3 text-[9px] font-black tracking-[.18em] text-white/40">GOVERNANCE</p>}
          <NavLink to="/admin" onClick={onNavigate} title={collapsed ? 'Administration' : undefined} className={({ isActive }) => `flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-[#7653C8] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <ShieldCheck size={18} className="shrink-0" />{!collapsed && <span>Administration</span>}
          </NavLink>
        </div>
      )}
    </nav>
  );
}

function SidebarAccount({ collapsed = false, userLabel, campusId, onSignOut }: { collapsed?: boolean; userLabel: string; campusId?: string | null; onSignOut: () => void }) {
  return (
    <div className={`shrink-0 border-t border-white/10 p-3 ${collapsed ? 'flex flex-col items-center' : ''}`}>
      <div className={`flex items-center gap-3 rounded-xl bg-white/5 p-3 ${collapsed ? 'justify-center' : ''}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#14A89C] text-sm font-black text-[#102C43]">{userLabel.slice(0, 1).toUpperCase()}</span>
        {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-white">{userLabel}</p><p className="truncate text-[10px] text-white/45">{campusId || 'Campus member'}</p></div>}
        <button type="button" onClick={onSignOut} title="Sign out" aria-label="Sign out" className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"><LogOut size={16} /></button>
      </div>
      {!collapsed && <p className="mt-3 px-2 text-[9px] font-bold tracking-widest text-white/30">CAMPUSIQ · PRIVATE CAMPUS SPACE</p>}
    </div>
  );
}
