
import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { TeamProvider } from './contexts/TeamContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BillingProvider } from './contexts/BillingContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { EventsProvider } from './contexts/EventsContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { ToastProvider } from './contexts/ToastContext';
import { SessionExpiredModal } from './components/ui/SessionExpiredModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageLoader } from './components/ui/PageLoader';

// Pages - lazy loaded for route-based code splitting
const LoginPage = lazy(() => import('./app/login/page'));
const SignupPage = lazy(() => import('./app/signup/page'));
const VerifyOtpPage = lazy(() => import('./app/verify-otp/page'));
const ForgotPasswordPage = lazy(() => import('./app/forgot-password/page'));
const DashboardPage = lazy(() => import('./app/dashboard/page'));
const CreateEventPage = lazy(() => import('./app/create-event/page'));
const MyEventsPage = lazy(() => import('./app/my-events/page'));
const EventDetailsPage = lazy(() => import('./app/event-details/page'));
const ShareEventPage = lazy(() => import('./app/share-event/page'));
const GuestAccessPage = lazy(() => import('./app/guest-access/page'));
const GuestGalleryPage = lazy(() => import('./app/guest-gallery/page'));
const ClientAccessPage = lazy(() => import('./app/client-access/page'));
const ClientGalleryPage = lazy(() => import('./app/client-gallery/page'));
const TeamPage = lazy(() => import('./app/team/page'));
const AcceptInvitationPage = lazy(() => import('./app/accept-invitation/page'));
const BrandingPage = lazy(() => import('./app/branding/page'));
const AddBrandingPage = lazy(() => import('./app/branding/add/page'));
const WorkspacesPage = lazy(() => import('./app/workspaces/page'));
const CreateWorkspacePage = lazy(() => import('./app/workspaces/create/page'));
const MediaViewPage = lazy(() => import('./app/media-view/page'));
const AnalyticsPage = lazy(() => import('./app/analytics/page'));
const SettingsPage = lazy(() => import('./app/settings/page'));
const GlobalCalendarPage = lazy(() => import('./app/calendar/page'));
const StudioCalendarPage = lazy(() => import('./app/studio-calendar/page'));
const CompleteProfilePage = lazy(() => import('./app/complete-profile/page'));
const SetPasswordPage = lazy(() => import('./app/set-password/page'));

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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Publicly accessible pages */}
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

        <Route path="/guest-access/:eventId" element={<GuestAccessPage />} />
        <Route path="/guest-gallery/:eventId" element={<GuestGalleryPage />} />
        <Route path="/guest-gallery/:eventId/view/:mediaId" element={<MediaViewPage viewContext="guest" />} />

        <Route path="/client-access/:eventId" element={<ClientAccessPage />} />
        <Route path="/client-gallery/:eventId" element={<ClientGalleryPage />} />
        <Route path="/client-gallery/:eventId/view/:mediaId" element={<MediaViewPage viewContext="client" />} />

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

          <Route path="/team" element={<TeamPage />} />
          <Route path="/branding" element={<BrandingPage />} />
          <Route path="/branding/add" element={<AddBrandingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <LanguageProvider>
            <TeamProvider>
              <PermissionsProvider>
                <WorkspaceProvider>
                  <BillingProvider>
                    <BrandingProvider>
                      <EventsProvider>
                        <Router>
                          <AppRoutes />
                          {/* Global session expired modal */}
                          <SessionExpiredModal />
                        </Router>
                      </EventsProvider>
                    </BrandingProvider>
                  </BillingProvider>
                </WorkspaceProvider>
              </PermissionsProvider>
            </TeamProvider>
          </LanguageProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
