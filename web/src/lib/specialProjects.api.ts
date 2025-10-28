import { apiClient } from "./api";

export type SpecialProject = {
  id?: string;
  projectName: string;
  description: string;
  role: string;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
  projectUrl?: string;
  repositoryUrl?: string;
  teamSize?: number;
  collaborationDetails?: string;
  outcomes?: string;
  industry?: string;
  status?: "Completed" | "Ongoing" | "Planned";
  mediaUrl?: string;
};

export const getProjectsByUserId = (userId: string) => {
  return apiClient.fetch<SpecialProject[]>(`/projects/user/${userId}`, {
    method: "GET",
  });
};

export const createProject = (payload: FormData) => {
  return apiClient.fetch<SpecialProject>(`/projects`, {
    method: "POST",
    body: payload,
  });
};

export const updateProject = (id: string, payload: FormData) => {
  return apiClient.fetch<SpecialProject>(`/projects/${id}`, {
    method: "PUT",
    body: payload,
  });
};

export const deleteProject = (id: string) => {
  return apiClient.fetch(`/projects/${id}`, {
    method: "DELETE",
  });
};
