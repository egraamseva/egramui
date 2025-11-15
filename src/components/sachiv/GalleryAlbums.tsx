/**
 * Gallery Albums Component
 * Manage gallery albums and organize images
 */

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Edit, Trash2, Folder } from "lucide-react";
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
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import type { Album } from "../../types";
import { formatTimeAgo } from "../../utils/format";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { albumsAPI } from "@/services/api";

interface GalleryAlbumsProps {
  panchayatId: string;
}

export function GalleryAlbums({ panchayatId }: GalleryAlbumsProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
  });

  useEffect(() => {
    fetchAlbums();
  }, [panchayatId]);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await albumsAPI.getAll(panchayatId);
      setAlbums(data);
    } catch (error) {
      toast.error("Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.title) {
      toast.error("Please enter album title");
      return;
    }

    try {
      await albumsAPI.create(panchayatId, formData);
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
      await albumsAPI.update(editingAlbum.id, formData);
      toast.success("Album updated successfully");
      closeDialog();
      fetchAlbums();
    } catch (error: any) {
      toast.error(error.message || "Failed to update album");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this album?")) return;

    try {
      await albumsAPI.delete(id);
      toast.success("Album deleted successfully");
      fetchAlbums();
    } catch (error) {
      toast.error("Failed to delete album");
    }
  };

  const openEditDialog = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      description: album.description || "",
      coverImage: album.coverImage || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAlbum(null);
    setFormData({ title: "", description: "", coverImage: "" });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2B5E]">Gallery Albums</h2>
          <p className="text-[#666] mt-1">Organize your gallery images into albums</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
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
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Album
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-[#F5F5F5]">
                {album.coverImage ? (
                  <ImageWithFallback
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-[#666]" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
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
                    onClick={() => handleDelete(album.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAlbum ? "Edit Album" : "Create Album"}</DialogTitle>
            <DialogDescription>
              {editingAlbum ? "Update album details" : "Create a new album to organize images"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter album title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                placeholder="Enter image URL"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              type="button"
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={(e) => editingAlbum ? handleUpdate(e) : handleCreate(e)}
            >
              {editingAlbum ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

