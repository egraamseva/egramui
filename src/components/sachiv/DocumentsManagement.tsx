/**
 * Documents Management Component
 * Upload and manage panchayat documents with Google Drive integration
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Upload, FileText, Trash2, Search, Filter, Eye, AlertCircle, Loader2, Globe, Edit, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { documentsAPI, consentAPI, googleOAuthAPI } from "../../services/api";
import { ConsentDialog } from "./ConsentDialog";
import { DocumentViewer } from "./DocumentViewer";
import type { Document } from "../../types";
import { formatTimeAgo } from "../../utils/format";

interface DocumentsManagementProps {
  panchayatId: string;
}

export function DocumentsManagement({ panchayatId }: DocumentsManagementProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    visibility: "PRIVATE" as "PUBLIC" | "PRIVATE",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
    visibility: "PRIVATE" as "PUBLIC" | "PRIVATE",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Check for OAuth callback parameters
  useEffect(() => {
    const googleConnected = searchParams.get("google_connected");
    const googleError = searchParams.get("google_error");

    if (googleConnected === "true") {
      toast.success("Google Drive connected successfully! You can now upload documents.");
      // Refresh consent and connection status after OAuth callback
      checkConsentAndConnection();
      // Clean up URL parameters
      setSearchParams({}, { replace: true });
    } else if (googleError === "true") {
      toast.error("Failed to connect Google Drive. Please try again.");
      // Clean up URL parameters
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Refresh consent status when page becomes visible (user returns from OAuth)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !checkingConsent) {
        checkConsentAndConnection();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkingConsent]);

  useEffect(() => {
    checkConsentAndConnection();
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panchayatId, categoryFilter]);

  const checkConsentAndConnection = async () => {
    setCheckingConsent(true);
    try {
      const [consentStatus, connectionStatus] = await Promise.all([
        consentAPI.getStatus(),
        googleOAuthAPI.getConnectionStatus().catch(() => ({ isConnected: false }))
      ]);
      const hasConsentValue = consentStatus?.hasConsent === true;
      const isConnectedValue = connectionStatus?.isConnected === true;
      setHasConsent(hasConsentValue);
      setIsGoogleDriveConnected(isConnectedValue);
    } catch (error) {
      console.error("Failed to check consent/connection status:", error);
      setHasConsent(false);
      setIsGoogleDriveConnected(false);
    } finally {
      setCheckingConsent(false);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentsAPI.getAll(panchayatId, categoryFilter !== "all" ? categoryFilter : undefined);
      console.log("Fetched documents:", data);
      console.log("Documents count:", data?.length);
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error(error.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!hasConsent) {
      setIsConsentDialogOpen(true);
      return;
    }
    setIsDialogOpen(true);
  };

  const handleConsentGranted = async () => {
    try {
      // Get Google OAuth authorization URL immediately after consent is granted
      // The backend will verify consent before generating the URL
      const authUrl = await googleOAuthAPI.getAuthorizationUrl();
      
      if (!authUrl || authUrl.trim() === "") {
        throw new Error("Failed to get Google authorization URL. Please try again.");
      }
      
      // Redirect to Google OAuth immediately
      // Use window.location.replace to prevent back button issues
      window.location.replace(authUrl);
    } catch (error: any) {
      console.error("Error in handleConsentGranted:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to initiate Google Drive connection. Please try again.";
      toast.error(errorMessage);
      
      // Refresh consent status in case of error to update UI
      await checkConsentAndConnection();
    }
  };

  const handleUpload = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedFile || !formData.title || !formData.category) {
      toast.error("Please fill all required fields and select a file");
      return;
    }

    if (!hasConsent) {
      setIsConsentDialogOpen(true);
      return;
    }

    setUploading(true);
    try {
      await documentsAPI.upload(panchayatId, selectedFile, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        visibility: formData.visibility,
      });
      toast.success("Document uploaded successfully to your Google Drive");
      setIsDialogOpen(false);
      setSelectedFile(null);
      setFormData({ title: "", description: "", category: "", visibility: "PRIVATE" });
      fetchDocuments();
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || "Failed to upload document";
      
      // Refresh consent status in case it changed
      await checkConsentAndConnection();
      
      if (errorMessage.toLowerCase().includes("consent")) {
        toast.error("Consent is required. Please grant consent first.");
        setIsConsentDialogOpen(true);
      } else if (errorMessage.toLowerCase().includes("google drive") || 
                 errorMessage.toLowerCase().includes("not authorized") ||
                 errorMessage.toLowerCase().includes("oauth") ||
                 errorMessage.toLowerCase().includes("token")) {
        toast.error("Google Drive connection required. Please connect your Google Drive first.");
        try {
          const authUrl = await googleOAuthAPI.getAuthorizationUrl();
          window.location.href = authUrl;
        } catch (authError) {
          toast.error("Failed to initiate Google Drive connection. Please try again.");
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleToggleShowOnWebsite = async (doc: Document) => {
    const docId = doc.id || String(doc.documentId);
    if (!docId) return;

    try {
      await documentsAPI.toggleShowOnWebsite(docId);
      toast.success(
        doc.showOnWebsite 
          ? "Document removed from public website" 
          : "Document added to public website"
      );
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "Failed to update document");
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setEditFormData({
      title: doc.title,
      description: doc.description || "",
      category: doc.category,
      visibility: (doc.visibility || doc.isPublic ? "PUBLIC" : "PRIVATE") as "PUBLIC" | "PRIVATE",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingDocument || !editFormData.title || !editFormData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const docId = editingDocument.id || String(editingDocument.documentId);
      await documentsAPI.update(docId, {
        title: editFormData.title,
        description: editFormData.description,
        category: editFormData.category,
        visibility: editFormData.visibility,
      });
      toast.success("Document updated successfully");
      setIsEditDialogOpen(false);
      setEditingDocument(null);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "Failed to update document");
    }
  };

  const handleUpdateVisibility = async (doc: Document, visibility: "PUBLIC" | "PRIVATE") => {
    const docId = doc.id || String(doc.documentId);
    if (!docId) return;

    try {
      await documentsAPI.updateVisibility(docId, visibility);
      toast.success(`Document visibility changed to ${visibility.toLowerCase()}`);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "Failed to update visibility");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? This will also delete it from your Google Drive.")) return;

    try {
      await documentsAPI.delete(id || String(documents.find(d => d.documentId?.toString() === id || d.id === id)?.documentId || id));
      toast.success("Document deleted successfully");
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    }
  };

  const handleView = async (doc: Document) => {
    if (!doc.isAvailable) {
      toast.error("This document is no longer available");
      return;
    }

    // If view link is already available, use it
    if (doc.viewLink) {
      setViewingDocument(doc);
      setIsViewerOpen(true);
      return;
    }

    // Otherwise, fetch it
    if (doc.id || doc.documentId) {
      try {
        const viewLink = await documentsAPI.getViewLink(doc.id || String(doc.documentId));
        if (viewLink) {
          const docWithLink = { ...doc, viewLink };
          setViewingDocument(docWithLink);
          setIsViewerOpen(true);
        } else {
          toast.error("Document view link not available");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to get document view link");
      }
    } else {
      toast.error("Document not available");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const categories = [
    { value: "NOTICE", label: "Notice" },
    { value: "REPORT", label: "Report" },
    { value: "BUDGET", label: "Budget" },
    { value: "TENDER", label: "Tender" },
    { value: "FORM", label: "Form" },
    { value: "RESOLUTION", label: "Resolution" },
    { value: "OTHER", label: "Other" },
  ];

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checkingConsent || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933] mx-auto"></div>
          <p className="mt-4 text-[#666]">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1B2B5E]">Documents Management</h2>
          <p className="text-sm sm:text-base text-[#666] mt-1">Upload and manage panchayat documents</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {!hasConsent && (
            <Button 
              variant="outline" 
              onClick={() => setIsConsentDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Grant Consent
            </Button>
          )}
          <Button 
            onClick={handleUploadClick} 
            className="w-full sm:w-auto" 
            disabled={!hasConsent || !isGoogleDriveConnected || checkingConsent}
            title={
              checkingConsent 
                ? "Checking status..." 
                : !hasConsent 
                  ? "Grant consent first" 
                  : !isGoogleDriveConnected 
                    ? "Connect Google Drive first" 
                    : "Upload document"
            }
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
            {checkingConsent && <span className="ml-2 text-xs">(checking...)</span>}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666]" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile: Card View */}
          <div className="block sm:hidden space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-[#666] text-sm">
                No documents found. Upload your first document.
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <Card key={doc.id || doc.documentId || `doc-${doc.title}-${doc.createdAt}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{doc.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-[#666]" />
                          <span className="text-xs text-muted-foreground truncate">{doc.fileName}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                        <Badge variant={(doc.visibility || doc.isPublic) === "PUBLIC" ? "default" : "secondary"} className="text-xs">
                          {(doc.visibility || doc.isPublic) === "PUBLIC" ? "Public" : "Private"}
                        </Badge>
                        {doc.showOnWebsite && (
                          <Badge variant="default" className="text-xs bg-[#138808]">
                            <Globe className="h-3 w-3 mr-1" />
                            On Website
                          </Badge>
                        )}
                        {!doc.isAvailable && (
                          <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                        )}
                        <span className="text-muted-foreground">{formatFileSize(doc.fileSize || 0)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{formatTimeAgo(doc.uploadedAt || doc.createdAt || "")}</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleView(doc)}
                          disabled={!doc.isAvailable}
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant={doc.showOnWebsite ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleToggleShowOnWebsite(doc)}
                          disabled={!doc.isAvailable || doc.visibility !== "PUBLIC"}
                          title={doc.visibility !== "PUBLIC" ? "Make document public first" : doc.showOnWebsite ? "Remove from website" : "Show on website"}
                        >
                          <Globe className="mr-2 h-3 w-3" />
                          {doc.showOnWebsite ? "On Website" : "Add to Website"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive"
                          onClick={() => handleDelete(doc.id || String(doc.documentId))}
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
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[#666]">
                      No documents found. Upload your first document.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id || doc.documentId || `doc-${doc.title}-${doc.createdAt}`}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#666]" />
                          <span className="text-sm text-[#666]">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[#666]">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={(doc.visibility || doc.isPublic) === "PUBLIC" ? "default" : "secondary"}>
                          {(doc.visibility || doc.isPublic) === "PUBLIC" ? "Public" : "Private"}
                        </Badge>
                        {doc.showOnWebsite && (
                          <Badge variant="default" className="ml-2 bg-[#138808]">
                            <Globe className="h-3 w-3 mr-1" />
                            On Website
                          </Badge>
                        )}
                        {!doc.isAvailable && (
                          <Badge variant="destructive" className="ml-2">Unavailable</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#666]">
                        {formatTimeAgo(doc.uploadedAt || doc.createdAt || "")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(doc)}
                            disabled={!doc.isAvailable}
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(doc)}
                            title="Edit document"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={doc.showOnWebsite ? "default" : "ghost"}
                            size="icon"
                            onClick={() => handleToggleShowOnWebsite(doc)}
                            disabled={!doc.isAvailable || doc.visibility !== "PUBLIC"}
                            title={doc.visibility !== "PUBLIC" ? "Make document public first" : doc.showOnWebsite ? "Remove from website" : "Show on website"}
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => handleDelete(doc.id || String(doc.documentId))}
                            title="Delete document"
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a new document to your panchayat</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-[#666]">Selected: {selectedFile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter document title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter document description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.visibility === "PUBLIC"}
                onCheckedChange={(checked) => setFormData({ ...formData, visibility: checked ? "PUBLIC" : "PRIVATE" })}
              />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Make this document public
              </Label>
            </div>
            {(!hasConsent || !isGoogleDriveConnected) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-800">
                    {!hasConsent && !isGoogleDriveConnected && (
                      <p>You need to grant consent and connect Google Drive before uploading documents.</p>
                    )}
                    {!hasConsent && isGoogleDriveConnected && (
                      <p>You need to grant consent before uploading documents.</p>
                    )}
                    {hasConsent && !isGoogleDriveConnected && (
                      <p>You need to connect Google Drive before uploading documents.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              type="button"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedFile(null);
                setFormData({ title: "", description: "", category: "", visibility: "PRIVATE" });
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={(e) => handleUpload(e)}
              disabled={uploading || !hasConsent || !isGoogleDriveConnected}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to Google Drive
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Enter document title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Enter document description (optional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={editFormData.category} onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isPublic"
                checked={editFormData.visibility === "PUBLIC"}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, visibility: checked ? "PUBLIC" : "PRIVATE" })}
              />
              <Label htmlFor="edit-isPublic" className="cursor-pointer">
                Make this document public
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              type="button"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingDocument(null);
                setEditFormData({ title: "", description: "", category: "", visibility: "PRIVATE" });
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleUpdate}
              disabled={!editFormData.title || !editFormData.category}
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConsentDialog
        open={isConsentDialogOpen}
        onOpenChange={setIsConsentDialogOpen}
        onConsentGranted={handleConsentGranted}
      />

      <DocumentViewer
        document={viewingDocument}
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
      />
    </div>
  );
}
