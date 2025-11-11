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

      // Note: We don't throw on truncation detection here - let JSON.parse attempt first
      // If parsing fails, we'll try to repair it in the catch block below

      let content: T;
      if (request.jsonSchema) {
        try {
          content = JSON.parse(text ?? "{}") as T;
        } catch (error) {
          // Try to repair truncated JSON by closing incomplete structures
          let repairedText = text ?? "";
          const trimmedText = repairedText.trim();
          
          // Count unclosed structures
          const openBraces = (trimmedText.match(/\{/g) || []).length;
          const closeBraces = (trimmedText.match(/\}/g) || []).length;
          const openBrackets = (trimmedText.match(/\[/g) || []).length;
          const closeBrackets = (trimmedText.match(/\]/g) || []).length;
          
          // If it ends mid-string, try to close it
          if (trimmedText.match(/"[^"]*$/)) {
            // Remove incomplete string and add closing quote
            repairedText = trimmedText.replace(/"[^"]*$/, '"');
          }
          
          // If it ends with a comma (incomplete array/object entry), remove it
          repairedText = repairedText.replace(/,\s*$/, '');
          
          // Close incomplete objects first (inner to outer)
          for (let i = 0; i < openBraces - closeBraces; i++) {
            repairedText += '}';
          }
          
          // Close incomplete arrays
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            repairedText += ']';
          }
          
          // Try parsing the repaired JSON
          try {
            content = JSON.parse(repairedText) as T;
            console.warn(`[Gemini Provider] Repaired truncated JSON response. Original length: ${text?.length || 0}, Repaired length: ${repairedText.length}`);
          } catch (repairError) {
            // If repair failed, throw original error with more context
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(
              `Failed to parse JSON response (and repair attempt failed): ${errorMessage}. ` +
              `Response length: ${text?.length || 0} chars. ` +
              `Unbalanced: braces ${openBraces}/${closeBraces}, brackets ${openBrackets}/${closeBrackets}. ` +
              `First 500 chars: ${text?.substring(0, 500) || 'empty'}...`
            );
          }
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
