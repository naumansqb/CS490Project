// services/llm/providers/gemini.ts
import { GoogleGenAI } from "@google/genai";
import { BaseLLMClient } from "../client";
import { LLMRequest, LLMResponse } from "../../../types/ai.types";

export class GeminiProvider extends BaseLLMClient {
  private client: GoogleGenAI;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.client = new GoogleGenAI({ apiKey });
  }

  async generate<T>(request: LLMRequest): Promise<LLMResponse<T>> {
    try {
      const prompt = this.buildPrompt(request);

      const response = await this.client.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2048,
          responseMimeType: request.jsonSchema
            ? "application/json"
            : "text/plain",
        },
      });

      const text = response.text;

      let content: T;
      if (request.jsonSchema) {
        try {
          content = JSON.parse(text ?? "{}") as T;
        } catch (error) {
          throw new Error(`Failed to parse JSON response: ${text}`);
        }
      } else {
        content = text as T;
      }

      return {
        content,
        rawResponse: text,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      console.error("[Gemini Provider Error]", error);
      throw new Error(`Gemini API request failed: ${error}`);
    }
  }

  private buildPrompt(request: LLMRequest): string {
    let prompt = "";

    if (request.systemPrompt) {
      prompt += `${request.systemPrompt}\n\n`;
    }

    prompt += request.prompt;

    if (request.jsonSchema) {
      prompt += `\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(
        request.jsonSchema,
        null,
        2
      )}`;
    }

    return prompt;
  }
}
