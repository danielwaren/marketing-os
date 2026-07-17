import {
  GEMINI_MODEL,
} from "../../constants/ai.constants.ts";
import {
  buildPostPrompt,
  formatPostText,
  POST_SYSTEM_PROMPT,
} from "../../prompts/post.prompt.ts";
import type {
  GeneratePostInput,
} from "../../types/ai.ts";
import {
  AIProviderError,
  type AIProvider,
} from "./ai-provider.interface.ts";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class GeminiProvider
  implements AIProvider {
  readonly name = "gemini" as const;

  constructor(
    private readonly apiKey: string,
    private readonly model = GEMINI_MODEL
  ) {}

  async generatePost(
    input: GeneratePostInput
  ) {
    if (!this.apiKey) {
      throw new AIProviderError(
        "provider_not_configured",
        "Gemini no está configurado."
      );
    }

    let response: Response;
    const parts = input.photo
      ? [
          {
            inlineData: {
              mimeType: input.photo.mimeType,
              data: input.photo.data,
            },
          },
          { text: buildPostPrompt(input) },
        ]
      : [
          { text: buildPostPrompt(input) },
        ];

    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                { text: POST_SYSTEM_PROMPT },
              ],
            },
            contents: [
              {
                role: "user",
                parts,
              },
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 500,
            },
          }),
        }
      );
    } catch {
      throw new AIProviderError(
        "network_error",
        "No fue posible conectar con Gemini."
      );
    }

    if (response.status === 429) {
      throw new AIProviderError(
        "rate_limit",
        "Gemini alcanzó temporalmente su límite de uso."
      );
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new AIProviderError(
        "provider_not_configured",
        "La clave de Gemini no es válida o no tiene permisos."
      );
    }

    if (!response.ok) {
      throw new AIProviderError(
        "service_unavailable",
        "Gemini no está disponible temporalmente."
      );
    }

    let data: GeminiResponse;

    try {
      data = await response.json() as GeminiResponse;
    } catch {
      throw new AIProviderError(
        "invalid_response",
        "Gemini devolvió una respuesta inválida."
      );
    }

    const text = (data.candidates ?? [])
      .flatMap(
        (candidate) =>
          candidate.content?.parts ?? []
      )
      .map((part) => part.text ?? "")
      .join("\n")
      .trim();

    if (!text) {
      throw new AIProviderError(
        "invalid_response",
        "Gemini no devolvió un texto utilizable."
      );
    }

    return {
      text: formatPostText(text, input),
      provider: this.name,
      fallback: false,
    };
  }
}
