import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { Shield, Users, FileText, AlertTriangle } from 'lucide-react';

export function AdminPage() {
  const { hasAnyRole, profile } = useAuth();
  const supabase = getSupabase();
  const isAdmin = hasAnyRole(['college_admin', 'super_admin', 'department_admin']);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return null;
      const [users, tickets, resources, pending] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('college_id', profile.college_id),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('college_id', profile.college_id),
        supabase.from('resources').select('id', { count: 'exact', head: true }).eq('college_id', profile.college_id),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('college_id', profile.college_id).eq('account_status', 'pending_verification'),
      ]);
      return {
        totalUsers: users.count || 0,
        totalTickets: tickets.count || 0,
        totalResources: resources.count || 0,
        pendingVerifications: pending.count || 0,
      };
    },
    enabled: !!supabase && !!profile && isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-1">You do not have administrative privileges.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Administration</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">{stats?.pendingVerifications || 0}</p>
              <p className="text-sm text-gray-500">Pending Verifications</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalTickets || 0}</p>
              <p className="text-sm text-gray-500">Tickets</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalResources || 0}</p>
              <p className="text-sm text-gray-500">Resources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">User Management</h2>
          <p className="text-sm text-gray-600 mb-4">Verify accounts, manage roles, and handle suspensions.</p>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Pending Verifications ({stats?.pendingVerifications || 0})</button>
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Role Assignments</button>
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Account Suspensions</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Institutional Structure</h2>
          <p className="text-sm text-gray-600 mb-4">Manage departments, programs, sections, and subjects.</p>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Departments</button>
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Programs & Sections</button>
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Subjects</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Content Moderation</h2>
          <p className="text-sm text-gray-600 mb-4">Review pending resources and reported content.</p>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Pending Resources</button>
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Reports</button>
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Announcements</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">System Configuration</h2>
          <p className="text-sm text-gray-600 mb-4">Configure college settings and integrations.</p>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">College Settings</button>
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">Ticket Categories</button>
            <button className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50">AI Configuration</button>
          </div>
        </div>
      </div>
    </div>
  );
}
