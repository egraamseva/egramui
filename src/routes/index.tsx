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

// Lazy load pages - these will be split into separate chunks
// Public pages (loaded on demand)
const LandingPage = lazy(() => import('@/components/main/LandingPage').then(m => ({ default: m.LandingPage })));
const RegistrationFlow = lazy(() => import('@/components/main/RegistrationFlow').then(m => ({ default: m.RegistrationFlow })));
const AllPanchayatsPage = lazy(() => import('@/components/main/AllPanchayatsPage').then(m => ({ default: m.AllPanchayatsPage })));
const PanchayatWebsite = lazy(() => import('@/components/public/PanchayatWebsite').then(m => ({ default: m.PanchayatWebsite })));
const Login = lazy(() => import('@/components/main/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('@/components/main/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/components/main/ResetPassword').then(m => ({ default: m.ResetPassword })));
const SuccessPage = lazy(() => import('../pages/SuccessPage').then(m => ({ default: m.SuccessPage })));
const TestAPIPage = lazy(() => import('../pages/TestAPIPage').then(m => ({ default: m.TestAPIPage })));

// Dashboard pages (heavy components - definitely should be lazy loaded)
const SachivDashboardLayout = lazy(() => import('@/components/sachiv/SachivDashboardLayout').then(m => ({ default: m.SachivDashboardLayout })));
const DashboardPage = lazy(() => import('@/components/sachiv/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PostsPage = lazy(() => import('@/components/sachiv/pages/PostsPage').then(m => ({ default: m.PostsPage })));
const AnnouncementsPage = lazy(() => import('@/components/sachiv/pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const SchemesPage = lazy(() => import('@/components/sachiv/pages/SchemesPage').then(m => ({ default: m.SchemesPage })));
const GalleryPage = lazy(() => import('@/components/sachiv/pages/GalleryPage').then(m => ({ default: m.GalleryPage })));
const AlbumsPage = lazy(() => import('@/components/sachiv/pages/AlbumsPage').then(m => ({ default: m.AlbumsPage })));
const NewsletterPage = lazy(() => import('@/components/sachiv/pages/NewsletterPage').then(m => ({ default: m.NewsletterPage })));
const DocumentsPage = lazy(() => import('@/components/sachiv/pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const CommentsPage = lazy(() => import('@/components/sachiv/pages/CommentsPage').then(m => ({ default: m.CommentsPage })));
const TeamPage = lazy(() => import('@/components/sachiv/pages/TeamPage').then(m => ({ default: m.TeamPage })));
const AnalyticsPage = lazy(() => import('@/components/sachiv/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/components/sachiv/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SuperAdminDashboard = lazy(() => import('@/components/admin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));

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

