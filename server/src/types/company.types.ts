// types/company.types.ts
export interface CompanyResearchInput {
  companyName: string;
  jobId?: string;
  jobTitle?: string;
  additionalContext?: string;
}

export interface CompanyNewsInput {
  companyName: string;
  jobId?: string;
  focusAreas?: string[]; // e.g., ["hiring", "products", "culture"]
}

export interface CompanyContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

export interface CompanySocialMedia {
  linkedin?: string;
  twitter?: string;
}

export interface CompanyLeadership {
  name: string;
  title: string;
}

export interface CompanyResearchResult {
  companyName: string;
  companySize?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  mission?: string;
  logoUrl?: string;
  contactInfo?: CompanyContactInfo;
  glassdoorRating?: number;
  socialMedia?: CompanySocialMedia;
  leadership?: CompanyLeadership[];
  productsAndServices?: string[];
  competitiveLandscape?: string;
}

export interface NewsItem {
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
}

export interface MarketPosition {
  recentTrends?: string;
  hiringOutlook?: "expanding" | "stable" | "contracting" | "uncertain";
  keyDevelopments?: string[];
}

export interface InterviewTips {
  talkingPoints?: string[];
  questionsToAsk?: string[];
}

export interface CompanyNewsResult {
  companyName: string;
  newsItems: NewsItem[];
  marketPosition?: MarketPosition;
  interviewTips?: InterviewTips;
  lastUpdated: string;
}