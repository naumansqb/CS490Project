// lib/company.api.ts
import { apiClient } from "./api";
import { CompanyData } from "@/components/jobs/CompanyProfile";
import { CompanyNewsArticle } from "@/components/jobs/CompanyNewsFeed";
import { JobMatchScoreData } from "@/components/jobs/JobMatchScore";
import { SkillsGapData } from "@/components/jobs/SkillsGapAnalysis";
import { InterviewInsightsData } from "@/components/jobs/InterviewPrepDashboard";

// ============================================
// COMPANY RESEARCH API
// ============================================

export interface CompanyResearchInput {
  companyName: string;
  jobId?: string;
  additionalContext?: string;
  forceRefresh?: boolean;
}

// Backend response structure
interface CompanyResearchResult {
  companyName: string;
  companySize?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  mission?: string;
  logoUrl?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  glassdoorRating?: number;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
  };
  leadership?: Array<{
    name: string;
    title: string;
  }>;
  productsAndServices?: string[];
  competitiveLandscape?: string;
}

export interface CompanyResearchResponse {
  success: boolean;
  data: CompanyResearchResult;
}

// Transform backend response to frontend CompanyData format
const transformCompanyData = (result: CompanyResearchResult): CompanyData => {
  return {
    companyName: result.companyName,
    companySize: result.companySize ?? null,
    industry: result.industry ?? null,
    location: result.location ?? null,
    website: result.website ?? null,
    description: result.description ?? null,
    mission: result.mission ?? null,
    logoUrl: result.logoUrl ?? null,
    contactInfo: result.contactInfo
      ? {
          email: result.contactInfo.email ?? null,
          phone: result.contactInfo.phone ?? null,
          address: result.contactInfo.address ?? null,
        }
      : null,
    glassdoorRating: result.glassdoorRating ?? null,
    socialMedia: result.socialMedia
      ? {
          linkedin: result.socialMedia.linkedin ?? null,
          twitter: result.socialMedia.twitter ?? null,
        }
      : null,
    leadership: result.leadership ?? null,
    productsAndServices: result.productsAndServices ?? null,
    competitiveLandscape: result.competitiveLandscape ?? null,
  };
};

/**
 * Research a company using AI
 * POST /api/companies/research
 */
export const researchCompany = async (
  input: CompanyResearchInput
): Promise<{ success: boolean; data: CompanyData }> => {
  const response = await apiClient.fetch<CompanyResearchResponse>("/companies/research", {
    method: "POST",
    body: JSON.stringify(input),
  });
  
  return {
    success: response.success,
    data: transformCompanyData(response.data),
  };
};

/**
 * Research a company and save to database
 * POST /api/companies/research-and-save
 * 
 * Note: Backend returns { data: { company, research, isNew } }
 * We extract the 'research' field which contains the AI research results
 * and include the company ID from the 'company' field
 */
export const researchAndSaveCompany = async (
  input: CompanyResearchInput
): Promise<{ success: boolean; data: CompanyData & { id?: string }; isNew: boolean }> => {
  const response = await apiClient.fetch<{
    success: boolean;
    data: {
      company: { id: string }; // Database record with ID
      research: CompanyResearchResult; // AI research results (what we display)
      isNew: boolean;
    };
  }>("/companies/research-and-save", {
    method: "POST",
    body: JSON.stringify(input),
  });
  
  const transformedData = transformCompanyData(response.data.research);
  
  return {
    success: response.success,
    data: {
      ...transformedData,
      id: response.data.company.id, // Include company ID for follow functionality
    },
    isNew: response.data.isNew,
  };
};

/**
 * Get company by ID (if already in database)
 * GET /api/companies/:companyId
 */
export const getCompanyById = async (
  companyId: string
): Promise<{ success: boolean; data: CompanyData }> => {
  return apiClient.fetch<{ success: boolean; data: CompanyData }>(
    `/companies/${companyId}`,
    {
      method: "GET",
    }
  );
};

// ============================================
// COMPANY NEWS API
// ============================================

export interface CompanyNewsInput {
  companyName: string;
  jobId?: string;
  focusAreas?: string[];
}

// Backend response structure
interface BackendNewsItem {
  headline: string;
  summary: string;
  date: string;
  category:
    | "product_launch"
    | "funding"
    | "acquisition"
    | "partnership"
    | "leadership_change"
    | "expansion"
    | "financial_results"
    | "controversy"
    | "award"
    | "other";
  sentiment: "positive" | "neutral" | "negative";
  relevanceScore?: number;
  source?: string;
  url?: string | null; // URL may be null/undefined when from knowledge base
}

