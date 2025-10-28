// lib/education.api.ts
import { apiClient } from "./api";

export type Education = {
  id?: string;
  institutionName: string;
  degreeType?: string;
  major?: string;            // backend uses "major"
  minor?: string;
  gpa?: number;
  showGpa?: boolean;
  isCurrent?: boolean;
  startDate?: string;        // will normalize to ISO
  graduationDate?: string;   // will normalize to ISO
  endDate?: string;          // will normalize to ISO
  honors?: string[];
  activities?: string[];
  createdAt?: string;
  updatedAt?: string;
};

/** Convert "YYYY-MM-DD" (or any parsable string) -> ISO string; else undefined */
function toISO(val?: unknown): string | undefined {
  if (!val || typeof val !== "string") return undefined;
  // Trim to be defensive against accidental spaces
  const s = val.trim();
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/** Strip undefined keys and normalize date fields */
function normalizeEducationPayload(data: Partial<Education>): Partial<Education> {
  const out: Partial<Education> = { ...data };

  // Normalize date-like fields
  if (typeof out.startDate === "string") {
    out.startDate = toISO(out.startDate);
  }
  if (typeof out.graduationDate === "string") {
    out.graduationDate = toISO(out.graduationDate);
  }
  if (typeof out.endDate === "string") {
    out.endDate = toISO(out.endDate);
  }

  // Remove keys that ended up undefined (so we don't overwrite on PATCH)
  Object.keys(out).forEach((k) => {
    // @ts-ignore
    if (out[k] === undefined) delete out[k];
  });

  return out;
}

/** GET /educations/user/:userId */
export async function getEducationsByUserId(userId: string): Promise<Education[]> {
  return apiClient.fetch(`/educations/user/${userId}`, { method: "GET" });
}

/** GET /educations/:id */
export async function getEducation(id: string): Promise<Education> {
  return apiClient.fetch(`/educations/${id}`, { method: "GET" });
}

/** POST /educations */
export async function createEducation(payload: Partial<Education>): Promise<Education> {
  const body = normalizeEducationPayload(payload);
  return apiClient.fetch(`/educations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** PATCH /educations/:id */
export async function updateEducation(id: string, payload: Partial<Education>): Promise<Education> {
  const body = normalizeEducationPayload(payload);
  return apiClient.fetch(`/educations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** DELETE /educations/:id */
export async function deleteEducation(id: string): Promise<void> {
  await apiClient.fetch(`/educations/${id}`, { method: "DELETE" });
}
