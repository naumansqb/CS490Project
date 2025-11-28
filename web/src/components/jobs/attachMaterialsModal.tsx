"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertMaterials } from "@/lib/materials.api";

type Props = {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function AttachMaterialsModal({ jobId, isOpen, onClose }: Props) {
  const [resumeId, setResumeId] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [coverLetterUrl, setCoverLetterUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      await upsertMaterials(jobId, {
        resume: { resumeId, versionLabel },
        coverLetter: { source: "url", url: coverLetterUrl },
        note,
      });

      setMessage("✅ Materials saved successfully!");
      // optional: auto-close modal after short delay
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setError(err?.message || "❌ Failed to save materials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach Application Materials</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="resumeId">Resume ID</Label>
            <Input
              id="resumeId"
              placeholder="res_123"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="versionLabel">Resume Version Label</Label>
            <Input
              id="versionLabel"
              placeholder="v3 - Data Scientist"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="coverLetterUrl">Cover Letter URL</Label>
            <Input
              id="coverLetterUrl"
              placeholder="https://docs.google.com/document/..."
              value={coverLetterUrl}
              onChange={(e) => setCoverLetterUrl(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="e.g., Initial submission materials"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Materials"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
