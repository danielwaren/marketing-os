import type {
  AIErrorCode,
  AIProviderName,
  GeneratePostInput,
  GeneratePostResult,
} from "../../types/ai.ts";

export interface AIProvider {
  readonly name: AIProviderName;

  generatePost(
    input: GeneratePostInput
  ): Promise<GeneratePostResult>;
}

export class AIProviderError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
