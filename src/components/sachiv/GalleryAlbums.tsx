/**
 * Gallery Albums Component
 * Manage gallery albums and organize images
 */

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Edit, Trash2, Folder, Upload, X, ArrowLeft, Check } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import type { Album, GalleryItem } from "../../types";
import { formatTimeAgo } from "../../utils/format";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { albumApi, galleryApi } from "@/routes/api";
import { usePresignedUrlRefresh } from "../../hooks/usePresignedUrlRefresh";

interface GalleryAlbumsProps {
  panchayatId: string;
}

export function GalleryAlbums({ panchayatId }: GalleryAlbumsProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumImages, setAlbumImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isCoverImageDialogOpen, setIsCoverImageDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, [panchayatId]);

  useEffect(() => {
    if (selectedAlbum) {
      fetchAlbumImages(selectedAlbum.id);
    }
  }, [selectedAlbum]);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const result = await albumApi.list();
      setAlbums(result.items);
    } catch (error) {
      toast.error("Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumImages = async (albumId: string) => {
    try {
      const result = await galleryApi.list(albumId);
      setAlbumImages(result.items);
    } catch (error) {
      console.error("Error fetching album images:", error);
      setAlbumImages([]);
    }
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.title) {
      toast.error("Please enter album title");
      return;
    }

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
      };

      if (selectedFile) {
        payload.coverImageFile = selectedFile;
      } else if (formData.coverImage) {
        payload.coverImage = formData.coverImage;
      }

      await albumApi.create(payload);
      toast.success("Album created successfully");
      closeDialog();
      fetchAlbums();
    } catch (error: any) {
      toast.error(error.message || "Failed to create album");
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingAlbum || !formData.title) {
      toast.error("Please enter album title");
      return;
    }

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
      };

      if (selectedFile) {
        payload.coverImageFile = selectedFile;
      } else if (formData.coverImage) {
        payload.coverImage = formData.coverImage;
      }

      await albumApi.update(editingAlbum.id, payload);
      toast.success("Album updated successfully");
      closeDialog();
      fetchAlbums();
      if (selectedAlbum?.id === editingAlbum.id) {
        setSelectedAlbum({ ...selectedAlbum, ...formData });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update album");
    }
  };

  const handleDelete = async () => {
    if (!albumToDelete) return;

    try {
      await albumApi.delete(albumToDelete);
      toast.success("Album deleted successfully");
      setDeleteConfirmOpen(false);
      setAlbumToDelete(null);
      if (selectedAlbum?.id === albumToDelete) {
        setSelectedAlbum(null);
      }
      fetchAlbums();
    } catch (error) {
      toast.error("Failed to delete album");
    }
  };

  const handleUploadImages = async () => {
    if (!selectedAlbum || imageFiles.length === 0) {
      toast.error("Please select images to upload");
      return;
    }

    try {
      const uploadPromises = imageFiles.map((file) =>
        galleryApi.create({
          imageUrl: "", // Will be set by file upload
          albumId: Number(selectedAlbum.id),
          imageFile: file as any,
        } as any)
      );

      await Promise.all(uploadPromises);
      toast.success(`${imageFiles.length} image(s) uploaded successfully`);
      setIsImageDialogOpen(false);
      setImageFiles([]);
      fetchAlbumImages(selectedAlbum.id);
      fetchAlbums(); // Refresh to update image count
    } catch (error: any) {
      toast.error(error.message || "Failed to upload images");
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!selectedAlbum) return;
    if (!confirm("Are you sure you want to remove this image from the album?")) return;

    try {
      await galleryApi.delete(imageId);
      toast.success("Image removed successfully");
      fetchAlbumImages(selectedAlbum.id);
      fetchAlbums(); // Refresh to update image count
    } catch (error) {
      toast.error("Failed to remove image");
    }
  };

  const handleSetCoverImage = async (imageUrl: string) => {
    if (!selectedAlbum) return;

    try {
      await albumApi.update(selectedAlbum.id, {
        coverImage: imageUrl,
      });
      toast.success("Cover image updated successfully");
      setIsCoverImageDialogOpen(false);
      fetchAlbums();
      if (selectedAlbum) {
        setSelectedAlbum({ ...selectedAlbum, coverImage: imageUrl });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update cover image");
    }
  };

  const openEditDialog = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      description: album.description || "",
      coverImage: album.coverImage || "",
    });
    setSelectedFile(null);
    setFilePreview("");
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAlbum(null);
    setFormData({ title: "", description: "", coverImage: "" });
    setSelectedFile(null);
    setFilePreview("");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAlbum(null);
    setFormData({ title: "", description: "", coverImage: "" });
    setSelectedFile(null);
    setFilePreview("");
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

  const handleImageFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    setImageFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933] mx-auto"></div>
          <p className="mt-4 text-[#666]">Loading albums...</p>
        </div>
      </div>
    );
  }

  // Album Detail View
  if (selectedAlbum) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedAlbum(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Albums
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-[#1B2B5E]">{selectedAlbum.title}</h2>
              {selectedAlbum.description && (
                <p className="text-[#666] mt-1">{selectedAlbum.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImageDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
            <Button variant="outline" onClick={() => setIsCoverImageDialogOpen(true)}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Change Cover
            </Button>
            <Button variant="outline" onClick={() => openEditDialog(selectedAlbum)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Album
            </Button>
          </div>
        </div>

        {albumImages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-16 w-16 text-[#666] mb-4" />
              <p className="text-[#666] text-lg">No images in this album</p>
              <p className="text-[#666] text-sm mt-2">Upload images to get started</p>
              <Button className="mt-4" onClick={() => setIsImageDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {albumImages.map((image) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <AlbumImageWithRefresh src={image.image} alt={image.title || "Album image"} />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveImage(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                    {image.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Images Dialog */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Images to Album</DialogTitle>
              <DialogDescription>
                Select one or more images to upload to "{selectedAlbum.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="imageFiles">Select Images</Label>
                <input
                  id="imageFiles"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFilesSelect}
                  className="hidden"
                />
                <Label htmlFor="imageFiles" className="flex items-center justify-center w-full px-3 py-2 border border-dashed border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4 mr-2" />
                  Click to select images
                </Label>
              </div>
              {imageFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Images ({imageFiles.length})</Label>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeImageFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUploadImages} disabled={imageFiles.length === 0}>
                Upload {imageFiles.length > 0 ? `${imageFiles.length} ` : ""}Image(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Cover Image Dialog */}
        <Dialog open={isCoverImageDialogOpen} onOpenChange={setIsCoverImageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Cover Image</DialogTitle>
              <DialogDescription>
                Select an image from the album or upload a new one
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {albumImages.length > 0 && (
                <div>
                  <Label>Select from Album Images</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto">
                    {albumImages.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => handleSetCoverImage(image.image || "")}
                        className="relative aspect-square overflow-hidden rounded border-2 border-transparent hover:border-[#FF9933] transition-colors"
                      >
                        <AlbumImageWithRefresh src={image.image} alt={image.title || "Album image"} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Or Upload New Cover Image</Label>
                <input
                  id="newCoverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Label htmlFor="newCoverImage" className="flex items-center justify-center w-full px-3 py-2 border border-dashed border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Cover Image
                </Label>
                {filePreview && (
                  <div className="relative w-full h-40 rounded-md overflow-hidden bg-muted">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      className="absolute bottom-2 left-2"
                      onClick={async () => {
                        if (selectedFile && selectedAlbum) {
                          try {
                            // Upload the file first, then set as cover
                            const result = await galleryApi.create({
                              imageUrl: "",
                              albumId: Number(selectedAlbum.id),
                              imageFile: selectedFile as any,
                            } as any);
                            await handleSetCoverImage(result.image || "");
                            setSelectedFile(null);
                            setFilePreview("");
                          } catch (error: any) {
                            toast.error(error.message || "Failed to upload cover image");
                          }
                        }
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Use This
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCoverImageDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Albums List View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2B5E]">Gallery Albums</h2>
          <p className="text-[#666] mt-1">Organize your gallery images into albums</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Album
        </Button>
      </div>

      {albums.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-16 w-16 text-[#666] mb-4" />
            <p className="text-[#666] text-lg">No albums yet</p>
            <p className="text-[#666] text-sm mt-2">Create your first album to organize images</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Album
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card
              key={album.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedAlbum(album)}
            >
              <div className="relative h-48 bg-[#F5F5F5]">
                {album.coverImage ? (
                  <AlbumCoverImageWithRefresh src={album.coverImage} alt={album.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-[#666]" />
                  </div>
                )}
                <div
                  className="absolute top-2 right-2 flex gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(album)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setAlbumToDelete(album.id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{album.title}</h3>
                {album.description && (
                  <p className="text-sm text-[#666] mb-2 line-clamp-2">{album.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {album.imageCount} images
                  </Badge>
                  <span className="text-xs text-[#666]">{formatTimeAgo(album.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Album Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAlbum ? "Edit Album" : "Create Album"}</DialogTitle>
            <DialogDescription>
              {editingAlbum ? "Update album details" : "Create a new album to organize images"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingAlbum ? handleUpdate(e) : handleCreate(e);
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter album title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter album description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL or File</Label>
              <div className="space-y-2">
                <Input
                  id="coverImage"
                  placeholder="Enter image URL (or upload file below)"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  disabled={!!selectedFile}
                />
                <div className="relative">
                  <input
                    id="coverImageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Label htmlFor="coverImageFile" className="flex items-center justify-center w-full px-3 py-2 border border-dashed border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                    {selectedFile ? `✓ ${selectedFile.name}` : 'Click to upload cover image'}
                  </Label>
                </div>
                {filePreview && (
                  <div className="relative w-full h-40 rounded-md overflow-hidden bg-muted">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAlbum ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the album. Images in this album will not be deleted, but they will no longer be associated with this album.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlbumToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper component for album cover image with presigned URL refresh
function AlbumCoverImageWithRefresh({ src, alt }: { src?: string; alt: string }) {
  const { presignedUrl } = usePresignedUrlRefresh({
    fileKey: src || undefined,
    initialPresignedUrl: src || undefined,
  });

  if (!presignedUrl) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <ImageIcon className="h-16 w-16 text-[#666]" />
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={presignedUrl}
      alt={alt}
      className="w-full h-full object-cover"
    />
  );
}

// Helper component for album images with presigned URL refresh
function AlbumImageWithRefresh({ src, alt }: { src?: string; alt: string }) {
  const { presignedUrl } = usePresignedUrlRefresh({
    fileKey: src || undefined,
    initialPresignedUrl: src || undefined,
  });

  if (!presignedUrl) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={presignedUrl}
      alt={alt}
      className="w-full h-full object-cover"
    />
  );
}
