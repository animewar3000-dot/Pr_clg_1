import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isConfigured } = useAuth();
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
      <Route path="*" element={<Navigate to="/" replace />} />
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
