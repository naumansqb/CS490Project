// controllers/materials.controller.ts
import { Response } from "express";
import { prisma } from "../db";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendErrorResponse } from "../utils/errorResponse";

/* -------------------------------------------------------------------------- */
/*                               Types & helpers                              */
/* -------------------------------------------------------------------------- */

type ResumePayload = {
  resumeId: string;
  versionLabel?: string;
  snapshot?: any;          // optional frozen copy of Resume.content
  pdfUrl?: string;
};

type CoverLetterUrl = { source: "url"; url: string; title?: string };
type CoverLetterInline = { source: "inline"; inline: string; title?: string };
type CoverLetterPayload = CoverLetterUrl | CoverLetterInline;

const nowISO = () => new Date().toISOString();

const isString = (v: unknown): v is string => typeof v === "string";
const isNonEmpty = (s?: string | null): s is string =>
  !!s && typeof s === "string" && s.trim().length > 0;

const looksLikeUrl = (s?: string | null) => {
  if (!isNonEmpty(s)) return false;
  try {
    const u = new URL(s);
    return !!u.protocol && (u.protocol === "http:" || u.protocol === "https:");
  } catch {
    return false;
  }
};

function safeParseJSON(s?: string | null) {
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/**
 * Normalize any loose/lenient cover letter coming from the client.
 * - If "url" is present but isn't a real URL, treat it as a name and convert to inline.
 * - If already inline, keep as-is.
 * - If missing or empty, return undefined.
 */
function normalizeCoverLetter(input: any): CoverLetterPayload | undefined {
  if (!input) return undefined;

  // Already inline
  if (input.source === "inline" && isNonEmpty(input.inline)) {
    const title = isNonEmpty(input.title) ? String(input.title) : String(input.inline);
    return { source: "inline", inline: String(input.inline), title };
  }

  // URL path (from your modal, may actually be a name)
  if (input.source === "url" && isNonEmpty(input.url)) {
    const raw = String(input.url);
    if (looksLikeUrl(raw)) {
      const title = isNonEmpty(input.title) ? String(input.title) : raw;
      return { source: "url", url: raw, title };
    } else {
      // It's actually a name/label, not a valid URL → coerce to inline
      return { source: "inline", inline: raw, title: raw };
    }
  }

  // If nothing valid, undefined
  return undefined;
}

/**
 * Normalize optional resume from client.
 * - Accept any non-empty resumeId (string). Everything else optional.
 * - If nothing meaningful, return undefined.
 */
function normalizeResume(input: any): ResumePayload | undefined {
  if (!input || !isNonEmpty(input.resumeId)) return undefined;
  const resume: ResumePayload = {
    resumeId: String(input.resumeId).trim(),
  };
  if (isNonEmpty(input.versionLabel)) resume.versionLabel = String(input.versionLabel).trim();
  if (isNonEmpty(input.pdfUrl)) resume.pdfUrl = String(input.pdfUrl).trim();
  if (input.snapshot !== undefined) resume.snapshot = input.snapshot;
  return resume;
}

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

// GET /jobs/:id/materials
export const getMaterials = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const job = await prisma.jobOpportunity.findUnique({ where: { id } });
  if (!job) return sendErrorResponse(res, 404, "NOT_FOUND", "Job not found");
  if (job.userId !== userId)
    return sendErrorResponse(res, 403, "FORBIDDEN", "Not authorized");

  const notes = safeParseJSON(job.personalNotes);
  res.json(notes.materials ?? { current: null, history: [] });
};

// POST /jobs/:id/materials  (create/update current; append history)
export const upsertMaterials = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    const job = await prisma.jobOpportunity.findUnique({ where: { id } });
    if (!job) return sendErrorResponse(res, 404, "NOT_FOUND", "Job not found");
    if (job.userId !== userId)
      return sendErrorResponse(res, 403, "FORBIDDEN", "Not authorized");

    // Everything is optional now:
    const body = req.body || {};
    const resume = normalizeResume(body.resume);
    const coverLetter = normalizeCoverLetter(body.coverLetter);
    const note: string =
      (isNonEmpty(body.note) ? String(body.note).trim() : "") || "Materials updated";

    const notes = safeParseJSON(job.personalNotes);
    const materials =
      notes.materials ??
      ({
        current: null,
        history: [],
        defaults: notes.materials?.defaults ?? {},
      } as {
        current: any;
        history: any[];
        defaults?: Record<string, any>;
      });

    const at = nowISO();
    const entry = {
      at,
      by: userId,
      ...(resume ? { resume } : {}),
      ...(coverLetter ? { coverLetter } : {}),
      note,
    };

    // Only update current fields that are provided;
    // preserve previously set pieces if a field is omitted.
    const currentPrev = materials.current ?? null;
    const nextCurrent =
      resume || coverLetter
        ? {
            resume: resume ?? currentPrev?.resume ?? null,
            coverLetter: coverLetter ?? currentPrev?.coverLetter ?? null,
            attachedAt: at,
          }
        : currentPrev;

    materials.current = nextCurrent;
    materials.history = [entry, ...(materials.history ?? [])];

    await prisma.jobOpportunity.update({
      where: { id },
      data: { personalNotes: JSON.stringify({ ...notes, materials }) },
    });

    // Application history note (informational)
    await prisma.applicationHistory.create({
      data: {
        jobId: id,
        status: "applied",
        notes: note,
      },
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    sendErrorResponse(res, 500, "INTERNAL_ERROR", "Failed to update materials");
  }
};

// PATCH /jobs/:id/materials/defaults
export const setMaterialDefaults = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params; // jobId used only to check ownership
  const { resumeId, coverLetterUrl } = req.body as {
    resumeId?: string;
    coverLetterUrl?: string;
  };

  const job = await prisma.jobOpportunity.findUnique({ where: { id } });
  if (!job) return sendErrorResponse(res, 404, "NOT_FOUND", "Job not found");
  if (job.userId !== userId)
    return sendErrorResponse(res, 403, "FORBIDDEN", "Not authorized");

  const notes = safeParseJSON(job.personalNotes);
  const materials = notes.materials ?? {};
  materials.defaults = {
    ...(materials.defaults ?? {}),
    ...(isNonEmpty(resumeId) ? { resumeId } : {}),
    ...(looksLikeUrl(coverLetterUrl) ? { coverLetterUrl } : {}),
  };

  await prisma.jobOpportunity.update({
    where: { id },
    data: { personalNotes: JSON.stringify({ ...notes, materials }) },
  });

  res.json({ ok: true });
};

// GET /jobs/:id/materials/analytics
export const materialsAnalytics = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const jobs = await prisma.jobOpportunity.findMany({ where: { userId } });

  const resumeCounts: Record<string, number> = {};
  for (const j of jobs) {
    const notes = safeParseJSON(j.personalNotes);
    const hist = notes?.materials?.history ?? [];
    for (const h of hist) {
      const rid = h?.resume?.resumeId as string | undefined;
      if (rid) resumeCounts[rid] = (resumeCounts[rid] ?? 0) + 1;
    }
  }

  const mostUsedResumeId =
    Object.entries(resumeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  res.json({ mostUsedResumeId, counts: { resume: resumeCounts } });
};
