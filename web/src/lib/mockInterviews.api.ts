import { apiClient } from './api';

// Types matching the backend
export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'cultural' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedPoints?: string[];
}

export interface ResponseFeedback {
  strengths: string[];
  improvements: string[];
  score: number;
  detailedFeedback: string;
}

export interface PerformanceSummary {
  overallScore: number;
  categoryScores: {
    technical?: number;
    behavioral?: number;
    cultural?: number;
    situational?: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  confidenceTips: string[];
  readinessLevel: 'needs-practice' | 'good' | 'excellent';
  detailedAnalysis: string;
}

export interface GenerateQuestionsRequest {
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  insightsData?: any;
  numberOfQuestions?: number;
}

export interface EvaluateResponseRequest {
  question: string;
  category: string;
  difficulty: string;
  expectedPoints?: string[];
  userResponse: string;
  jobTitle: string;
  companyName: string;
}

export interface GenerateSummaryRequest {
  jobTitle: string;
  companyName: string;
  responses: Array<{
    question: string;
    category: string;
    response: string;
    feedback: ResponseFeedback;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Generate mock interview questions
 */
export const generateMockInterviewQuestions = async (
  data: GenerateQuestionsRequest
): Promise<InterviewQuestion[]> => {
  try {
    const response = await apiClient.fetch<ApiResponse<{ questions: InterviewQuestion[] }>>(
      '/ai/mock-interview/generate-questions',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data.questions;
  } catch (error: any) {
    console.error('[Mock Interview API] Error generating questions:', error);
    throw new Error(
      error.message || 'Failed to generate interview questions'
    );
  }
};

/**
 * Evaluate a mock interview response
 */
export const evaluateMockInterviewResponse = async (
  data: EvaluateResponseRequest
): Promise<ResponseFeedback> => {
  try {
    const response = await apiClient.fetch<ApiResponse<{ feedback: ResponseFeedback }>>(
      '/ai/mock-interview/evaluate-response',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data.feedback;
  } catch (error: any) {
    console.error('[Mock Interview API] Error evaluating response:', error);
    throw new Error(
      error.message || 'Failed to evaluate response'
    );
  }
};

/**
 * Generate mock interview performance summary
 */
export const generateMockInterviewSummary = async (
  data: GenerateSummaryRequest
): Promise<PerformanceSummary> => {
  try {
    const response = await apiClient.fetch<ApiResponse<{ summary: PerformanceSummary }>>(
      '/ai/mock-interview/generate-summary',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data.summary;
  } catch (error: any) {
    console.error('[Mock Interview API] Error generating summary:', error);
    throw new Error(
      error.message || 'Failed to generate performance summary'
    );
  }
};