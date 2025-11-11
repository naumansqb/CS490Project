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

import {
  CompanyResearchInput,
  CompanyNewsInput,
  CompanyResearchResult,
  CompanyNewsResult,
} from "../types/company.types";
import {
  buildCompanyResearchPrompt,
  companyResearchSystemPrompt,
  buildCompanyNewsPrompt,
  companyNewsSystemPrompt,
} from "./llm/prompts/company.prompts";
import {
  companyResearchSchema,
  companyNewsSchema,
} from "./llm/schemas/company.schema";

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

  async researchCompany(
    input: CompanyResearchInput
  ): Promise<CompanyResearchResult> {
    try {
      const prompt = buildCompanyResearchPrompt(input);

      const response = await this.llmProvider.generate<CompanyResearchResult>({
        prompt,
        systemPrompt: companyResearchSystemPrompt,
        jsonSchema: companyResearchSchema,
        temperature: 0.4, // Lower temperature for factual accuracy
        maxTokens: 4000,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Company Research Error]", error);
      throw new Error("Failed to research company");
    }
  }

  /**
   * Get recent company news and updates
   */
  async getCompanyNews(input: CompanyNewsInput): Promise<CompanyNewsResult> {
    try {
      const prompt = buildCompanyNewsPrompt(input);

      const response = await this.llmProvider.generate<CompanyNewsResult>({
        prompt,
        systemPrompt: companyNewsSystemPrompt,
        jsonSchema: companyNewsSchema,
        temperature: 0.5, // Moderate temperature for balanced analysis
        maxTokens: 3500,
      });

      return response.content;
    } catch (error) {
      console.error("[AI Service - Company News Error]", error);
      throw new Error("Failed to fetch company news");
    }
  }
}

export const aiService = new AIService();
