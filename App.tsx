
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { TeamProvider } from './contexts/TeamContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Pages
import LoginPage from './app/login/page';
import SignupPage from './app/signup/page';
import VerifyOtpPage from './app/verify-otp/page';
import ForgotPasswordPage from './app/forgot-password/page';
import DashboardPage from './app/dashboard/page';
import CreateEventPage from './app/create-event/page';
import MyEventsPage from './app/my-events/page';
import EventDetailsPage from './app/event-details/page';
import EmailSimulationPage from './app/email-simulation/page';
import ShareEventPage from './app/share-event/page';
import GuestAccessPage from './app/guest-access/page';
import GuestGalleryPage from './app/guest-gallery/page';
import ClientAccessPage from './app/client-access/page';
import ClientGalleryPage from './app/client-gallery/page';
import TeamPage from './app/team/page';
import AcceptInvitationPage from './app/accept-invitation/page';
import BrandingPage from './app/branding/page';
import AddBrandingPage from './app/branding/add/page';
import WorkspacesPage from './app/workspaces/page';
import CreateWorkspacePage from './app/workspaces/create/page';
import MediaViewPage from './app/media-view/page';
import AnalyticsPage from './app/analytics/page';
import SettingsPage from './app/settings/page';
import GlobalCalendarPage from './app/calendar/page';
import StudioCalendarPage from './app/studio-calendar/page';
import CompleteProfilePage from './app/complete-profile/page';
import SetPasswordPage from './app/set-password/page';

// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated, needsProfileCompletion } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }
  return <Outlet />;
};

// Public Route Component (redirects to workspaces if already logged in)
const PublicRoute = () => {
  const { isAuthenticated, needsProfileCompletion } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={needsProfileCompletion ? "/complete-profile" : "/workspaces"} replace />;
  }
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      
      {/* Publicly accessible pages */}
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/email-simulation" element={<EmailSimulationPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/roles" element={<WorkspacesPage />} />
        <Route path="/all-members" element={<WorkspacesPage />} />
        <Route path="/guest-data" element={<WorkspacesPage />} />
        <Route path="/calendar" element={<GlobalCalendarPage />} />
        
        <Route path="/workspaces/create" element={<CreateWorkspacePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/studio-calendar" element={<StudioCalendarPage />} />
        <Route path="/events/:slug" element={<EventDetailsPage />} />
        <Route path="/events/:slug/:collectionSlug" element={<EventDetailsPage />} />
        <Route path="/events/:slug/:collectionSlug/view/:mediaId" element={<MediaViewPage viewContext="event" />} />
        
        <Route path="/share-event/:eventId" element={<ShareEventPage />} />
        
        <Route path="/guest-access/:eventId" element={<GuestAccessPage />} />
        <Route path="/guest-gallery/:eventId" element={<GuestGalleryPage />} />
        <Route path="/guest-gallery/:eventId/view/:mediaId" element={<MediaViewPage viewContext="guest" />} />
        
        <Route path="/client-access/:eventId" element={<ClientAccessPage />} />
        <Route path="/client-gallery/:eventId" element={<ClientGalleryPage />} />
        <Route path="/client-gallery/:eventId/view/:mediaId" element={<MediaViewPage viewContext="client" />} />
        
        <Route path="/team" element={<TeamPage />} />
        <Route path="/branding" element={<BrandingPage />} />
        <Route path="/branding/add" element={<AddBrandingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <TeamProvider>
          <WorkspaceProvider>
            <Router>
              <AppRoutes />
            </Router>
          </WorkspaceProvider>
        </TeamProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
