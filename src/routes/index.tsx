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
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const module = await importFn();
        // Handle both default and named exports
        const component = module.default || module[componentName];
        if (!component) {
          throw new Error(`Component ${componentName} not found in module`);
        }
        return { default: component };
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);
        const isNetworkError = 
          errorMessage?.includes('Failed to fetch') || 
          errorMessage?.includes('dynamically imported') ||
          errorMessage?.includes('NetworkError') ||
          errorMessage?.includes('Load failed') ||
          error?.name === 'TypeError';

        if (isNetworkError && attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
          console.warn(
            `Failed to load ${componentName} (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
            error
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // If it's not a network error or we've exhausted retries, log and break
        if (!isNetworkError) {
          console.error(`Failed to load ${componentName}:`, error);
          break;
        }
      }
    }

    // All retries failed - return a fallback component
    console.error(`Failed to load ${componentName} after ${maxRetries + 1} attempts:`, lastError);
    
    return {
      default: () => (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-2">
              We're sorry, but something unexpected happened.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Failed to load {componentName}. Please try again.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  // Try to reload just the component
                  window.location.hash = '';
                  window.location.reload();
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors border"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    };
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

