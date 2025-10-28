// src/lib/specialProject.api.ts
import { apiClient } from "./api";

export type SpecialProject = {
  id?: string;
  projectName: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  projectUrl?: string;
  repositoryUrl?: string;
  skillsDemonstrated?: string[];
  createdAt?: string;
  updatedAt?: string;
};

// ✅ Get all projects for a user
export const getProjectsByUserId = (userId: string) => {
  return apiClient.fetch<SpecialProject[]>(`/special-projects/user/${userId}`, {
    method: "GET",
  });
};

// ✅ Create new project
export const createProject = (payload: Partial<SpecialProject>) => {
  return apiClient.fetch<SpecialProject>(`/special-projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

// ✅ Update existing project
export const updateProject = (id: string, payload: Partial<SpecialProject>) => {
  return apiClient.fetch<SpecialProject>(`/special-projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

// ✅ Delete a project
export const deleteProject = (id: string) => {
  return apiClient.fetch(`/special-projects/${id}`, {
    method: "DELETE",
  });
};
