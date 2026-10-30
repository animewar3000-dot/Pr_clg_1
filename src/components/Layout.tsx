import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, MessageSquare, Users, BookOpen, Search, 
  Wrench, Megaphone, Calendar, Heart, ShoppingBag, GraduationCap,
  Clock, MessageCircle, Bot, User, Shield, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Rooms', href: '/rooms', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Resources', href: '/resources', icon: BookOpen },
  { name: 'Lost & Found', href: '/lost-found', icon: Search },
  { name: 'Request Desk', href: '/request-desk', icon: Wrench },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Clubs', href: '/clubs', icon: Heart },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { name: 'Study Groups', href: '/study-groups', icon: GraduationCap },
  { name: 'Timetable', href: '/timetable', icon: Clock },
  { name: 'Feedback', href: '/feedback', icon: MessageCircle },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
];

export function Layout() {
  const { user, profile, signOut, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = hasAnyRole(['college_admin', 'super_admin', 'department_admin']);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <SidebarContent navigation={navigation} onNavigate={() => setSidebarOpen(false)} isAdmin={isAdmin} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
          <SidebarContent navigation={navigation} isAdmin={isAdmin} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 h-16 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {profile?.display_name || user?.email}
            </span>
            {profile?.campus_id && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {profile.campus_id}
              </span>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <User className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Sign out"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SidebarContent({ navigation, onNavigate, isAdmin }: { 
  navigation: NavItem[]; 
  onNavigate?: () => void;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">CampusIQ</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <Shield className="h-5 w-5 mr-3 flex-shrink-0" />
            Administration
          </NavLink>
        )}
      </nav>
    </div>
  );
}
