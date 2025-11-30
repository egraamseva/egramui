/**
 * Newsletter Page Component
 * Manage panchayat newsletters
 */

import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2, Upload, X, Plus, FileText } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { TipTapEditor } from "../../editor/TipTapEditor";
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
import { newsletterApi } from "@/routes/api";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { usePresignedUrlRefresh } from "../../../hooks/usePresignedUrlRefresh";
import { useTranslation } from "react-i18next";

type Newsletter = {
  id: string;
  title: string;
  subtitle?: string;
  coverImageFileKey?: string;
  coverImageUrl?: string;
  content?: string;
  bulletPoints?: string[];
  publishedOn?: string;
  authorName?: string;
  attachments?: string[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function NewsletterPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    content: "",
    bulletPoints: [] as string[],
    publishedOn: "",
    authorName: "",
    isPublished: false,
    coverImageFile: null as File | null,
    coverImagePreview: "",
  });
  const [newBulletPoint, setNewBulletPoint] = useState("");
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | null>(null);

  useEffect(() => {
    if (user?.panchayatId) {
      fetchNewsletters();
    }
  }, [user]);

  const fetchNewsletters = async () => {
    if (!user?.panchayatId) return;

    setLoading(true);
    try {
      const result = await newsletterApi.list();
      setNewsletters(result.items);
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      toast.error("Failed to load newsletters");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingNewsletter(null);
    setFormData({
      title: "",
      subtitle: "",
      content: "",
      bulletPoints: [],
      publishedOn: "",
      authorName: user?.name || "",
      isPublished: false,
      coverImageFile: null,
      coverImagePreview: "",
    });
    setNewBulletPoint("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setFormData({
      title: newsletter.title,
      subtitle: newsletter.subtitle || "",
      content: newsletter.content || "",
      bulletPoints: newsletter.bulletPoints || [],
      publishedOn: newsletter.publishedOn || "",
      authorName: newsletter.authorName || user?.name || "",
      isPublished: newsletter.isPublished,
      coverImageFile: null,
      coverImagePreview: newsletter.coverImageUrl || "",
    });
    setNewBulletPoint("");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingNewsletter(null);
    setFormData({
      title: "",
      subtitle: "",
      content: "",
      bulletPoints: [],
      publishedOn: "",
      authorName: "",
      isPublished: false,
      coverImageFile: null,
      coverImagePreview: "",
    });
    setNewBulletPoint("");
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        coverImageFile: file,
        coverImagePreview: URL.createObjectURL(file),
      });
    }
  };

  const removeCoverImage = () => {
    if (formData.coverImagePreview) {
      URL.revokeObjectURL(formData.coverImagePreview);
    }
    setFormData({
      ...formData,
      coverImageFile: null,
      coverImagePreview: "",
    });
  };

  const addBulletPoint = () => {
    if (newBulletPoint.trim()) {
      setFormData({
        ...formData,
        bulletPoints: [...formData.bulletPoints, newBulletPoint.trim()],
      });
      setNewBulletPoint("");
    }
  };

  const removeBulletPoint = (index: number) => {
    setFormData({
      ...formData,
      bulletPoints: formData.bulletPoints.filter((_, i) => i !== index),
    });
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId) return;

    if (!formData.title.trim()) {
      toast.error("Please enter newsletter title");
      return;
    }

    try {
      await newsletterApi.create({
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        bulletPoints: formData.bulletPoints,
        publishedOn: formData.publishedOn || undefined,
        authorName: formData.authorName,
        isPublished: formData.isPublished,
        coverImageFile: formData.coverImageFile || undefined,
      });
      toast.success("Newsletter created successfully!");
      closeDialog();
      fetchNewsletters();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create newsletter";
      toast.error(message);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId || !editingNewsletter) return;

    if (!formData.title.trim()) {
      toast.error("Please enter newsletter title");
      return;
    }

    try {
      await newsletterApi.update(editingNewsletter.id, {
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        bulletPoints: formData.bulletPoints,
        publishedOn: formData.publishedOn || undefined,
        authorName: formData.authorName,
        isPublished: formData.isPublished,
        coverImageFile: formData.coverImageFile || undefined,
      });
      toast.success("Newsletter updated successfully!");
      closeDialog();
      fetchNewsletters();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update newsletter";
      toast.error(message);
    }
  };

  const handleTogglePublish = async (id: string) => {
    if (!user?.panchayatId) return;

    try {
      await newsletterApi.togglePublish(id);
      toast.success("Newsletter publish status updated!");
      fetchNewsletters();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update publish status";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.panchayatId) return;
    if (!confirm("Are you sure you want to delete this newsletter?")) return;

    try {
      await newsletterApi.delete(id);
      setNewsletters((prev) => prev.filter((n) => n.id !== id));
      toast.success("Newsletter deleted successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete newsletter";
      toast.error(message);
    }
  };

  const filteredNewsletters =
    filter === "all"
      ? newsletters
      : filter === "published"
        ? newsletters.filter((n) => n.isPublished)
        : newsletters.filter((n) => !n.isPublished);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">{t('newsletters.title')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('newsletters.createNew')}
          </p>
        </div>
        <Button
          className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto"
          onClick={openCreateDialog}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">{t('newsletters.createNew')}</span>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            {t('common.all') || 'All'}
          </TabsTrigger>
          <TabsTrigger value="published" className="text-xs sm:text-sm">
            {t('newsletters.published')}
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs sm:text-sm">
            {t('newsletters.draft')}
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
            ) : filteredNewsletters.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  No newsletters yet
                </CardContent>
              </Card>
            ) : (
              filteredNewsletters.map((newsletter) => (
                <Card key={newsletter.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {newsletter.coverImageUrl && (
                        <div className="w-full h-32 rounded-lg overflow-hidden">
                          <NewsletterCoverImage fileKey={newsletter.coverImageFileKey} url={newsletter.coverImageUrl} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{newsletter.title}</h3>
                        {newsletter.subtitle && (
                          <p className="text-xs text-muted-foreground mb-1">{newsletter.subtitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {newsletter.publishedOn || newsletter.createdAt
                            ? new Date(newsletter.publishedOn || newsletter.createdAt || "").toLocaleDateString()
                            : "No date"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={newsletter.isPublished ? "default" : "secondary"}
                          className={`text-xs ${newsletter.isPublished ? "bg-[#138808]" : ""}`}
                        >
                          {newsletter.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {newsletter.authorName || "Author"}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleTogglePublish(newsletter.id)}
                        >
                          {newsletter.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(newsletter)}>
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive"
                          onClick={() => handleDelete(newsletter.id)}
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
                    <TableHead>Published On</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
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
                  ) : filteredNewsletters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No newsletters yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNewsletters.map((newsletter) => (
                      <TableRow key={newsletter.id}>
                        <TableCell className="font-medium">{newsletter.title}</TableCell>
                        <TableCell>
                          {newsletter.publishedOn || newsletter.createdAt
                            ? new Date(newsletter.publishedOn || newsletter.createdAt || "").toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{newsletter.authorName || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={newsletter.isPublished ? "default" : "secondary"}
                            className={newsletter.isPublished ? "bg-[#138808]" : ""}
                          >
                            {newsletter.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePublish(newsletter.id)}
                              title={newsletter.isPublished ? "Unpublish" : "Publish"}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(newsletter)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(newsletter.id)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNewsletter ? t('newsletters.edit') || 'Edit Newsletter' : t('newsletters.createNew')}
            </DialogTitle>
            <DialogDescription>
              {editingNewsletter
                ? t('common.updateDescription') || "Update the newsletter details below"
                : t('common.createDescription') || "Fill in the details to create a new newsletter"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingNewsletter ? handleUpdate(e) : handleCreate(e);
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">{t('newsletters.newsletterTitle')} *</Label>
              <Input
                id="title"
                placeholder="Enter newsletter title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">{t('newsletters.subtitle')}</Label>
              <Input
                id="subtitle"
                placeholder="Enter newsletter subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">{t('newsletters.coverImage')}</Label>
              {formData.coverImagePreview ? (
                <div className="relative">
                  <div className="w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={formData.coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeCoverImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <Label htmlFor="coverImage" className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">Click to upload cover image</span>
                    <Input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageChange}
                    />
                  </Label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">{t('newsletter.content') || 'Content'}</Label>
                {autosaveStatus && (
                  <span className={`text-xs ${
                    autosaveStatus === 'saving' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {autosaveStatus === 'saving' 
                      ? t('newsletter.autosave') || 'Auto-saving...'
                      : t('newsletter.saved') || 'Saved'}
                  </span>
                )}
              </div>
              <TipTapEditor
                content={formData.content}
                onChange={(html) => {
                  setFormData({ ...formData, content: html });
                  setAutosaveStatus('saving');
                  // Clear status after a delay
                  setTimeout(() => setAutosaveStatus('saved'), 1000);
                  setTimeout(() => setAutosaveStatus(null), 3000);
                }}
                onSave={(html) => {
                  // Autosave callback - could save to draft here
                  setFormData({ ...formData, content: html });
                  setAutosaveStatus('saved');
                }}
                placeholder={t('newsletter.contentPlaceholder') || 'Start writing your newsletter content...'}
                autosaveInterval={30000}
              />
              <p className="text-xs text-muted-foreground">
                {t('newsletter.contentHint') || 'Use the toolbar to format text, add images, tables, and links. Content is saved automatically.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('newsletters.bulletPoints')}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t('newsletters.addBulletPoint')}
                  value={newBulletPoint}
                  onChange={(e) => setNewBulletPoint(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBulletPoint();
                    }
                  }}
                />
                <Button type="button" onClick={addBulletPoint} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.bulletPoints.length > 0 && (
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {formData.bulletPoints.map((point, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <span>{point}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBulletPoint(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publishedOn">{t('newsletters.publishedOn')}</Label>
                <Input
                  id="publishedOn"
                  type="date"
                  value={formData.publishedOn}
                  onChange={(e) => setFormData({ ...formData, publishedOn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorName">{t('newsletters.authorName')}</Label>
                <Input
                  id="authorName"
                  placeholder="Author name"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                {t('newsletters.publishImmediately')}
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#FF9933] hover:bg-[#FF9933]/90">
                {editingNewsletter ? t('common.update') || 'Update' : t('common.create') || 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for newsletter cover image with presigned URL refresh
function NewsletterCoverImage({ fileKey, url }: { fileKey?: string; url?: string }) {
  const { presignedUrl } = usePresignedUrlRefresh({
    fileKey: fileKey || undefined,
    initialPresignedUrl: url || undefined,
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
      alt="Newsletter cover"
      className="w-full h-full object-cover"
      onError={async () => {
        // Hook will handle refresh automatically
      }}
    />
  );
}

