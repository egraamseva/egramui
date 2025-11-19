/**
 * Documents Page Component
 * Manage panchayat documents
 */

import { useAuth } from "../../../contexts/AuthContext";
import { DocumentsManagement } from "../DocumentsManagement";

export function DocumentsPage() {
  const { user } = useAuth();
  
  if (!user?.panchayatId) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  }

  return <DocumentsManagement panchayatId={user.panchayatId} />;
}

