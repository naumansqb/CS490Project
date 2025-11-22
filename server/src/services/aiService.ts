// services/aiService.ts
import { GeminiProvider } from "./llm/providers/gemini";
import {
  ResumeInput,
  CoverLetterInput,
  TailoredResume,
  GeneratedCoverLetter,
} from "../types/ai.types";
import {
  buildResumeTailoringPrompt,
  resumeSystemPrompt,
} from "./llm/prompts/resume.prompts";
import {
  buildCoverLetterPrompt,
  coverLetterSystemPrompt,
} from "./llm/prompts/coverLetter.prompts";
import {
  buildResumeParsingPrompt,
  resumeParserSystemPrompt,
} from "./llm/prompts/resumeParser.prompts";
import { resumeSchema } from "./llm/schemas/resume.schema";
import { coverLetterSchema } from "./llm/schemas/coverLetter.schema";
import { resumeParserSchema } from "./llm/schemas/resumeParser.schema";
import { cleanHtmlForExtraction, generateJobExtractionPrompt, validateExtractedData } from "./llm/prompts/url.prompts";

import {
  CompanyResearchInput,
  CompanyResearchResult,
} from "../types/company.types";
import {
  CompanyNewsInput,
  CompanyNewsOutput,
  JobMatchingInput,
  JobMatchingOutput,
  SkillsGapInput,
  SkillsGapOutput,
  InterviewInsightsInput,
  InterviewInsightsOutput,
} from "../types/ai.types";
import {
  buildCompanyResearchPrompt,
  companyResearchSystemPrompt,
  buildCompanyNewsPrompt,
  companyNewsSystemPrompt,
} from "./llm/prompts/company.prompts";
import { companyResearchSchema } from "./llm/schemas/company.schema";
import { companyNewsSchema } from "./llm/schemas/companyNews.schema";
import {
  buildJobMatchingPrompt,
  jobMatchingSystemPrompt,
} from "./llm/prompts/jobMatching.prompts";
import { jobMatchingSchema } from "./llm/schemas/jobMatching.schema";
import {
  buildSkillsGapPrompt,
  skillsGapSystemPrompt,
} from "./llm/prompts/skillsGap.prompts";
import { skillsGapSchema } from "./llm/schemas/skillsGap.schema";
import {
  buildInterviewInsightsPrompt,
  interviewInsightsSystemPrompt,
} from "./llm/prompts/interviewInsights.prompts";
import { interviewInsightsSchema } from "./llm/schemas/interviewInsights.schema";
import { buildAnalysisPrompt } from "./llm/prompts/interviewPrep.prompts";

export class AIService {
  private llmProvider: GeminiProvider;

  constructor() {
    this.llmProvider = new GeminiProvider();
  }

