import type {
  GeneratePostInput,
} from "../../types/ai.ts";
import {
  AIProviderError,
  type AIProvider,
} from "./ai-provider.interface.ts";

export class OpenAIProvider
  implements AIProvider {
  readonly name = "openai" as const;

  async generatePost(
    _input: GeneratePostInput
  ): Promise<never> {
    throw new AIProviderError(
      "provider_not_configured",
      "OpenAI está desactivado durante el MVP."
    );
  }
}
