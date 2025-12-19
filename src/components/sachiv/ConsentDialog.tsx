/**
 * Consent Dialog Component
 * Displays consent form for Google Drive access before first document upload
 */

import { useState } from "react";
import { AlertCircle, CheckCircle2, Shield, Lock, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { consentAPI } from "../../services/api";

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsentGranted: () => void | Promise<void>;
}

export function ConsentDialog({
  open,
  onOpenChange,
  onConsentGranted,
}: ConsentDialogProps) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGrantConsent = async () => {
    if (!consentGiven) {
      toast.error("Please accept the consent to continue");
      return;
    }

    setLoading(true);
    try {
      await consentAPI.grant();
      toast.success("Consent granted successfully");
      // Call onConsentGranted which will handle the OAuth redirect
      // Don't close the dialog immediately - let the redirect happen
      // The dialog will close when the page redirects
      await onConsentGranted();
      // Only close if redirect didn't happen (shouldn't reach here normally)
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to grant consent");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-[#E31E24]/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-[#E31E24]" />
            </div>
            <DialogTitle className="text-2xl text-[#1B2B5E]">
              Google Drive Access Consent
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-[#666]">
            Before uploading documents, we need your explicit consent to store
            them in your Google Drive account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Information Section */}
          <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-[#1B2B5E] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#1B2B5E] mb-1">
                  What This Means
                </h3>
                <p className="text-sm text-[#666]">
                  Documents you upload will be stored in your personal Google
                  Drive account, not on our servers. This ensures your data
                  remains in your control.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-[#1B2B5E] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#1B2B5E] mb-1">
                  Limited Access Scope
                </h3>
                <p className="text-sm text-[#666]">
                  We only request access to files created by this application.
                  We cannot access your other Google Drive files or folders.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#138808] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#1B2B5E] mb-1">
                  Your Control
                </h3>
                <p className="text-sm text-[#666]">
                  You can revoke this access at any time from the settings page.
                  Your documents will remain in your Google Drive even after
                  revocation.
                </p>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="border border-[#E5E5E5] rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                className="mt-1"
              />
              <Label
                htmlFor="consent"
                className="cursor-pointer text-sm leading-relaxed"
              >
                <span className="font-semibold text-[#1B2B5E]">
                  I authorize this application to store documents in my Google
                  Drive account.
                </span>
                <br />
                <span className="text-[#666]">
                  I understand that documents will be stored in my personal
                  Google Drive and I can revoke this access at any time.
                </span>
              </Label>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>Privacy Note:</strong> We only store metadata (title,
                category, description) in our database. The actual files remain
                in your Google Drive. We never access files you didn't upload
                through this application.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGrantConsent}
            disabled={!consentGiven || loading}
            className="bg-[#E31E24] hover:bg-[#E31E24]/90"
          >
            {loading ? "Processing..." : "Grant Consent & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

