/**
 * Analytics Page Component
 * View detailed analytics
 */

import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { EnhancedAnalytics } from "../EnhancedAnalytics";

export function AnalyticsPage() {
  const { user } = useAuth();
  const [refreshKey] = useState(0);
  
  if (!user?.panchayatId) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  }

  return <EnhancedAnalytics panchayatId={user.panchayatId} refreshKey={refreshKey} />;
}

