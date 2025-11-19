/**
 * Sachiv Dashboard Component
 * Main entry point - redirects to dashboard layout
 * This component is kept for backward compatibility but now uses routing
 */

import { Navigate } from "react-router-dom";

export function SachivDashboard() {
  // Redirect to dashboard home page
  return <Navigate to="/panchayat/dashboard" replace />;
}
