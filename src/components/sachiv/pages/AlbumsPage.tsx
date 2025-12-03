/**
 * Albums Page Component
 * Manage gallery albums
 */

import { useAuth } from "../../../contexts/AuthContext";
import { GalleryAlbums } from "../GalleryAlbums";

export function AlbumsPage() {
  const { user } = useAuth();
  
  if (!user?.panchayatId) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933] mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <GalleryAlbums panchayatId={user.panchayatId} />;
}

