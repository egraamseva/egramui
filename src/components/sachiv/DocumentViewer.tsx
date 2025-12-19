/**
 * Document Viewer Component
 * Displays Google Drive document preview in an iframe
 */

import { useState, useEffect } from "react";
import { X, ExternalLink, Download, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { documentsAPI } from "../../services/api";
import type { Document } from "../../types";

interface DocumentViewerProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewer({
  document,
  open,
  onOpenChange,
}: DocumentViewerProps) {
  const [viewLink, setViewLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && document) {
      loadViewLink();
    } else {
      setViewLink(null);
      setError(null);
    }
  }, [open, document]);

  const loadViewLink = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);

    try {
      // If view link is already available, use it
      if (document.viewLink) {
        setViewLink(document.viewLink);
        setLoading(false);
        return;
      }

      // Otherwise, fetch it
      if (document.id || document.documentId) {
        const link = await documentsAPI.getViewLink(
          document.id || String(document.documentId)
        );
        setViewLink(link);
      } else {
        throw new Error("Document ID not available");
      }
    } catch (err: any) {
      console.error("Failed to load document view link:", err);
      setError(err.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (viewLink) {
      // Open in new tab for download
      window.open(viewLink, "_blank");
    }
  };

  const handleOpenInDrive = () => {
    if (document?.googleDriveFileId) {
      window.open(
        `https://drive.google.com/file/d/${document.googleDriveFileId}/view`,
        "_blank"
      );
    } else if (viewLink) {
      window.open(viewLink, "_blank");
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-[#1B2B5E]">
              {document.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!viewLink}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInDrive}
                disabled={!document.googleDriveFileId && !viewLink}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Drive
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E31E24] mx-auto mb-4" />
                <p className="text-[#666]">Loading document...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1B2B5E] mb-2">
                  Document Not Available
                </h3>
                <p className="text-[#666] mb-4">{error}</p>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : viewLink ? (
            <iframe
              src={viewLink}
              className="w-full h-[60vh] border-0"
              title={document.title}
              allow="fullscreen"
            />
          ) : (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-[#666]">Document preview not available</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleOpenInDrive}
                >
                  Open in Google Drive
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

