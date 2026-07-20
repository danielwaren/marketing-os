import type {
  AIProviderName,
} from "../types/ai.ts";

export const AI_PROVIDER_VALUES = [
  "claude",
  "gemini",
  "groq",
  "templates",
  "openai",
] as const;

export const DEFAULT_AI_PROVIDER: AIProviderName =
  "claude";

export const CLAUDE_MODEL =
  "claude-haiku-4-5-20251001";

export const GEMINI_MODEL =
  "gemini-3.5-flash";

export const GROQ_MODEL =
  "qwen/qwen3.6-27b";

export function isAIProviderName(
  value: string
): value is AIProviderName {
  return AI_PROVIDER_VALUES.includes(
    value as AIProviderName
  );
}
