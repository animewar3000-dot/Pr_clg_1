import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { MessageSquare, BookOpen, Megaphone, Calendar, Users, Bell } from 'lucide-react';

export function DashboardPage() {
  const { profile, user } = useAuth();
  const supabase = getSupabase();

  // Fetch recent notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!supabase && !!user,
  });

  // Fetch recent announcements
  const { data: announcements } = useQuery({
    queryKey: ['announcements', 'recent'],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('college_id', profile.college_id)
        .order('published_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!supabase && !!profile,
  });

  // Fetch user's rooms
  const { data: rooms } = useQuery({
    queryKey: ['rooms', 'my-rooms', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from('room_members')
        .select('room:rooms(*)')
        .eq('user_id', user.id)
        .limit(5);
      return data || [];
    },
    enabled: !!supabase && !!user,
  });

  const quickLinks = [
    { name: 'Messages', href: '/messages', icon: MessageSquare, color: 'text-blue-600' },
    { name: 'Resources', href: '/resources', icon: BookOpen, color: 'text-green-600' },
    { name: 'Announcements', href: '/announcements', icon: Megaphone, color: 'text-orange-600' },
    { name: 'Events', href: '/events', icon: Calendar, color: 'text-purple-600' },
    { name: 'Rooms', href: '/rooms', icon: Users, color: 'text-indigo-600' },
    { name: 'Notifications', href: '/dashboard', icon: Bell, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.display_name || 'Student'}
        </h1>
        {profile?.campus_id && (
          <p className="text-sm text-gray-500 mt-1">CampusIQ ID: {profile.campus_id}</p>
        )}
        {profile?.account_status === 'pending_verification' && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded text-sm">
            Your account is pending verification. Some features may be restricted until approved.
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-md transition-shadow"
          >
            <link.icon className={`h-6 w-6 mx-auto mb-2 ${link.color}`} />
            <span className="text-sm font-medium text-gray-700">{link.name}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
          {!notifications || notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No unread notifications</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: { id: string; title: string; body: string; created_at: string }) => (
                <div key={n.id} className="border-l-2 border-blue-500 pl-3 py-1">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h2>
          {!announcements || announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a: { id: string; title: string; priority: string; published_at: string }) => (
                <div key={a.id} className="border-l-2 border-orange-500 pl-3 py-1">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500">
                    {a.priority !== 'normal' && <span className="text-orange-600 font-medium">[{a.priority}] </span>}
                    {new Date(a.published_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Rooms */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Rooms</h2>
          <Link to="/rooms" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
        </div>
        {!rooms || rooms.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven't joined any rooms yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map((r: any) => (
              <Link
                key={r.room.id}
                to={`/rooms/${r.room.id}`}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-sm"
              >
                <p className="font-medium text-sm text-gray-900">{r.room.name}</p>
                <p className="text-xs text-gray-500">{r.room.type.replace(/_/g, ' ')}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
