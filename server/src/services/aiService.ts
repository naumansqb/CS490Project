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
import { resumeSchema } from "./llm/schemas/resume.schema";
import { coverLetterSchema } from "./llm/schemas/coverLetter.schema";

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
}

export const aiService = new AIService();
