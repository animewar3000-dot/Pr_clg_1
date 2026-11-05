import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Clock3, LogOut, ShieldCheck } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/config';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoomsPage } from './pages/communication/RoomsPage';
import { RoomDetailPage } from './pages/communication/RoomDetailPage';
import { MessagesPage } from './pages/communication/MessagesPage';
import { ResourcesPage } from './pages/academic/ResourcesPage';
import { AssignmentsPage } from './pages/academic/AssignmentsPage';
import { LostFoundPage } from './pages/services/LostFoundPage';
import { RequestDeskPage } from './pages/services/RequestDeskPage';
import { AnnouncementsPage } from './pages/campus/AnnouncementsPage';
import { EventsPage } from './pages/campus/EventsPage';
import { ClubsPage } from './pages/campus/ClubsPage';
import { MarketplacePage } from './pages/campus/MarketplacePage';
import { StudyGroupsPage } from './pages/campus/StudyGroupsPage';
import { TimetablePage } from './pages/campus/TimetablePage';
import { FeedbackPage } from './pages/campus/FeedbackPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/admin/AdminPage';
import { SetupGuidePage } from './pages/SetupGuidePage';
import { LandingPage } from './pages/LandingPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import NotFoundPage from './components/ui/page-not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


function AccountAccessScreen() {
  const { profile, accountStatus, isProfileLoading, error, signOut } = useAuth();

  if (isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F5EC] p-6">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#172B4D]/15 border-t-[#386BE8]" />
          <p className="mt-4 text-sm font-semibold text-slate-600">Checking your campus identity…</p>
        </div>
      </div>
    );
  }

  const pending = profile && accountStatus === 'pending_verification';
  const suspended = accountStatus === 'suspended';
  const title = !profile ? 'Campus profile unavailable' : pending ? 'Your application is being reviewed' : suspended ? 'Campus access is suspended' : 'Campus access is inactive';
  const description = !profile
    ? error || 'Your authentication account does not yet have a CampOS profile. Ask your college administrator to check the onboarding migration and college registration.'
    : pending
      ? 'Your email is registered, but a college administrator must verify your campus identity before you can access private rooms, messages or academic resources.'
      : suspended
        ? 'Your campus account has been suspended. Contact your college administrator if you believe this is a mistake.'
        : 'This campus account is no longer active. Contact your college administrator for assistance.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F5EC] p-5">
      <section className="w-full max-w-lg rounded-3xl border border-[#172B4D]/10 bg-white p-7 text-center shadow-[0_20px_70px_rgba(23,43,77,.09)] sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#E9F0FF] text-[#386BE8]">
          {!profile || suspended ? <AlertTriangle size={28} /> : pending ? <Clock3 size={28} /> : <ShieldCheck size={28} />}
        </div>
        <p className="mt-6 text-[10px] font-black tracking-[.2em] text-[#386BE8]">CAMPOS / ACCOUNT ACCESS</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-[#172B4D]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        {profile?.campus_id && <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">Campus ID: {profile.campus_id}</p>}
        <button type="button" onClick={() => void signOut()} className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#172B4D]/15 px-5 text-sm font-extrabold text-[#172B4D] transition hover:bg-slate-50">
          <LogOut size={16} /> Sign out
        </button>
      </section>
    </main>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, accountStatus, isLoading, isProfileLoading, isConfigured } = useAuth();
  const location = useLocation();

  // Keep the public landing page available even before Supabase is configured.
  // The actual account flows and all protected modules still require Supabase.
  if (location.pathname === "/" && !user && (!isConfigured || !isLoading)) {
    return <LandingPage />;
  }

  if (!isConfigured) {
    return <Navigate to="/setup" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isProfileLoading || !profile || accountStatus !== 'active') {
    return <AccountAccessScreen />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isConfigured } = useAuth();

  if (!isConfigured) {
    return <Navigate to="/setup" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Setup guide when Supabase is not configured */}
      <Route path="/setup" element={<SetupGuidePage />} />
      
      {/* Public auth routes */}
      <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Communication */}
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="messages" element={<MessagesPage />} />
        
        {/* Academic */}
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        
        {/* Services */}
        <Route path="lost-found" element={<LostFoundPage />} />
        <Route path="request-desk" element={<RequestDeskPage />} />
        
        {/* Campus */}
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="clubs" element={<ClubsPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="study-groups" element={<StudyGroupsPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        
        {/* AI */}
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        
        {/* Profile */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Admin */}
        <Route path="admin/*" element={<AdminPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
