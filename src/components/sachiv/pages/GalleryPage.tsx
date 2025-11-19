/**
 * Gallery Page Component
 * Upload and manage photos
 */

import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import type { GalleryItem, Album } from "../../../types";
import { galleryApi, albumApi } from "@/routes/api";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export function GalleryPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  console.log("Albums:", loadingAlbums);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState({
    imageUrl: "",
    caption: "",
    tags: "",
    albumId: "",
  });

  useEffect(() => {
    if (user?.panchayatId) {
      fetchImages();
      fetchAlbums();
    }
  }, [user]);

  const fetchImages = async () => {
    if (!user?.panchayatId) return;

    setLoading(true);
    try {
      const result = await galleryApi.list(user.panchayatId);
      setImages(result.items);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    if (!user?.panchayatId) return;

    setLoadingAlbums(true);
    try {
      const result = await albumApi.list();
      setAlbums(result.items);
    } catch (error) {
      console.error("Error fetching albums:", error);
      // Don't show error toast for albums, it's optional
    } finally {
      setLoadingAlbums(false);
    }
  };

  const openCreateDialog = () => {
    setEditingImage(null);
    setFormData({
      imageUrl: "",
      caption: "",
      tags: "",
      albumId: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = async (image: GalleryItem) => {
    setEditingImage(image);
    
    // Fetch full image details to get albumId
    let albumId = "";
    try {
      if (!user?.panchayatId) return;
      const fullImage = await galleryApi.getById( image.id) as any;
      if (fullImage?.albumId) {
        albumId = String(fullImage.albumId);
      } else if (image.category) {
        // Try to find album by name (category is mapped to albumName)
        const matchingAlbum = albums.find(a => a.title === image.category);
        if (matchingAlbum) {
          albumId = matchingAlbum.id;
        }
      }
    } catch (error) {
      console.error("Error fetching image details:", error);
      // Fallback: try to match by category/album name
      if (image.category) {
        const matchingAlbum = albums.find(a => a.title === image.category);
        if (matchingAlbum) {
          albumId = matchingAlbum.id;
        }
      }
    }
    
    setFormData({
      imageUrl: image.image,
      caption: image.title || "",
      tags: "",
      albumId: albumId,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingImage(null);
    setFormData({
      imageUrl: "",
      caption: "",
      tags: "",
      albumId: "",
    });
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId) return;

    if (!formData.imageUrl.trim()) {
      toast.error("Please enter image URL");
      return;
    }

    try {
      await galleryApi.create( {
        imageUrl: formData.imageUrl,
        caption: formData.caption || undefined,
        tags: formData.tags || undefined,
        albumId: formData.albumId ? parseInt(formData.albumId) : undefined,
      });
      toast.success("Image uploaded successfully!");
      closeDialog();
      fetchImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId || !editingImage) return;

    if (!formData.imageUrl.trim()) {
      toast.error("Please enter image URL");
      return;
    }

    try {
      await galleryApi.update( editingImage.id, {
        imageUrl: formData.imageUrl,
        caption: formData.caption || undefined,
        tags: formData.tags || undefined,
        albumId: formData.albumId ? parseInt(formData.albumId) : undefined,
      });
      toast.success("Image updated successfully!");
      closeDialog();
      fetchImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update image";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.panchayatId) return;
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await galleryApi.delete( id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("Image deleted successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete image";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Photo Gallery</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Upload and manage photos</p>
        </div>
        <Button
          className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto"
          onClick={openCreateDialog}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Upload Photos</span>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            Loading images...
          </CardContent>
        </Card>
      ) : images.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            No images yet. Upload your first image!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                >
                  <ImageWithFallback
                    src={image.image}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  {image.category && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {image.category}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-1 sm:gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 sm:h-9 sm:w-9"
                      onClick={() => openEditDialog(image)}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 sm:h-9 sm:w-9"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingImage ? "Edit Image" : "Upload New Image"}
            </DialogTitle>
            <DialogDescription>
              {editingImage
                ? "Update the image details below"
                : "Enter the image URL and details"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingImage ? handleUpdate(e) : handleCreate(e);
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL *</Label>
              <Input
                id="imageUrl"
                placeholder="Enter image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Enter image caption"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., event, meeting, celebration"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="albumId">Album (Optional)</Label>
              <Select
                value={formData.albumId}
                onValueChange={(value) => setFormData({ ...formData, albumId: value })}
              >
                <SelectTrigger id="albumId">
                  <SelectValue placeholder="Select an album (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Album</SelectItem>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Organize this image into an album. You can create albums from the Albums page.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#FF9933] hover:bg-[#FF9933]/90">
                {editingImage ? "Update" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

