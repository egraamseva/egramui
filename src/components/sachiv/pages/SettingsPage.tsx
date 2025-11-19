/**
 * Settings Page Component
 * Manage panchayat settings
 */

import { useAuth } from "../../../contexts/AuthContext";
import { SettingsManagement } from "../SettingsManagement";

export function SettingsPage() {
  const { user } = useAuth();
  
  if (!user?.panchayatId) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  }

  return <SettingsManagement panchayatId={user.panchayatId} />;
}

