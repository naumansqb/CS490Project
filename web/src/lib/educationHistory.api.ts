import { apiClient } from "./api";

/**
 * Get all education entries for a user
 * GET /education/user/:userId
 */
export const getEducationsByUserId = async (userId: string) => {
  return apiClient.fetch(`/educations/user/${userId}`, {
    method: "GET",
  });
};

/**
 * Get a single education entry by ID
 * GET /education/:id
 */
export const getEducation = async (id: string) => {
  return apiClient.fetch(`/educations/${id}`, {
    method: "GET",
  });
};

/**
 * Create a new education entry
 * POST /education
 */
export const createEducation = async (payload: any) => {
  console.log("Creating education with payload:", payload);
  return apiClient.fetch(`/educations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Update an existing education entry
 * PUT /education/:id
 */
export const updateEducation = async (id: string, payload: any) => {
  console.log("Updating education with payload:", payload);
  return apiClient.fetch(`/educations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/**
 * Delete an education entry
 * DELETE /education/:id
 */
export const deleteEducation = async (id: string) => {
  return apiClient.fetch(`/educations/${id}`, {
    method: "DELETE",
  });
};
