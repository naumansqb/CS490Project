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

  async extractJobData(html: string): Promise<any> {
    try {
      // Clean HTML to reduce token usage
      const cleanedHtml = cleanHtmlForExtraction(html);

      // Generate prompt
      const prompt = generateJobExtractionPrompt(cleanedHtml);

      // Define JSON schema for structured output
      const jsonSchema = {
        type: "object",
        properties: {
          title: { type: ["string", "null"] },
          company: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
          salaryMin: { type: ["string", "null"] },
          salaryMax: { type: ["string", "null"] },
          deadline: { type: ["string", "null"] },
          industry: { type: ["string", "null"] },
          jobType: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
        },
        required: [],
      };

      // Call LLM
      const response = await this.llmProvider.generate<any>({
        prompt,
        systemPrompt: "You are a job posting data extraction assistant. Extract structured information from HTML and return valid JSON.",
        jsonSchema,
        temperature: 0.3, // Lower temperature for more deterministic extraction
        maxTokens: 2048,
      });

      // Parse and validate response
      const rawData = response.content;
      const validatedData = validateExtractedData(rawData);

      return validatedData;
  } catch (error) {
      console.error("[Extract Job Data Error]", error);
      throw new Error(`Failed to extract job data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  }
}

export const aiService = new AIService();
