// firebase/materials.api.ts
import { apiClient } from "./api";

/* ---------- Types you can reuse in your components ---------- */
export type ResumePayload = {
  resumeId: string;
  versionLabel?: string;
  snapshot?: any;       // frozen copy of Resume.content (optional)
  pdfUrl?: string;      // optional CDN link to a rendered PDF
};

export type CoverLetterUrl = { source: "url"; url: string; title?: string };
export type CoverLetterInline = { source: "inline"; inline: string; title?: string };
export type CoverLetterPayload = CoverLetterUrl | CoverLetterInline;

export type MaterialsCurrent = {
  resume: ResumePayload;
  coverLetter: CoverLetterPayload;
  attachedAt: string;   // ISO
};

export type MaterialsHistoryEntry = {
  at: string;           // ISO
  by: string;           // userId
  resume: ResumePayload;
  coverLetter: CoverLetterPayload;
  note?: string;
};

export type MaterialsResponse = {
  current: MaterialsCurrent | null;
  history: MaterialsHistoryEntry[];
  defaults?: { resumeId?: string; coverLetterUrl?: string };
};

/* --------------------------- API wrappers --------------------------- */

export const getMaterials = async (jobId: string): Promise<MaterialsResponse> =>
  apiClient.fetch(`/jobs/${jobId}/materials`, { method: "GET" });

export const upsertMaterials = async (
  jobId: string,
  payload: {
    resume: ResumePayload;
    coverLetter: CoverLetterPayload;
    note?: string;
  }
): Promise<{ ok: true }> =>
  apiClient.fetch(`/jobs/${jobId}/materials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const setMaterialDefaults = async (
  jobId: string,
  payload: { resumeId?: string; coverLetterUrl?: string }
): Promise<{ ok: true }> =>
  apiClient.fetch(`/jobs/${jobId}/materials/defaults`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const materialsAnalytics = async (
  jobId: string
): Promise<{ mostUsedResumeId: string | null; counts: { resume: Record<string, number> } }> =>
  apiClient.fetch(`/jobs/${jobId}/materials/analytics`, { method: "GET" });
