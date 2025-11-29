const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface LinkedInMessageInput {
  contactName: string;
  contactCompany?: string;
  contactJobTitle?: string;
  relationshipStrength?: number;
  relationshipType?: string;
  messagePurpose: 'connection_request' | 'follow_up' | 'informational_interview' | 'referral_request' | 'thank_you' | 'check_in';
  context?: string;
  tone?: 'professional' | 'casual' | 'warm' | 'direct';
}

export interface LinkedInMessageOutput {
  subject?: string;
  message: string;
  tips: string[];
}

export interface LinkedInProfileOptimizationInput {
  targetRole?: string;
  targetIndustry?: string;
}

export interface LinkedInProfileOptimizationOutput {
  headlineSuggestions: string[];
  summarySuggestions: string[];
  profileCompleteness: {
    score: number;
    missingSections: string[];
    recommendations: string[];
  };
  keywordOptimization: {
    suggestedKeywords: string[];
    currentKeywords: string[];
    missingKeywords: string[];
  };
  bestPractices: string[];
}

export interface NetworkingStrategyInput {
  targetCompanies?: string[];
  targetRoles?: string[];
  networkingGoals: string[];
}

export interface NetworkingStrategyOutput {
  strategies: Array<{
    strategy: string;
    description: string;
    actionItems: string[];
    timeline: string;
  }>;
  connectionRequestTemplates: Array<{
    scenario: string;
    template: string;
    tips: string[];
  }>;
  targetConnections: Array<{
    type: string;
    description: string;
    approach: string;
  }>;
}

export interface ContentSharingStrategyInput {
  goals: string[];
  targetAudience: string;
}

export interface ContentSharingStrategyOutput {
  contentTypes: Array<{
    type: string;
    description: string;
    examples: string[];
    bestPractices: string[];
  }>;
  postingSchedule: {
    frequency: string;
    bestTimes: string[];
    recommendations: string[];
  };
  engagementStrategies: string[];
  visibilityTips: string[];
}

export interface NetworkingCampaignInput {
  campaignName: string;
  targetCompanies: string[];
  targetRoles: string[];
  targetIndustries?: string[];
  goals: string[];
  timeline: string;
}

export interface NetworkingCampaignOutput {
  campaign: {
    name: string;
    strategy: string;
    phases: Array<{
      phase: string;
      duration: string;
      activities: string[];
      goals: string[];
    }>;
  };
  outreachTemplates: Array<{
    scenario: string;
    template: string;
    subject?: string;
  }>;
  trackingMetrics: Array<{
    metric: string;
    description: string;
    target: string;
  }>;
  successCriteria: string[];
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

export const linkedinApi = {
  /**
   * Generate LinkedIn message template
   */
  async generateMessage(input: LinkedInMessageInput): Promise<LinkedInMessageOutput> {
    return fetchWithAuth(`${API_URL}/ai/linkedin/message`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /**
   * Get LinkedIn profile optimization suggestions
   */
  async getOptimization(input: LinkedInProfileOptimizationInput = {}): Promise<LinkedInProfileOptimizationOutput> {
    return fetchWithAuth(`${API_URL}/ai/linkedin/optimization`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /**
   * Generate networking strategy
   */
  async generateNetworkingStrategy(input: NetworkingStrategyInput): Promise<NetworkingStrategyOutput> {
    return fetchWithAuth(`${API_URL}/ai/linkedin/networking-strategy`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /**
   * Get content sharing strategy
   */
  async getContentStrategy(input: ContentSharingStrategyInput): Promise<ContentSharingStrategyOutput> {
    return fetchWithAuth(`${API_URL}/ai/linkedin/content-strategy`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /**
   * Generate networking campaign
   */
  async generateCampaign(input: NetworkingCampaignInput): Promise<NetworkingCampaignOutput> {
    return fetchWithAuth(`${API_URL}/ai/linkedin/networking-campaign`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};


