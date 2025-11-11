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

  async researchCompany(input: { companyName: string; industry?: string }): Promise<any> {
    try {
      const industryContext = input.industry ? `in the ${input.industry} industry` : "";

      const prompt = `Research the company "${input.companyName}" ${industryContext} and provide comprehensive information for a job applicant writing a cover letter.

Based on your knowledge, provide:

1. **Company Background**: Brief history, what they do, size/scale
2. **Recent News/Achievements**: Recent milestones, product launches, awards, or significant events
3. **Company Mission/Values**: Their stated mission, core values, and what they stand for
4. **Key Initiatives/Projects**: Major ongoing projects, strategic initiatives, or focus areas
5. **Company Size**: Approximate employee count and company stage (startup, mid-size, enterprise)
6. **Funding/Growth**: Recent funding rounds, expansion, or growth trajectory
7. **Competitive Position**: Market position, key differentiators, and competitive advantages

IMPORTANT GUIDELINES:
- Provide factual, realistic information based on what you know
- If you're uncertain about recent information, use phrases like "typically known for" or "historically has focused on"
- Focus on information that would be useful for someone writing a cover letter
- Keep responses concise but informative (2-3 sentences per section)
- If you don't have specific information, provide general guidance on what to research

Format your response to be directly usable in a cover letter context.`;

      const systemPrompt = `You are a company research assistant helping job applicants learn about companies. Provide accurate, helpful information that demonstrates genuine research and interest. Be honest about limitations in your knowledge and guide users on where to find more current information if needed.`;

      const schema = {
        type: "object",
        properties: {
          companyBackground: {
            type: "string",
            description: "Company history and overview"
          },
          recentNews: {
            type: "string",
            description: "Recent company achievements and news"
          },
          companyMission: {
            type: "string",
            description: "Mission statement and core values"
          },
          companyInitiatives: {
            type: "string",
            description: "Key projects and strategic initiatives"
          },
          companySize: {
            type: "string",
            description: "Company size and stage"
          },
          fundingInfo: {
            type: "string",
            description: "Funding and growth information"
          },
          competitiveLandscape: {
            type: "string",
            description: "Market position and differentiators"
          },
          researchNote: {
            type: "string",
            description: "Note about information accuracy and where to verify"
          }
        },
        required: ["companyBackground", "recentNews", "companyMission", "companyInitiatives", "companySize", "fundingInfo", "competitiveLandscape", "researchNote"]
      };

      const response = await this.llmProvider.generate<any>({
        prompt,
        systemPrompt,
        jsonSchema: schema,
        temperature: 0.7,
        maxTokens: 1500,
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
      const experiencesText = input.experiences.map((exp, idx) =>
        `${idx + 1}. ${exp.positionTitle} at ${exp.companyName}
Duration: ${exp.startDate} - ${exp.endDate || 'Present'}
Description: ${exp.description || 'No description provided'}`
      ).join('\n\n');

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
                index: { type: "number", description: "Experience index (1-based)" },
                relevanceScore: { type: "number", description: "Score from 0-100" },
                keyStrengths: { type: "array", items: { type: "string" } },
                quantifiableAchievements: { type: "array", items: { type: "string" } },
                connectionToJob: { type: "string" },
                presentationSuggestion: { type: "string" }
              },
              required: ["index", "relevanceScore", "keyStrengths", "connectionToJob", "presentationSuggestion"]
            }
          },
          top3Experiences: {
            type: "array",
            items: { type: "number" },
            description: "Indices of top 3 most relevant experiences"
          },
          missingExperiences: {
            type: "array",
            items: { type: "string" },
            description: "Types of experience that would strengthen application"
          },
          alternativeAngles: {
            type: "array",
            items: { type: "string" },
            description: "Different ways to frame the experiences"
          },
          overallRecommendation: {
            type: "string",
            description: "Overall strategy for highlighting experiences"
          }
        },
        required: ["experiences", "top3Experiences", "overallRecommendation"]
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
                reason: { type: "string", description: "Why this change improves the text" }
              },
              required: ["original", "suggestion", "reason"]
            }
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
                  description: "Better alternatives"
                }
              },
              required: ["word", "alternatives"]
            }
          },
          structure: {
            type: "array",
            description: "Structural improvements",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Area to improve" },
                suggestion: { type: "string", description: "How to improve it" }
              },
              required: ["title", "suggestion"]
            }
          },
          overall: {
            type: "string",
            description: "Overall assessment and key recommendations"
          }
        },
        required: ["overall"]
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
}

export const aiService = new AIService();