  async generateTailoredResume(input: ResumeInput): Promise<TailoredResume> {
    try {
      const prompt = buildResumeTailoringPrompt(input);

      const response = await this.llmProvider.generate<TailoredResume>({
        prompt,
        systemPrompt: resumeSystemPrompt,
        jsonSchema: resumeSchema,
        temperature: 0.7,
        maxTokens: 3000,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Resume Generation Error]", error);
      throw new Error("Failed to generate tailored resume");
    }
  }

  async generateCoverLetter(
    input: CoverLetterInput
  ): Promise<GeneratedCoverLetter> {
    try {
      const prompt = buildCoverLetterPrompt(input);

      const response = await this.llmProvider.generate<GeneratedCoverLetter>({
        prompt,
        systemPrompt: coverLetterSystemPrompt,
        jsonSchema: coverLetterSchema,
        temperature: 0.8,
        maxTokens: 2000,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Cover Letter Generation Error]", error);
      throw new Error("Failed to generate cover letter");
    }
  }

  async parseResume(resumeText: string): Promise<any> {
    try {
      const prompt = buildResumeParsingPrompt(resumeText);

      const response = await this.llmProvider.generate<any>({
        prompt,
        systemPrompt: resumeParserSystemPrompt,
        jsonSchema: resumeParserSchema,
        temperature: 0.3,
        maxTokens: 2500,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Resume Parsing Error]", error);
      throw new Error("Failed to parse resume");
    }
  }

  /**
   * Research company information
   */
  async researchCompany(
    input: CompanyResearchInput
  ): Promise<CompanyResearchResult> {
    try {
      const prompt = `Research "${input.companyName}". Match ticket requirements exactly.

CRITICAL: companySize field MUST be 50 characters or less. Provide ONLY the size value (e.g., "10,000+", "Enterprise", "Mid-size", "500-1000"). Do NOT repeat words like "employees" - just provide the size number/description.

For all other fields, provide comprehensive but concise information:
- Text fields: 2-3 sentences (100-150 words) - provide useful detail
- Leadership array: 3-5 key executives with names and titles
- Products/services array: 5-8 main products or services
- Be informative and helpful for job applicants

Required fields per ticket:
1. Basic info: size (50 chars max!), industry, headquarters location
2. Mission/values: core mission and values (2-3 sentences)
3. Recent news: recent news items and achievements (include in description, 2-3 sentences)
4. Leadership: key executives with titles (3-5 entries)
5. Products/services: main offerings (5-8 items)
6. Competitive position: market position and differentiators (2-3 sentences)
7. Social media: LinkedIn/Twitter handles (in contactInfo)
8. Summary: comprehensive overview (in description field, 2-3 sentences)

Provide detailed, useful information while keeping companySize under 50 characters.`;

      const systemPrompt = `You are a company research assistant helping job applicants learn about companies. Provide accurate, helpful information that demonstrates genuine research and interest. Be honest about limitations in your knowledge and guide users on where to find more current information if needed.`;

      const schema = {
        type: "object",
        properties: {
          companyName: {
            type: "string",
            description: "Company name"
          },
          companySize: {
            type: "string",
            description: "Company size - CRITICAL: MAX 50 CHARACTERS. Provide only the size value (e.g., '10,000+', 'Enterprise', 'Mid-size', '500-1000'). Do NOT include redundant words like 'employees' - just the size number or category."
          },
          industry: {
            type: "string",
            description: "Industry sector - can be a few words (e.g., 'Cloud Computing', 'Technology', 'Financial Services')"
          },
          location: {
            type: "string",
            description: "Headquarters location (city, state/country) - can include full address if helpful"
          },
          website: {
            type: "string",
            description: "Company website URL"
          },
          description: {
            type: "string",
            description: "Company overview including recent news and summary - 2-3 sentences, 100-150 words, provide comprehensive information"
          },
          mission: {
            type: "string",
            description: "Mission statement and core values - 2-3 sentences, 100-150 words, provide detailed information"
          },
          leadership: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                title: { type: "string" }
              },
              required: ["name", "title"]
            },
            description: "Key executives and leadership team - 3-5 entries, include full names and titles"
          },
          productsAndServices: {
            type: "array",
            items: { type: "string" },
            description: "Main products or services - 5-8 items, can be descriptive (e.g., 'Cloud Infrastructure Services', 'Machine Learning Platforms')"
          },
          competitiveLandscape: {
            type: "string",
            description: "Market position and differentiators - 2-3 sentences, 100-150 words, provide detailed competitive analysis"
          },
          contactInfo: {
            type: "object",
            properties: {
              email: { type: "string", description: "Company email address" },
              phone: { type: "string", description: "Company phone number" },
              address: { type: "string", description: "Company address" }
          }
        },
          socialMedia: {
            type: "object",
            properties: {
              linkedin: { type: "string", description: "LinkedIn URL or handle (e.g., 'linkedin.com/company/amazon' or '@amazon')" },
              twitter: { type: "string", description: "Twitter/X handle (e.g., '@amazon' or 'twitter.com/amazon')" }
            }
          }
        },
        required: ["companyName", "description", "mission", "competitiveLandscape"]
      };

      const response = await this.llmProvider.generate<any>({
        prompt,
        systemPrompt,
        jsonSchema: schema,
        temperature: 0.7,
        maxTokens: 5000, // Increased to 5000 to ensure complete responses even for large companies
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Company Research Error]", error);
      throw new Error("Failed to research company");
    }
  }

  async analyzeExperienceRelevance(input: {
    experiences: any[];
    jobDescription: string;
    jobTitle: string;
  }): Promise<any> {
    try {
      const experiencesText = input.experiences
        .map(
          (exp, idx) =>
            `${idx + 1}. ${exp.positionTitle} at ${exp.companyName}
Duration: ${exp.startDate} - ${exp.endDate || "Present"}
Description: ${exp.description || "No description provided"}`
        )
        .join("\n\n");

      const prompt = `Analyze the following work experiences against this job posting and score their relevance.

JOB POSTING:
Title: ${input.jobTitle}
${input.jobDescription}

CANDIDATE'S EXPERIENCES:
${experiencesText}

For each experience, provide:
1. **Relevance Score** (0-100): How relevant is this experience to the job?
2. **Key Strengths**: What aspects make it relevant?
3. **Quantifiable Achievements**: Suggest metrics/numbers that could strengthen this experience
4. **Connection to Job**: How does it relate to specific job requirements?
5. **Presentation Suggestion**: How should this be framed in the cover letter?

Also provide:
- **Top 3 Experiences**: Which experiences should be highlighted most prominently?
- **Missing Experiences**: What types of experience would strengthen the application?
- **Alternative Angles**: Different ways to present these experiences

GUIDELINES:
- Be specific about what makes each experience relevant
- Look for transferable skills even if industry is different
- Consider impact, scope, and technical alignment
- Prioritize experiences with measurable outcomes`;

      const systemPrompt = `You are an expert career advisor specializing in analyzing candidate experiences against job requirements. Provide actionable insights that help candidates present their background most effectively.`;

      const schema = {
        type: "object",
        properties: {
          experiences: {
            type: "array",
            items: {
              type: "object",
              properties: {
                index: {
                  type: "number",
                  description: "Experience index (1-based)",
                },
                relevanceScore: {
                  type: "number",
                  description: "Score from 0-100",
                },
                keyStrengths: { type: "array", items: { type: "string" } },
                quantifiableAchievements: {
                  type: "array",
                  items: { type: "string" },
                },
                connectionToJob: { type: "string" },
                presentationSuggestion: { type: "string" },
              },
              required: [
                "index",
                "relevanceScore",
                "keyStrengths",
                "connectionToJob",
                "presentationSuggestion",
              ],
            },
          },
          top3Experiences: {
            type: "array",
            items: { type: "number" },
            description: "Indices of top 3 most relevant experiences",
          },
          missingExperiences: {
            type: "array",
            items: { type: "string" },
            description:
              "Types of experience that would strengthen application",
          },
          alternativeAngles: {
            type: "array",
            items: { type: "string" },
            description: "Different ways to frame the experiences",
          },
          overallRecommendation: {
            type: "string",
            description: "Overall strategy for highlighting experiences",
          },
        },
        required: ["experiences", "top3Experiences", "overallRecommendation"],
      };

      const response = await this.llmProvider.generate<any>({
        prompt,
        systemPrompt,
        jsonSchema: schema,
        temperature: 0.4,
        maxTokens: 2500,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Experience Analysis Error]", error);
      throw new Error("Failed to analyze experience relevance");
    }
  }

  /**
   * Get recent company news and updates
   */
  async getCompanyNews(input: CompanyNewsInput): Promise<CompanyNewsOutput> {
    try {
      const prompt = buildCompanyNewsPrompt(input);

      const response = await this.llmProvider.generate<CompanyNewsOutput>({
        prompt,
        systemPrompt: companyNewsSystemPrompt,
        jsonSchema: companyNewsSchema,
        temperature: 0.7,
        maxTokens: 4000,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Company News Error]", error);
      throw new Error("Failed to get company news");
    }
  }

  async getEditingSuggestions(input: { content: string; type: string }): Promise<any> {
    try {
      const prompt = `Analyze the following ${input.type} content and provide comprehensive editing suggestions to improve its quality, clarity, and professional impact.

CONTENT TO ANALYZE:
${input.content}

Please provide detailed suggestions in the following categories:

1. **Grammar & Style**: Identify any grammatical errors, awkward phrasing, or style inconsistencies
2. **Word Choice**: Suggest stronger or more professional word alternatives, identify repetitive words
3. **Structure**: Recommend improvements to sentence and paragraph structure, flow, and organization
4. **Overall Feedback**: Provide general assessment and key improvement areas

GUIDELINES:
- Be constructive and specific in your feedback
- Prioritize the most impactful improvements
- Consider professional business writing standards
- Suggest 3-5 items per category (only include categories with suggestions)
- For grammar, provide the original phrase and corrected version
- For word choice, provide the word and 2-3 better alternatives
- For structure, provide actionable recommendations`;

      const systemPrompt = `You are a professional writing editor specializing in business communication. Provide clear, actionable suggestions that help improve writing quality while maintaining the author's voice and intent. Focus on clarity, professionalism, and impact.`;

      const schema = {
        type: "object",
        properties: {
          grammar: {
            type: "array",
            description: "Grammar and style corrections",
            items: {
              type: "object",
              properties: {
                original: { type: "string", description: "Original text" },
                suggestion: { type: "string", description: "Corrected text" },
                reason: {
                  type: "string",
                  description: "Why this change improves the text",
                },
              },
              required: ["original", "suggestion", "reason"],
            },
          },
          wordChoice: {
            type: "array",
            description: "Word choice improvements",
            items: {
              type: "object",
              properties: {
                word: { type: "string", description: "Current word" },
                alternatives: {
                  type: "array",
                  items: { type: "string" },
                  description: "Better alternatives",
                },
              },
              required: ["word", "alternatives"],
            },
          },
          structure: {
            type: "array",
            description: "Structural improvements",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Area to improve" },
                suggestion: {
                  type: "string",
                  description: "How to improve it",
                },
              },
              required: ["title", "suggestion"],
            },
          },
          overall: {
            type: "string",
            description: "Overall assessment and key recommendations",
          },
        },
        required: ["overall"],
      };

      const response = await this.llmProvider.generate<any>({
        prompt,
        systemPrompt,
        jsonSchema: schema,
        temperature: 0.5,
        maxTokens: 1500,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Editing Suggestions Error]", error);
      throw new Error("Failed to get editing suggestions");
    }
  }

  /**
   * Analyze job match between a candidate profile and a job opportunity
   */
  async analyzeJobMatch(input: JobMatchingInput): Promise<JobMatchingOutput> {
    try {
      const prompt = buildJobMatchingPrompt(input);

      const response = await this.llmProvider.generate<JobMatchingOutput>({
        prompt,
        systemPrompt: jobMatchingSystemPrompt,
        jsonSchema: jobMatchingSchema,
        temperature: 0.5, // Moderate temperature for balanced analysis
        maxTokens: 4000,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Job Matching Error]", error);
      throw new Error("Failed to analyze job match");
    }
  }

  /**
   * Analyze skills gap between user skills and job requirements
   */
  async analyzeSkillsGap(input: SkillsGapInput): Promise<SkillsGapOutput> {
    try {
      const prompt = buildSkillsGapPrompt(input);

      const response = await this.llmProvider.generate<SkillsGapOutput>({
        prompt,
        systemPrompt: skillsGapSystemPrompt,
        jsonSchema: skillsGapSchema,
        temperature: 0.5, // Moderate temperature for balanced analysis
        maxTokens: 8000, // Increased from 4000 to handle large learning resources arrays
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Skills Gap Analysis Error]", error);
      throw new Error("Failed to analyze skills gap");
    }
  }

  /**
   * Get interview insights and preparation recommendations for a company and role
   */
  async getInterviewInsights(input: InterviewInsightsInput): Promise<InterviewInsightsOutput> {
    try {
      const prompt = buildInterviewInsightsPrompt(input);

      const response = await this.llmProvider.generate<InterviewInsightsOutput>({
        prompt,
        systemPrompt: interviewInsightsSystemPrompt,
        jsonSchema: interviewInsightsSchema,
        temperature: 0.5, // Moderate temperature for balanced analysis
        maxTokens: 8000, // Increased from 4000 to handle comprehensive interview insights
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Interview Insights Error]", error);
      throw new Error("Failed to get interview insights");
    }
  }

  /**
   * Extract job information from a job posting URL
   * @param url - URL of the job posting
   * @returns Extracted job data
   */
  async extractJobFromUrl(url: string): Promise<any> {
    try {
      // Validate URL format first
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        throw new Error(`Invalid URL format: ${url}`);
      }

      // Fetch the HTML content from the URL with comprehensive headers
      // Many job sites require proper headers to avoid 400/403 errors
      // Note: Some sites (like LinkedIn) have strict anti-scraping and may still block requests
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          'Referer': parsedUrl.origin, // Set referer to the same origin
        },
        redirect: 'follow', // Follow redirects
      });

      if (!response.ok) {
        // Provide more detailed error information
        const errorText = response.status === 400 
          ? `Bad Request - The server rejected the request. This might be due to: 1) Invalid URL, 2) Missing required parameters, 3) Anti-scraping protection. URL: ${url}`
          : `Failed to fetch URL: ${response.status} ${response.statusText}. URL: ${url}`;
        throw new Error(errorText);
      }

      const html = await response.text();
      
      // Clean the HTML to reduce token usage
      const cleanedHtml = cleanHtmlForExtraction(html);
      
      // Generate prompt for extraction
      const prompt = generateJobExtractionPrompt(cleanedHtml);
      
      // Use LLM to extract job data (without strict schema, as the prompt handles structure)
      const llmResponse = await this.llmProvider.generate({
        prompt,
        systemPrompt: "You are a job posting data extraction assistant. Extract structured job information from HTML content and return valid JSON only.",
        temperature: 0.3,
        maxTokens: 2000,
      });

      // Parse the response
      let extractedData;
      try {
        // Try to parse as JSON
        extractedData = typeof llmResponse.content === 'string' 
          ? JSON.parse(llmResponse.content) 
          : llmResponse.content;
      } catch (parseError) {
        // If parsing fails, try to extract JSON from the response
        const content = typeof llmResponse.content === 'string' 
          ? llmResponse.content 
          : JSON.stringify(llmResponse.content);
        
        // Remove markdown code blocks if present
        let cleaned = content.trim();
        cleaned = cleaned.replace(/```json\n?/g, '');
        cleaned = cleaned.replace(/```\n?/g, '');
        cleaned = cleaned.trim();
        
        // Try to find JSON object in the response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in LLM response');
        }
      }

      // Validate and sanitize the extracted data
      const validatedData = validateExtractedData(extractedData);
      
      return validatedData;
    } catch (error) {
      console.error("[AI Service - Extract Job From URL Error]", error);
      throw new Error(`Failed to extract job from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
 * Analyze a candidate's response to an interview question
 */
async analyzeInterviewResponse(input: {
  question: string;
  questionCategory: string;
  response: string;
  jobTitle?: string;
  companyName?: string;
}): Promise<any> {
  try {
    const { question, questionCategory, response, jobTitle, companyName } = input;

    const prompt = buildAnalysisPrompt(
      question,
      questionCategory,
      response,
      jobTitle,
      companyName
    );

    // 1. Define the schema to match your Interface
    // This triggers the Provider to use JSON mode + Parsing + Repair logic
    const analysisSchema = {
      type: "object",
      properties: {
        score: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
        starFrameworkUsed: { type: "boolean" },
        detailedFeedback: { type: "string" },
        alternativeApproaches: { type: "array", items: { type: "string" } }
      },
      required: ["score", "strengths", "improvements", "detailedFeedback"]
    };

    const aiResponse = await this.llmProvider.generate({
      prompt,
      systemPrompt: "You are an expert interview coach who provides structured JSON feedback.",
      temperature: 0.3,
      maxTokens: 4000,
      jsonSchema: analysisSchema // <--- ADDING THIS FIXES EVERYTHING
    });

    // Now aiResponse.content is guaranteed to be an Object, not a String
    return aiResponse.content;
    
  } catch (error) {
    console.error("[AI Service - Interview Response Analysis Error]", error);
    throw new Error("Failed to analyze interview response");
  }
}

}

export const aiService = new AIService();
