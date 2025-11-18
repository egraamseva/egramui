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
const SachivDashboard = lazy(() => import('@/components/sachiv/SachivDashboard').then(m => ({ default: m.SachivDashboard })));
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

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SachivDashboard />
            </ProtectedRoute>
          }
        />
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

