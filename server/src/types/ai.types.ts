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
