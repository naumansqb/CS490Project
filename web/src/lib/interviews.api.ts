// lib/interviews.api.ts
import { apiClient } from "./api";

// ============================================
// INTERVIEW TYPES
// ============================================

export interface Interview {
  id: string;
  job_id: string;
  scheduled_date: string;
  interview_type: 'phone' | 'video' | 'in-person';
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  meeting_link?: string;
  phone_number?: string;
  interviewer_name?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewWithJob extends Interview {
  job_opportunity: {
    id: string;
    title: string;
    company: string;
    industry: string;
    jobType: string;
    location?: string;
  };
}

// ============================================
// INTERVIEW CRUD
// ============================================

export const createInterview = async (interviewData: {
  jobId: string;
  scheduleDate: string;
  interviewType: 'phone' | 'video' | 'in-person';
  durationMinutes?: number;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  meetingLink?: string;
  phoneNumber?: string;
  interviewerName?: string;
}): Promise<Interview> => {
  return apiClient.fetch("/interviews", {
    method: "POST",
    body: JSON.stringify(interviewData),
  }) as Promise<Interview>;
};

export const getInterviewById = async (id: string): Promise<Interview> => {
  return apiClient.fetch(`/interviews/${id}`, {
    method: "GET",
  }) as Promise<Interview>;
};

export const getInterviewByJobId = async (jobId: string): Promise<Interview | null> => {
  return apiClient.fetch(`/interviews/job/${jobId}`, {
    method: "GET",
  }) as Promise<Interview | null>;
};

export const getUserInterviews = async (filters?: {
  status?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<InterviewWithJob[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.fromDate) params.append('fromDate', filters.fromDate);
  if (filters?.toDate) params.append('toDate', filters.toDate);

  const queryString = params.toString();
  const url = queryString ? `/interviews?${queryString}` : '/interviews';

  return apiClient.fetch(url, {
    method: "GET",
  }) as Promise<InterviewWithJob[]>;
};

export const getUpcomingInterviews = async (): Promise<InterviewWithJob[]> => {
  return apiClient.fetch("/interviews/upcoming", {
    method: "GET",
  }) as Promise<InterviewWithJob[]>;
};

export const updateInterview = async (
  id: string,
  interviewData: Partial<{
    scheduled_date: string;
    interviewType: 'phone' | 'video' | 'in-person';
    durationMinutes: number;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    location: string;
    meetingLink: string;
    phoneNumber: string;
    interviewerName: string;
  }>
): Promise<Interview> => {
  return apiClient.fetch(`/interviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify(interviewData),
  }) as Promise<Interview>;
};

export const deleteInterview = async (id: string): Promise<void> => {
  try {
    await apiClient.fetch(`/interviews/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error('API Error - Delete Interview:', error);
    throw error;
  }
};

export const cancelInterview = async (id: string): Promise<Interview> => {
  return apiClient.fetch(`/interviews/${id}/cancel`, {
    method: "PATCH",
  }) as Promise<Interview>;
};

// Types for interview response analysis
export interface AnalyzeResponseInput {
  question: string;
  questionCategory: 'technical' | 'behavioral' | 'cultural' | 'situational';
  response: string;
  jobTitle?: string;
  companyName?: string;
}

export interface ResponseAnalysis {
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  starFrameworkUsed: boolean;
  detailedFeedback: string;
  alternativeApproaches?: string[];
}

export interface AnalyzeResponseResponse {
  success: boolean;
  data: ResponseAnalysis;
  error?: string;
}

/**
 * Analyze a user's interview response using AI
 */
export async function analyzeInterviewResponse(
  input: AnalyzeResponseInput
): Promise<AnalyzeResponseResponse> {
  try {
    const response = await apiClient.fetch<AnalyzeResponseResponse>(
      '/ai/interview/analyze',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );

    return response;
  } catch (error: any) {
    console.error('[Interview API] Failed to analyze response:', error);
    throw error;
  }
}

/**
 * Update a single checklist item completion status
 */
export const updateChecklistItem = async (
  jobId: string,
  taskIndex: number,
  completed: boolean
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log(" [API Job Id]", jobId);
    const response = await apiClient.fetch<{ success: boolean; data: any }>(
      '/ai/interview-insights/checklist',
      {
        method: 'PUT',
        body: JSON.stringify({ jobId, taskIndex, completed }),
      }
    );

    return response;
  } catch (error: any) {
    console.error('[Update Checklist Item Error]', error);
    return {
      success: false,
      error: error?.message || 'Failed to update checklist item',
    };
  }
};

/**
 * Bulk update multiple checklist items
 */
export const updateChecklistBulk = async (
  jobId: string,
  updates: Array<{ taskIndex: number; completed: boolean }>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await apiClient.fetch<{ success: boolean; data: any }>(
      '/ai/interview-insights/checklist/bulk',
      {
        method: 'PUT',
        body: JSON.stringify({ jobId, updates }),
      }
    );

    return response;
  } catch (error: any) {
    console.error('[Update Checklist Bulk Error]', error);
    return {
      success: false,
      error: error?.message || 'Failed to update checklist items',
    };
  }
};