export interface LinkedInMessageInput {
  userProfile: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    bio?: string;
    industry?: string;
    linkedinUrl?: string;
  };
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
  userProfile: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    bio?: string;
    industry?: string;
    workExperiences?: Array<{
      companyName: string;
      positionTitle: string;
      description?: string;
    }>;
    skills?: Array<{
      skillName: string;
    }>;
    education?: Array<{
      institutionName: string;
      degreeType: string;
      major?: string;
    }>;
  };
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
  userProfile: {
    industry?: string;
    headline?: string;
    skills?: Array<{ skillName: string }>;
  };
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
  userProfile: {
    industry?: string;
    headline?: string;
    skills?: Array<{ skillName: string }>;
  };
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
  userProfile: {
    industry?: string;
    headline?: string;
    skills?: Array<{ skillName: string }>;
  };
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


