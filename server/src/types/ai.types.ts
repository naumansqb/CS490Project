// types/ai.types.ts
export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  jsonSchema?: object;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse<T = any> {
  content: T;
  rawResponse?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  generate<T>(request: LLMRequest): Promise<LLMResponse<T>>;
}

export interface ResumeInput {
  userProfile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    headline?: string;
    bio?: string;
  };
  workExperiences: Array<{
    companyName: string;
    positionTitle: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    institutionName: string;
    degreeType: string;
    major: string;
    graduationDate?: string;
  }>;
  skills: Array<{
    skillName: string;
    proficiencyLevel?: string;
  }>;
  jobDescription: string;
}

export interface CoverLetterInput {
  userProfile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  targetJob: {
    title: string;
    company: string;
    description: string;
    industry?: string;
    companyBackground?: string;
    recentNews?: string;
    companyMission?: string;
    companyInitiatives?: string;
    companySize?: string;
    fundingInfo?: string;
    competitiveLandscape?: string;
  };
  relevantExperience: string[];
  relevantSkills: string[];
  tone?: "formal" | "casual" | "enthusiastic" | "analytical";
  culture?: "startup" | "corporate";
  length?: "brief" | "standard" | "detailed";
  writingStyle?: "direct" | "narrative" | "bullet-points";
  customInstructions?: string;
  personalityLevel?: "minimal" | "moderate" | "strong";
}

export interface TailoredResume {
  summary: string;
  workExperiences: Array<{
    companyName: string;
    positionTitle: string;
    startDate: string;
    endDate?: string;
    bulletPoints: string[];
  }>;
  skills: {
    technical: string[];
    soft: string[];
    relevant: string[];
  };
  education: Array<{
    institutionName: string;
    degreeType: string;
    major: string;
    graduationDate?: string;
  }>;
}

export interface GeneratedCoverLetter {
  greeting: string;
  opening: string;
  body: string[];
  closing: string;
  signature: string;
}

export interface CompanyResearchInput {
  companyName: string;
  companyWebsite?: string;
  jobPostingUrl?: string;
  rawHtml?: string;
  additionalContext?: string;
}

