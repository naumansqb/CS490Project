// services/llm/client.ts
import { LLMProvider, LLMRequest, LLMResponse } from "../../types/ai.types";

export interface ILLMClient {
  generate<T>(request: LLMRequest): Promise<LLMResponse<T>>;
}

export abstract class BaseLLMClient implements ILLMClient {
  abstract generate<T>(request: LLMRequest): Promise<LLMResponse<T>>;

  protected validateResponse(response: any, schema?: object): boolean {
    if (!schema) return true;
    // Basic validation - can be enhanced with a library like Zod
    return response !== null && response !== undefined;
  }
}
