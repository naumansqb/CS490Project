import { apiClient } from "./api";

/**
 * Get all education entries for a user
 * GET /education/user/:userId
 */
export const getEducationsByUserId = async (userId: string) => {
  return apiClient.fetch(`/education/user/${userId}`, {
    method: "GET",
  });
};

/**
 * Get a single education entry by ID
 * GET /education/:id
 */
export const getEducation = async (id: string) => {
  return apiClient.fetch(`/education/${id}`, {
    method: "GET",
  });
};

/**
 * Create a new education entry
 * POST /education
 */
export const createEducation = async (payload: any) => {
  return apiClient.fetch(`/education`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Update an existing education entry
 * PUT /education/:id
 */
export const updateEducation = async (id: string, payload: any) => {
  return apiClient.fetch(`/education/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

/**
 * Delete an education entry
 * DELETE /education/:id
 */
export const deleteEducation = async (id: string) => {
  return apiClient.fetch(`/education/${id}`, {
    method: "DELETE",
  });
};
