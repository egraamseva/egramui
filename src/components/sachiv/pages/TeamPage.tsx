/**
 * Team Page Component
 * Manage panchayat team members
 */

import { useAuth } from "../../../contexts/AuthContext";
import { TeamManagement } from "../../admin/TeamManagement";

export function TeamPage() {
  const { user } = useAuth();
  
  if (!user?.panchayatId) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  }

  return <TeamManagement panchayatId={user.panchayatId} />;
}

