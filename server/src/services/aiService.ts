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
