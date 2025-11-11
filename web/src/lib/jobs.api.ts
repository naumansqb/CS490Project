// lib/jobOpportunity.api.ts
import { apiClient } from "./api";

// ============================================
// JOB OPPORTUNITY CRUD
// ============================================

export const createJobOpportunity = async (jobData: {
  userId: string;
  title: string;
  company: string;
  location?: string;
  salaryMin?: string;
  salaryMax?: string;
  postingUrl?: string;
  deadline?: string;
  description?: string;
  industry: string;
  jobType: string;
  personalNotes?: string;
  salaryNegotiationNotes?: string;
  interviewNotes?: string;
}) => {
  return apiClient.fetch("/job-opportunities", {
    method: "POST",
    body: JSON.stringify(jobData),
  });
};

export const getJobOpportunity = async (id: string) => {
  return apiClient.fetch(`/job-opportunities/${id}`, {
    method: "GET",
  });
};

export const getJobOpportunitiesByUserId = async (userId: string) => {
  return apiClient.fetch(`/job-opportunities/user/${userId}`, {
    method: "GET",
  });
};

export const updateJobOpportunity = async (
  id: string,
  jobData: Partial<{
    title: string;
    company: string;
    location: string;
    salaryMin: string;
    salaryMax: string;
    postingUrl: string;
    deadline: string;
    description: string;
    industry: string;
    jobType: string;
    personalNotes: string;
    salaryNegotiationNotes: string;
    interviewNotes: string;
  }>
) => {
  return apiClient.fetch(`/job-opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(jobData),
  });
};

export const deleteJobOpportunity = async (id: string) => {
  return apiClient.fetch(`/job-opportunities/${id}`, {
    method: "DELETE",
  });
};

// ============================================
// JOB CONTACTS CRUD
// ============================================

export const createJobContact = async (contactData: {
  jobId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
}) => {
  return apiClient.fetch("/job-contacts", {
    method: "POST",
    body: JSON.stringify(contactData),
  });
};

export const getJobContact = async (id: string) => {
  return apiClient.fetch(`/job-contacts/${id}`, {
    method: "GET",
  });
};

export const getJobContactsByJobId = async (jobId: string) => {
  return apiClient.fetch(`/job-contacts/job/${jobId}`, {
    method: "GET",
  });
};

export const updateJobContact = async (
  id: string,
  contactData: Partial<{
    name: string;
    role: string;
    email: string;
    phone: string;
  }>
) => {
  return apiClient.fetch(`/job-contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(contactData),
  });
};

export const deleteJobContact = async (id: string): Promise<void> =>  {
  try{
    await apiClient.fetch(`/job-contacts/${id}`, {
      method: "DELETE",
    });
  } catch(error) {
    console.error('API Error - Delete Contacts:', error);
    throw error;
  }
};

// ============================================
// APPLICATION HISTORY CRUD
// ============================================
export type ApplicationStatus = 
  | 'interested'
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'archived'

export const createApplicationHistory = async (historyData: {
  jobId: string;
  status: ApplicationStatus;
}) => {
  return apiClient.fetch("/application-history", {
    method: "POST",
    body: JSON.stringify(historyData),
  });
};

export const getApplicationHistory = async (id: string) => {
  return apiClient.fetch(`/application-history/${id}`, {
    method: "GET",
  });
};

export const getApplicationHistoryByJobId = async (jobId: string) => {
  return apiClient.fetch(`/application-history/job/${jobId}`, {
    method: "GET",
  });
};

export const updateApplicationHistory = async (
  id: string,
  historyData: {
    status: ApplicationStatus;
  }
) => {
  return apiClient.fetch(`/application-history/${id}`, {
    method: "PATCH",
    body: JSON.stringify(historyData),
  });
};

export const deleteApplicationHistory = async (id: string) => {
  return apiClient.fetch(`/application-history/${id}`, {
    method: "DELETE",
  });
};

// Archive a single job
export const archiveJobOpportunity = async (
  jobId: string,
  reason?: string
) => {
  return apiClient.fetch(`/job-opportunities/${jobId}/archive`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
};

// Bulk archive multiple jobs
export const bulkArchiveJobs = async (
  jobIds: string[],
  reason?: string
) => {
  return apiClient.fetch("/job-opportunities/bulk/archive", {
    method: "POST",
    body: JSON.stringify({ jobIds, reason }),
  });
};

// Restore an archived job
export const restoreJobOpportunity = async (
  jobId: string,
  restoreToStatus?: ApplicationStatus
) => {
  return apiClient.fetch(`/job-opportunities/${jobId}/restore`, {
    method: "POST",
    body: JSON.stringify({ restoreToStatus }),
  });
};

// Get all archived jobs for a user
export const getArchivedJobs = async (userId: string) => {
  return apiClient.fetch(`/job-opportunities/archived/user/${userId}`, {
    method: "GET",
  });
};

// Permanently delete a job (requires confirmation)
export const permanentlyDeleteJob = async (jobId: string) => {
  return apiClient.fetch(`/job-opportunities/${jobId}/permanent`, {
    method: "DELETE",
    body: JSON.stringify({ confirmDelete: true }),
  });
};