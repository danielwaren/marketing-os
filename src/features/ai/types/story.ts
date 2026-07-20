import type { AIProviderName, AIUsage } from "./ai";

export type AIStoryAction = "generate" | "rewrite";

export type StoryPlanType =
  | "lunch"
  | "pizza_night"
  | "general";

export type AIStoryLength = "short" | "standard";

export type AIStoryTone =
  | "casual"
  | "promotional"
  | "storytelling";

export interface GenerateStoryInput {
  action?: AIStoryAction;
  length?: AIStoryLength;
  tone?: AIStoryTone;
  sourceText?: string;
  storyType?: StoryPlanType;
  photo?: {
    data: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
  };
  workspace: {
    name: string;
    business_type: string;
    city: string;
    instagram_username: string | null;
    content_focus: "menu" | "pizza" | "both";
    goal: "sales" | "followers" | "both";
  };
  context?: GenerateStoryContext;
}

export interface GenerateStoryContext {
  weekday: string;
  localTime: string;
  timeOfDay: "mañana" | "tarde" | "noche";
  greeting: string;
  weatherSummary?: string | null;
  isRaining?: boolean;
  isCold?: boolean;
}

export interface GenerateStoryResult {
  text: string;
  provider: AIProviderName;
  fallback: boolean;
  notice?: string;
  context?: GenerateStoryContext;
  usage?: AIUsage;
}

export type AIStoryErrorCode =
  | "provider_not_configured"
  | "rate_limit"
  | "network_error"
  | "invalid_response"
  | "service_unavailable";

export interface GenerateStoryError {
  code: AIStoryErrorCode;
  message: string;
  fallbackText: string | null;
}

export interface GenerateStoryVersion {
  text: string;
  provider: AIProviderName;
  fallback: boolean;
}

export interface GenerateStoryVersionsResult {
  versions: GenerateStoryVersion[];
  notice?: string;
}
