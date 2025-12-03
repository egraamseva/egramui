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
import { ImageModal } from "../../ui/image-modal";

export function GalleryPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState({
    imageUrl: "",
    caption: "",
    tags: "",
    albumId: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
      const result = await galleryApi.list();
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

    try {
      const result = await albumApi.list();
      setAlbums(result.items);
    } catch (error) {
      console.error("Error fetching albums:", error);
      // Don't show error toast for albums, it's optional
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
    setSelectedFile(null);
    setFilePreview("");
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
    setSelectedFile(null);
    setFilePreview("");
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
    setSelectedFile(null);
    setFilePreview("");
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId) return;

    if (!selectedFile && !formData.imageUrl.trim()) {
      toast.error("Please upload an image file or enter image URL");
      return;
    }

    try {
      const albumIdNumber = formData.albumId && formData.albumId !== 'none' ? parseInt(formData.albumId) : undefined;
      const payload: any = {
        caption: formData.caption || undefined,
        tags: formData.tags || undefined,
        albumId: albumIdNumber,
      };

      if (selectedFile) {
        payload.imageFile = selectedFile;
      } else {
        payload.imageUrl = formData.imageUrl;
      }

      await galleryApi.create(payload);
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

    if (!selectedFile && !formData.imageUrl.trim()) {
      toast.error("Please upload an image file or enter image URL");
      return;
    }

    try {
      const albumIdNumber = formData.albumId && formData.albumId !== 'none' ? parseInt(formData.albumId) : undefined;
      const payload: any = {
        caption: formData.caption || undefined,
        tags: formData.tags || undefined,
        albumId: albumIdNumber,
      };

      if (selectedFile) {
        payload.imageFile = selectedFile;
      } else {
        payload.imageUrl = formData.imageUrl;
      }

      await galleryApi.update(editingImage.id, payload);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted cursor-pointer"
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setIsImageModalOpen(true);
                  }}
                >
                  <div className="w-full h-full pointer-events-none">
                    <ImageWithFallback
                      src={image.image}
                      alt={image.title}
                      className="w-full h-full object-cover"
                      data-gallery-id={image.id}
                      entityType="gallery"
                      entityId={image.id}
                    />
                  </div>
                  {image.category && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10 pointer-events-none">
                      {image.category}
                    </div>
                  )}
                  <div 
                    className="absolute inset-0 flex items-center justify-center gap-1 sm:gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100 z-10 pointer-events-none"
                  >
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 sm:h-9 sm:w-9 pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(image);
                      }}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 sm:h-9 sm:w-9 pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id);
                      }}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
              <Label htmlFor="imageUrl">Image URL or File *</Label>
              <div className="space-y-2">
                <Input
                  id="imageUrl"
                  placeholder="Enter image URL (or upload file below)"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  disabled={!!selectedFile}
                />
                <div className="relative">
                  <input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Label htmlFor="imageFile" className="flex items-center justify-center w-full px-3 py-2 border border-dashed border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                    {selectedFile ? `✓ ${selectedFile.name}` : 'Click to upload image file'}
                  </Label>
                </div>
                {filePreview && (
                  <div className="relative w-full h-40 rounded-md overflow-hidden bg-muted">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview('');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
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
                  <SelectItem value="none">No Album</SelectItem>
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

      {/* Image Modal */}
      {images.length > 0 && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={images[selectedImageIndex]?.image || ""}
          alt={images[selectedImageIndex]?.title || "Gallery image"}
          images={images.map((img) => img.image)}
          currentIndex={selectedImageIndex}
          onIndexChange={setSelectedImageIndex}
        />
      )}
    </div>
  );
}

