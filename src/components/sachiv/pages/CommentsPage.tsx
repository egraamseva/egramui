/**
 * Comments Page Component
 * Manage post comments
 */

import { useAuth } from "../../../contexts/AuthContext";
import { CommentsManagement } from "../CommentsManagement";

export function CommentsPage() {
  const { user } = useAuth();
  
  if (!user?.panchayatId) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  }

  return <CommentsManagement panchayatId={user.panchayatId} />;
}

