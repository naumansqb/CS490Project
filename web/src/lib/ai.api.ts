// lib/ai.api.ts
import { apiClient } from "./api";

export interface SkillWithDescription {
  name: string;
  description: string;
  matchesJob: boolean;
}

export interface TailoredResumeContent {
  summary: string;
  workExperiences: {
    companyName: string;
    positionTitle: string;
    startDate: string;
    endDate?: string;
    bulletPoints: string[];
  }[];
  skills: {
    technical: SkillWithDescription[];
    soft: SkillWithDescription[];
    relevant: SkillWithDescription[];
  };
  education: {
    institutionName: string;
    degreeType: string;
    major: string;
    graduationDate?: string;
  }[];
  certifications?: {
    name: string;
    organization: string;
    date: string;
  }[];
  projects?: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  feedback: {
    strengths: string[];
    improvements: string[];
    missingElements?: string[];
  };
  matchScore: {
    experienceRelevance: {
      positionTitle: string;
      companyName: string;
      relevanceScore: number;
    }[];
  };
  jobInfo?: {
    id: string;
    title: string;
    company: string;
  };
  templateInfo?: {
    type: string;
    name: string;
  };
}

export const aiApi = {
  async tailorResumeToJob(
    resumeId: string,
    jobId: string,
    userId: string
  ): Promise<TailoredResumeContent> {
    const response = await apiClient.fetch<{ success: boolean; data: TailoredResumeContent }>(
      `/ai/resume/${resumeId}/tailor-to-job`,
      {
        method: "POST",
        body: JSON.stringify({ jobId, userId }),
      }
    );
    return response.data;
  },

  async generateTailoredResume(
    userId: string,
    jobDescription: string
  ): Promise<TailoredResumeContent> {
    const response = await apiClient.fetch<{ success: boolean; data: TailoredResumeContent }>(
      "/ai/resume/tailor",
      {
        method: "POST",
        body: JSON.stringify({ userId, jobDescription }),
      }
    );
    return response.data;
  },
};

export interface ReferralTemplateRequest {
  contactName: string;
  contactCompany?: string;
  contactJobTitle?: string;
  relationshipStrength?: number;
  relationshipType?: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  templateStyle?: 'professional' | 'casual' | 'warm' | 'direct';
}

export interface ReferralTemplateResponse {
  message: string;
  subject: string;
  keyPoints?: string[];
}

export const generateReferralTemplate = async (
  input: ReferralTemplateRequest
): Promise<ReferralTemplateResponse> => {
  const response = await apiClient.fetch<{ success: boolean; data: ReferralTemplateResponse }>(
    "/ai/referral-template/generate",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return response.data;
};

