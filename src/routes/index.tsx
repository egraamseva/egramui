/**
 * Application Routes
 * Defines all routes for the application with lazy loading for better performance
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/main/ProtectedRoute';

// Loading component for lazy routes
const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Helper function to create lazy-loaded components with error handling and retry logic
const createLazyComponent = (importFn: () => Promise<any>, componentName: string) => {
  return lazy(async () => {
    try {
      const module = await importFn();
      // Handle both default and named exports
      const component = module.default || module[componentName];
      if (!component) {
        throw new Error(`Component ${componentName} not found in module`);
      }
      return { default: component };
    } catch (error: any) {
      console.error(`Failed to load ${componentName}:`, error);
      
      // Retry once after a short delay
      if (error.message?.includes('Failed to fetch') || error.message?.includes('dynamically imported')) {
        console.log(`Retrying load for ${componentName}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const module = await importFn();
          const component = module.default || module[componentName];
          if (component) {
            return { default: component };
          }
        } catch (retryError) {
          console.error(`Retry failed for ${componentName}:`, retryError);
        }
      }
      
      // Return a fallback component that shows an error message
      return {
        default: () => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Failed to load page</h2>
              <p className="text-muted-foreground mb-4">
                The page failed to load. Please refresh the page or contact support if the problem persists.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      };
    }
  });
};

// Lazy load pages - these will be split into separate chunks
// Public pages (loaded on demand)
const LandingPage = createLazyComponent(() => import('@/components/main/LandingPage'), 'LandingPage');
const RegistrationFlow = createLazyComponent(() => import('@/components/main/RegistrationFlow'), 'RegistrationFlow');
const AllPanchayatsPage = createLazyComponent(() => import('@/components/main/AllPanchayatsPage'), 'AllPanchayatsPage');
const PanchayatWebsite = createLazyComponent(() => import('@/components/public/PanchayatWebsite'), 'PanchayatWebsite');
const Login = createLazyComponent(() => import('@/components/main/Login'), 'Login');
const ForgotPassword = createLazyComponent(() => import('@/components/main/ForgotPassword'), 'ForgotPassword');
const ResetPassword = createLazyComponent(() => import('@/components/main/ResetPassword'), 'ResetPassword');
const SuccessPage = createLazyComponent(() => import('../pages/SuccessPage'), 'SuccessPage');
const TestAPIPage = createLazyComponent(() => import('../pages/TestAPIPage'), 'TestAPIPage');

// Dashboard pages (heavy components - definitely should be lazy loaded)
const SachivDashboardLayout = createLazyComponent(() => import('@/components/sachiv/SachivDashboardLayout'), 'SachivDashboardLayout');
const DashboardPage = createLazyComponent(() => import('@/components/sachiv/pages/DashboardPage'), 'DashboardPage');
const PostsPage = createLazyComponent(() => import('@/components/sachiv/pages/PostsPage'), 'PostsPage');
const AnnouncementsPage = createLazyComponent(() => import('@/components/sachiv/pages/AnnouncementsPage'), 'AnnouncementsPage');
const SchemesPage = createLazyComponent(() => import('@/components/sachiv/pages/SchemesPage'), 'SchemesPage');
const GalleryPage = createLazyComponent(() => import('@/components/sachiv/pages/GalleryPage'), 'GalleryPage');
const AlbumsPage = createLazyComponent(() => import('@/components/sachiv/pages/AlbumsPage'), 'AlbumsPage');
const NewsletterPage = createLazyComponent(() => import('@/components/sachiv/pages/NewsletterPage'), 'NewsletterPage');
const DocumentsPage = createLazyComponent(() => import('@/components/sachiv/pages/DocumentsPage'), 'DocumentsPage');
const CommentsPage = createLazyComponent(() => import('@/components/sachiv/pages/CommentsPage'), 'CommentsPage');
const TeamPage = createLazyComponent(() => import('@/components/sachiv/pages/TeamPage'), 'TeamPage');
const AnalyticsPage = createLazyComponent(() => import('@/components/sachiv/pages/AnalyticsPage'), 'AnalyticsPage');
const SettingsPage = createLazyComponent(() => import('@/components/sachiv/pages/SettingsPage'), 'SettingsPage');
const WebsitePage = createLazyComponent(() => import('@/components/sachiv/PanchayatWebsiteManager'), 'PanchayatWebsiteManager');
const SuperAdminDashboard = createLazyComponent(() => import('@/components/admin/SuperAdminDashboard'), 'SuperAdminDashboard');

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/registration" element={<RegistrationFlow />} />
        <Route path="/panchayats" element={<AllPanchayatsPage />} />
        <Route path="/panchayat/:subdomain" element={<PanchayatWebsite />} />
        <Route path="/panchayat-demo" element={<PanchayatWebsite />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/test-api" element={<TestAPIPage />} />

        {/* Protected Routes - Sachiv Dashboard */}
        <Route
          path="/panchayat/dashboard"
          element={
            <ProtectedRoute>
              <SachivDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="schemes" element={<SchemesPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="newsletters" element={<NewsletterPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="comments" element={<CommentsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="website" element={<WebsitePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

