// lib/coverLetter.api.ts
import { apiClient } from "./api";

export interface CoverLetterData {
  userId: string;
  jobId?: string;
  title: string;
  content: {
    greeting: string;
    opening: string;
    body: string[];
    closing: string;
    signature: string;
  };
  tone?: string;
  culture?: string;
}

export const saveCoverLetter = async (data: CoverLetterData) => {
  return apiClient.fetch("/cover-letters", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const getCoverLettersByUserId = async (userId: string) => {
  return apiClient.fetch(`/cover-letters/user/${userId}`, {
    method: "GET",
  });
};

export const getCoverLettersByJobId = async (jobId: string) => {
  return apiClient.fetch(`/cover-letters/job/${jobId}`, {
    method: "GET",
  });
};

export const getCoverLetter = async (id: string) => {
  return apiClient.fetch(`/cover-letters/${id}`, {
    method: "GET",
  });
};

export const updateCoverLetter = async (
  id: string,
  data: Partial<CoverLetterData>
) => {
  return apiClient.fetch(`/cover-letters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const deleteCoverLetter = async (id: string) => {
  return apiClient.fetch(`/cover-letters/${id}`, {
    method: "DELETE",
  });
};