interface CompanyNewsResponse {
  success: boolean;
  data: {
    companyName: string;
    newsItems: BackendNewsItem[];
    marketPosition?: {
      recentTrends?: string;
      hiringOutlook?: "expanding" | "stable" | "contracting" | "uncertain";
      keyDevelopments?: string[];
    };
    interviewTips?: {
      talkingPoints?: string[];
      questionsToAsk?: string[];
    };
    lastUpdated: string;
  };
}

// Map backend category to frontend category
const mapCategory = (
  backendCategory: BackendNewsItem["category"]
): CompanyNewsArticle["category"] => {
  const categoryMap: Record<string, CompanyNewsArticle["category"]> = {
    product_launch: "product_launch",
    funding: "funding",
    acquisition: "acquisition",
    partnership: "partnership",
    leadership_change: "leadership_change",
    award: "award",
    expansion: "general", // Frontend doesn't have expansion, map to general
    financial_results: "general", // Frontend doesn't have financial_results, map to general
    controversy: "general", // Frontend doesn't have controversy, map to general
    other: "general", // Map other to general
  };
  return categoryMap[backendCategory] || "general";
};

// Transform backend news item to frontend format
const transformNewsItem = (
  item: BackendNewsItem,
  index: number
): CompanyNewsArticle => {
  // Extract key points from summary (simple approach - split by sentences)
  const keyPoints = item.summary
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 20)
    .slice(0, 5)
    .map((s) => s.trim());

  // Handle URL - use provided URL, or generate Google search URL
  // Note: Backend should now provide Google search URLs when real URLs aren't available
  let url: string;
  if (item.url && !item.url.includes('example.com') && !item.url.includes('placeholder')) {
    // Use provided URL (could be real URL or Google search URL from backend)
    url = item.url;
  } else {
    // Fallback: Generate Google search URL based on headline
    const searchQuery = encodeURIComponent(item.headline);
    url = `https://www.google.com/search?q=${searchQuery}`;
  }

  return {
    title: item.headline,
    source: item.source || "Industry News",
    url,
    publishDate: item.date,
    category: mapCategory(item.category),
    summary: item.summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : [item.summary],
    relevanceScore: item.relevanceScore || 50,
    thumbnailUrl: null,
  };
};

/**
 * Get recent company news and updates
 * POST /api/companies/news
 */