export interface CompanyResearchOutput {
  companyName: string;
  companySize?: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
  description?: string | null;
  mission?: string | null;
  logoUrl?: string | null;
  contactInfo?: {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  glassdoorRating?: number | null;
  socialMedia?: {
    linkedin?: string | null;
    twitter?: string | null;
  } | null;
  leadership?: Array<{
    name: string;
    title: string;
  }> | null;
  productsAndServices?: string[] | null;
  competitiveLandscape?: string | null;
}

export interface CompanyNewsInput {
  companyName: string;
  companyWebsite?: string;
  maxArticles?: number;
  dateRange?: {
    startDate: string; // ISO date format
    endDate: string;   // ISO date format
  };
  additionalContext?: string;
}

export interface CompanyNewsArticle {
  title: string;
  source: string;
  url: string;
  publishDate: string; // ISO date format
  category: 'funding' | 'product_launch' | 'hiring' | 'acquisition' | 'partnership' | 'award' | 'leadership_change' | 'general';
  summary: string;
  keyPoints: string[];
  relevanceScore: number; // 0-100
  thumbnailUrl?: string | null;
}

export interface CompanyNewsOutput {
  articles: CompanyNewsArticle[];
  researchDate: string; // ISO date format
  totalFound: number;
}

// ============================================
// Job Matching Analysis Types (UC-065)
// ============================================

export interface JobMatchingInput {
  jobDescription: string;
  userSkills: Array<{
    skillName: string;
    proficiencyLevel?: string; // "beginner" | "intermediate" | "advanced" | "expert"
    yearsOfExperience?: number;
  }>;
  userExperience: Array<{
    companyName: string;
    positionTitle: string;
    startDate: string; // ISO date string
    endDate?: string; // ISO date string
    description: string;
  }>;
  userEducation: Array<{
    degreeType: string; // e.g., "Bachelor's", "Master's"
    major: string;
    institutionName?: string;
    graduationDate?: string; // ISO date string
  }>;
  companyName?: string;
  jobTitle?: string;
  weights?: JobMatchWeights;
}

export interface JobMatchWeights {
  skills: number;
  experience: number;
  education: number;
  requirements: number;
  customCriteria?: Record<string, number>;
}

export interface JobMatchPreferences {
  skills: number;
  experience: number;
  education: number;
  requirements: number;
  customCriteria?: Record<string, number>;
}

export interface JobMatchingOutput {
  overallMatchScore: number; // 0-100
  categoryScores: {
    skills: number; // 0-100
    experience: number; // 0-100
    education: number; // 0-100
    requirements: number; // 0-100
  };
  strengths: Array<{
    category: string; // "Skills" | "Experience" | "Education" | "Requirements"
    description: string;
    evidence: string[];
  }>;
  gaps: Array<{
    category: string; // "Skills" | "Experience" | "Education" | "Requirements"
    description: string;
    impact: "high" | "medium" | "low";
    suggestions: string[];
  }>;
  improvementSuggestions: Array<{
    type: "skill" | "experience" | "education";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  matchedSkills: Array<{
    skillName: string;
    relevance: number; // 0-100
  }>;
  missingSkills: Array<{
    skillName: string;
    importance: number; // 0-100
  }>;
}

// ============================================
// Skills Gap Analysis Types (UC-066)
// ============================================

export interface SkillsGapInput {
  jobDescription: string;
  userSkills: Array<{
    skillName: string;
    proficiencyLevel?: string; // "beginner" | "intermediate" | "advanced" | "expert"
    yearsOfExperience?: number;
  }>;
  jobTitle?: string;
  companyName?: string;
}

export interface SkillsGapOutput {
  matchedSkills: Array<{
    skillName: string;
    userProficiency: "beginner" | "intermediate" | "advanced" | "expert";
    jobRequirement: "required" | "preferred" | "nice-to-have";
    matchStrength: "strong" | "moderate" | "weak";
  }>;
  missingSkills: Array<{
    skillName: string;
    importance: "critical" | "important" | "nice-to-have";
    impact: number; // 0-100
    estimatedLearningTime: string; // e.g., "2-4 weeks"
  }>;
  weakSkills: Array<{
    skillName: string;
    currentProficiency: string;
    recommendedProficiency: string;
    improvementPriority: "high" | "medium" | "low";
  }>;
  learningResources: Array<{
    skillName: string;
    resources: Array<{
      title: string;
      type: "course" | "tutorial" | "certification" | "book" | "article";
      provider: string; // e.g., "Coursera", "Udemy"
      url?: string;
      estimatedTime: string; // e.g., "10 hours"
      difficulty: "beginner" | "intermediate" | "advanced";
      cost: "free" | "paid" | "freemium";
    }>;
  }>;
  prioritizedLearningPath: Array<{
    skillName: string;
    priority: number; // 1 = highest priority
    reason: string;
    estimatedTime: string; // e.g., "2-3 months"
  }>;
  overallGapScore: number; // 0-100 (lower = more gaps)
}

// ============================================
// Interview Insights Types (UC-068)
// ============================================

export interface InterviewInsightsInput {
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  industry?: string;
  companyWebsite?: string;
}

export interface InterviewInsightsOutput {
  companyName: string;
  jobTitle: string;
  interviewProcess: {
    stages: Array<{
      stageName: string; // e.g., "Phone Screen", "Technical Interview"
      stageNumber: number;
      description: string;
      typicalDuration: string; // e.g., "30-45 minutes"
      format: "phone" | "video" | "onsite" | "hybrid";
      focus: string; // e.g., "Technical skills", "Cultural fit"
    }>;
    totalRounds: number;
    estimatedTimeline: string; // e.g., "2-4 weeks"
    typicalTimeBetweenRounds: string; // e.g., "3-5 business days"
  };
  commonQuestions: Array<{
    question: string;
    category: "technical" | "behavioral" | "cultural" | "situational";
    difficulty: "easy" | "medium" | "hard";
    tips: string;
    frequency: "very-common" | "common" | "occasional";
  }>;
  interviewerInformation: Array<{
    role: string; // e.g., "HR Recruiter", "Hiring Manager"
    focus: string;
    typicalBackground?: string;
    questionsToExpect: string[];
  }>;
  companySpecificInsights: {
    interviewCulture: string;
    valuedTraits: string[];
    interviewFormats: string[];
    redFlags: string[];
    successTips: string[];
  };
  preparationRecommendations: {
    studyTopics: Array<{
      topic: string;
      importance: "critical" | "important" | "nice-to-have";
      resources?: string[];
    }>;
    keyAreasToReview: string[];
    preparationChecklist: Array<{
      item: string;
      category: "research" | "practice" | "preparation" | "logistics";
    }>;
    estimatedPreparationTime: string; // e.g., "10-15 hours"
  };
  researchDate: string; // ISO date format (YYYY-MM-DD)
  confidence: "high" | "medium" | "low";
}
