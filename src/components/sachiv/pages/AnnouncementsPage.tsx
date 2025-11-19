/**
 * Announcements Page Component
 * Manage panchayat announcements
 */

import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import type { Announcement } from "../../../types";
import { announcementApi } from "@/routes/api";

export function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    bodyText: "",
    isActive: true,
  });

  useEffect(() => {
    if (user?.panchayatId) {
      fetchAnnouncements();
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    if (!user?.panchayatId) return;

    setLoading(true);
    try {
      const result = await announcementApi.list();
      setAnnouncements(result.items);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      bodyText: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      bodyText: announcement.description || "",
      isActive: announcement.status === "Published",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      bodyText: "",
      isActive: true,
    });
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId) return;

    if (!formData.title.trim()) {
      toast.error("Please enter announcement title");
      return;
    }
    if (!formData.bodyText.trim()) {
      toast.error("Please enter announcement content");
      return;
    }

    try {
      await announcementApi.create( {
        title: formData.title,
        bodyText: formData.bodyText,
        isActive: formData.isActive,
      });
      toast.success("Announcement created successfully!");
      closeDialog();
      fetchAnnouncements();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create announcement";
      toast.error(message);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId || !editingAnnouncement) return;

    if (!formData.title.trim()) {
      toast.error("Please enter announcement title");
      return;
    }
    if (!formData.bodyText.trim()) {
      toast.error("Please enter announcement content");
      return;
    }

    try {
      await announcementApi.update( editingAnnouncement.id, {
        title: formData.title,
        bodyText: formData.bodyText,
        isActive: formData.isActive,
      });
      toast.success("Announcement updated successfully!");
      closeDialog();
      fetchAnnouncements();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update announcement";
      toast.error(message);
    }
  };

  const handleEdit = (id: string) => {
    const announcement = announcements.find((a) => a.id === id);
    if (announcement) {
      openEditDialog(announcement);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.panchayatId) return;
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await announcementApi.delete( id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete announcement";
      toast.error(message);
    }
  };

  const filteredAnnouncements =
    filter === "all"
      ? announcements
      : filter === "published"
        ? announcements.filter((a) => a.status === "Published")
        : announcements.filter((a) => a.status === "Draft");

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Announcements</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your panchayat announcements
          </p>
        </div>
        <Button
          className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto"
          onClick={openCreateDialog}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">New Announcement</span>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="published" className="text-xs sm:text-sm">
            Published
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs sm:text-sm">
            Drafts
          </TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4 sm:mt-6">
          {/* Mobile: Card View */}
          <div className="block sm:hidden space-y-3">
            {loading ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  Loading...
                </CardContent>
              </Card>
            ) : filteredAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  No announcements yet
                </CardContent>
              </Card>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{announcement.title}</h3>
                        <p className="text-xs text-muted-foreground">{announcement.date}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={announcement.status === "Published" ? "default" : "secondary"}
                          className={`text-xs ${
                            announcement.status === "Published" ? "bg-[#138808]" : ""
                          }`}
                        >
                          {announcement.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {announcement.views || 0} views
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(announcement.id)}>
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: Table View */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredAnnouncements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No announcements yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnnouncements.map((announcement) => (
                      <TableRow key={announcement.id}>
                        <TableCell className="font-medium">{announcement.title}</TableCell>
                        <TableCell>{announcement.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={announcement.status === "Published" ? "default" : "secondary"}
                            className={announcement.status === "Published" ? "bg-[#138808]" : ""}
                          >
                            {announcement.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{announcement.views || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(announcement.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(announcement.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement
                ? "Update the announcement details below"
                : "Fill in the details to create a new announcement"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingAnnouncement ? handleUpdate(e) : handleCreate(e);
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter announcement title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyText">Content *</Label>
              <Textarea
                id="bodyText"
                placeholder="Enter announcement content"
                value={formData.bodyText}
                onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                rows={6}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Publish immediately (uncheck to save as draft)
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#FF9933] hover:bg-[#FF9933]/90">
                {editingAnnouncement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