export const getCompanyNews = async (
  input: CompanyNewsInput
): Promise<{ success: boolean; data: CompanyNewsArticle[] }> => {
  const response = await apiClient.fetch<CompanyNewsResponse>(
    "/companies/news",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return {
    success: response.success,
    data: response.data.newsItems.map(transformNewsItem),
  };
};

/**
 * Refresh company news (force new AI call)
 * Can use either companyId or companyName
 */
export const refreshCompanyNews = async (
  companyIdOrName: string,
  focusAreas?: string[],
  useName?: boolean
): Promise<{ success: boolean; data: CompanyNewsArticle[] }> => {
  const endpoint = useName
    ? `/companies/news/refresh`
    : `/companies/${companyIdOrName}/news/refresh`;
  
  const body = useName
    ? { companyName: companyIdOrName, focusAreas: focusAreas || [] }
    : { focusAreas: focusAreas || [] };

  const response = await apiClient.fetch<CompanyNewsResponse>(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return {
    success: response.success,
    data: response.data.newsItems.map(transformNewsItem),
  };
};

/**
 * Export company news (CSV or PDF)
 * Can use either companyId or companyName
 */
export const exportCompanyNews = async (
  companyIdOrName: string,
  format: "csv" | "pdf" = "csv",
  options?: {
    category?: string;
    search?: string;
    useName?: boolean;
  }
): Promise<void> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const params = new URLSearchParams({
    format,
    ...(options?.category && options.category !== "all" ? { category: options.category } : {}),
    ...(options?.search ? { search: options.search } : {}),
    ...(options?.useName ? { companyName: companyIdOrName } : {}),
  });

  const endpoint = options?.useName
    ? `${API_BASE_URL}/companies/news/export?${params}`
    : `${API_BASE_URL}/companies/${companyIdOrName}/news/export?${params}`;

  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to export company news");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `company_news_${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "csv"}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ============================================
// JOB MATCHING API (UC-065)
// ============================================

export interface JobMatchWeights {
  skills: number;
  experience: number;
  education: number;
  requirements: number;
  customCriteria?: Record<string, number>;
}

export interface AnalyzeJobMatchInput {
  jobId: string;
  forceRefresh?: boolean;
  weights?: Partial<JobMatchWeights>;
}

export interface AnalyzeJobMatchResponse {
  success: boolean;
  data: JobMatchScoreData;
  cached?: boolean;
  analysisDate?: string | null;
  weightsUsed?: JobMatchWeights;
}

export interface JobMatchPreferencesResponse {
  success: boolean;
  data: {
    weights: JobMatchWeights;
    defaultWeights: JobMatchWeights;
    isCustom: boolean;
  };
}

export interface JobMatchHistoryResponse {
  success: boolean;
  data: {
    job: {
      id: string;
      title: string;
      company: string;
    };
    entries: Array<{
      id: string;
      analysisDate: string | null;
      overallMatchScore: number;
      categoryScores: Record<string, number>;
      strengths: any;
      gaps: any;
      weightsUsed?: JobMatchWeights;
    }>;
  };
}

export interface JobMatchComparisonEntry {
  jobId: string;
  title: string;
  company: string;
  status: string | null;
  latestScore: number;
  analysisDate: string | null;
  weightsUsed?: JobMatchWeights;
}

export interface JobMatchComparisonResponse {
  success: boolean;
  data: JobMatchComparisonEntry[];
}

/**
 * Analyze job match between user profile and a job opportunity
 * POST /api/ai/job-matching/analyze
 * 
 * This endpoint implements caching:
 * - Returns cached result if analysis exists and is fresh (< 24 hours)
 * - Otherwise calls AI service and saves result to database
 */
export const analyzeJobMatch = async (
  input: AnalyzeJobMatchInput
): Promise<AnalyzeJobMatchResponse> => {
  const response = await apiClient.fetch<AnalyzeJobMatchResponse>(
    "/ai/job-matching/analyze",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return response;
};

export const getJobMatchPreferences = async (): Promise<JobMatchPreferencesResponse> => {
  return apiClient.fetch<JobMatchPreferencesResponse>(
    "/ai/job-matching/preferences",
    {
      method: "GET",
    }
  );
};

export const updateJobMatchPreferences = async (
  weights: Partial<JobMatchWeights>
): Promise<JobMatchPreferencesResponse> => {
  return apiClient.fetch<JobMatchPreferencesResponse>(
    "/ai/job-matching/preferences",
    {
      method: "PUT",
      body: JSON.stringify(weights),
    }
  );
};

export const getJobMatchHistory = async (
  jobId: string,
  limit = 20
): Promise<JobMatchHistoryResponse> => {
  return apiClient.fetch<JobMatchHistoryResponse>(
    `/ai/job-matching/history/${jobId}?limit=${limit}`,
    {
      method: "GET",
    }
  );
};

export const getJobMatchComparison = async (
  params: {
    status?: string;
    minScore?: number;
    limit?: number;
  } = {}
): Promise<JobMatchComparisonResponse> => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (typeof params.minScore === "number")
    searchParams.set("minScore", String(params.minScore));
  if (typeof params.limit === "number")
    searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();

  return apiClient.fetch<JobMatchComparisonResponse>(
    `/ai/job-matching/comparison${query ? `?${query}` : ""}`,
    {
      method: "GET",
    }
  );
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const exportJobMatchAnalysis = async (jobIds: string[]): Promise<Blob> => {
  const params = new URLSearchParams();
  params.set("jobIds", jobIds.join(","));

  const response = await fetch(
    `${API_BASE_URL}/ai/job-matching/export?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error?.message || "Failed to export job match analysis");
    } catch {
      throw new Error("Failed to export job match analysis");
    }
  }

  return response.blob();
};

// Skills Gap Analysis Types and API
export interface AnalyzeSkillsGapInput {
  jobId: string;
  forceRefresh?: boolean;
}

export interface AnalyzeSkillsGapResponse {
  success: boolean;
  data: SkillsGapData;
  cached?: boolean; // Indicates if result was from cache
}

/**
 * Analyze skills gap between user skills and job requirements
 * POST /api/ai/skills-gap/analyze
 * 
 * This endpoint implements caching:
 * - Returns cached result if analysis exists and is fresh (< 24 hours)
 * - Otherwise calls AI service and saves result to database
 */
export const analyzeSkillsGap = async (
  input: AnalyzeSkillsGapInput
): Promise<AnalyzeSkillsGapResponse> => {
  const response = await apiClient.fetch<AnalyzeSkillsGapResponse>(
    "/ai/skills-gap/analyze",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return response;
};

/**
 * Get skills gap progress tracking for a specific job
 * GET /api/ai/skills-gap/progress/:jobId
 * 
 * Returns historical snapshots showing how gap scores and skills have changed over time
 */
export interface SkillsGapProgressData {
  jobId: string;
  jobTitle: string;
  companyName: string;
  currentAnalysis: {
    overallGapScore: number;
    analysisDate: string | null;
    matchedSkillsCount: number;
    missingSkillsCount: number;
    weakSkillsCount: number;
  } | null;
  history: Array<{
    id: string;
    overallGapScore: number;
    snapshotDate: string;
    matchedSkillsCount: number;
    missingSkillsCount: number;
    weakSkillsCount: number;
  }>;
  progressMetrics: {
    firstScore: number;
    latestScore: number;
    scoreImprovement: number;
    totalSnapshots: number;
    timeSpanDays: number;
  } | null;
}

export interface SkillsGapProgressResponse {
  success: boolean;
  data: SkillsGapProgressData;
}

export const getSkillsGapProgress = async (
  jobId: string
): Promise<SkillsGapProgressResponse> => {
  const response = await apiClient.fetch<SkillsGapProgressResponse>(
    `/ai/skills-gap/progress/${jobId}`,
    {
      method: "GET",
    }
  );

  return response;
};

/**
 * Get skills gap trends across all jobs for a user
 * GET /api/ai/skills-gap/trends
 * 
 * Returns comparison of gap analyses across multiple job opportunities
 */
export interface SkillsGapTrendsData {
  totalJobs: number;
  averageGapScore: number;
  jobs: Array<{
    jobId: string;
    jobTitle: string;
    companyName: string;
    industry: string;
    overallGapScore: number;
    analysisDate: string | null;
    matchedSkillsCount: number;
    missingSkillsCount: number;
    weakSkillsCount: number;
  }>;
  commonMissingSkills: Array<{
    skillName: string;
    frequency: number;
    percentage: number;
    importance: string[];
  }>;
  commonWeakSkills: Array<{
    skillName: string;
    frequency: number;
    percentage: number;
    priority: string[];
  }>;
  skillFrequency: Record<string, number>;
}

export interface SkillsGapTrendsResponse {
  success: boolean;
  data: SkillsGapTrendsData;
}

export const getSkillsGapTrends = async (): Promise<SkillsGapTrendsResponse> => {
  const response = await apiClient.fetch<SkillsGapTrendsResponse>(
    "/ai/skills-gap/trends",
    {
      method: "GET",
    }
  );

  return response;
};

// ============================================
// INTERVIEW INSIGHTS API (UC-068)
// ============================================

export interface AnalyzeInterviewInsightsInput {
  jobId: string;
  forceRefresh?: boolean;
}

export interface AnalyzeInterviewInsightsResponse {
  success: boolean;
  data: InterviewInsightsData;
  cached?: boolean; // Indicates if result was from cache
}

/**
 * Get interview insights and preparation recommendations for a job
 * POST /api/ai/interview-insights/analyze
 * 
 * This endpoint implements caching:
 * - Returns cached result if insights exist and are fresh (< 7 days)
 * - Otherwise calls AI service and saves result to database
 */
export const analyzeInterviewInsights = async (
  input: AnalyzeInterviewInsightsInput
): Promise<AnalyzeInterviewInsightsResponse> => {
  const response = await apiClient.fetch<AnalyzeInterviewInsightsResponse>(
    "/ai/interview-insights/analyze",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return response;
};

// ============================================
// COMPANY FOLLOW & NEWS ALERTS API (UC-064)
// ============================================

export interface FollowStatusResponse {
  success: boolean;
  data: {
    isFollowing: boolean;
    followDate: string | null;
  };
}

export interface NewsAlertsResponse {
  success: boolean;
  data: {
    totalAlerts: number;
    companies: Array<{
      companyId: string;
      companyName: string;
      newNewsCount: number;
      recentNewsCount: number;
      latestNews: Array<{
        headline: string;
        publishDate: string;
        category: string;
        url: string | null;
      }>;
      followedSince: string | null;
    }>;
  };
}

/**
 * Check if user is following a company
 * GET /api/companies/:companyId/follow
 */
export const checkFollowStatus = async (
  companyId: string
): Promise<FollowStatusResponse> => {
  return apiClient.fetch<FollowStatusResponse>(
    `/companies/${companyId}/follow`,
    {
      method: "GET",
    }
  );
};

/**
 * Follow a company
 * POST /api/companies/:companyId/follow
 */
export const followCompany = async (
  companyId: string
): Promise<{ success: boolean; message: string }> => {
  return apiClient.fetch<{ success: boolean; message: string }>(
    `/companies/${companyId}/follow`,
    {
      method: "POST",
    }
  );
};

/**
 * Unfollow a company
 * DELETE /api/companies/:companyId/follow
 */
export const unfollowCompany = async (
  companyId: string
): Promise<{ success: boolean; message: string }> => {
  return apiClient.fetch<{ success: boolean; message: string }>(
    `/companies/${companyId}/follow`,
    {
      method: "DELETE",
    }
  );
};

/**
 * Get news alerts for all followed companies
 * GET /api/companies/news/alerts
 */
export const getNewsAlerts = async (): Promise<NewsAlertsResponse> => {
  return apiClient.fetch<NewsAlertsResponse>("/companies/news/alerts", {
    method: "GET",
  });
};

