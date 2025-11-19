/**
 * Albums Page Component
 * Manage gallery albums
 */

import { useAuth } from "../../../contexts/AuthContext";
import { GalleryAlbums } from "../GalleryAlbums";

export function AlbumsPage() {
  const { user } = useAuth();
  
  if (!user?.panchayatId) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  }

  return <GalleryAlbums panchayatId={user.panchayatId} />;
}

