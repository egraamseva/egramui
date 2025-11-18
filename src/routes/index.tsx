/**
 * Application Routes
 * Defines all routes for the application
 */

import { Routes, Route, Navigate } from 'react-router-dom';

import { SuccessPage } from '../pages/SuccessPage';
import { TestAPIPage } from '../pages/TestAPIPage';
import { LandingPage } from '@/components/main/LandingPage';
import { RegistrationFlow } from '@/components/main/RegistrationFlow';
import { PanchayatWebsite } from '@/components/public/PanchayatWebsite';
import { AllPanchayatsPage } from '@/components/main/AllPanchayatsPage';
import { Login } from '@/components/main/Login';
import { ForgotPassword } from '@/components/main/ForgotPassword';
import { ResetPassword } from '@/components/main/ResetPassword';
import { ProtectedRoute } from '@/components/main/ProtectedRoute';
import { SachivDashboard } from '@/components/sachiv/SachivDashboard';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';

export function AppRoutes() {
  return (
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
  );
}

