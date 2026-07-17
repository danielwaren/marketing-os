import { z } from "zod";

import type {
  GeneratePostInput,
} from "../types/ai";

export const generatePostTextSchema:
  z.ZodType<GeneratePostInput> = z.object({
  action: z.enum([
    "generate",
    "rewrite",
    "hashtags",
    "emojis",
  ]).optional(),
  length: z.enum([
    "standard",
    "short",
    "long",
  ]).optional(),
  tone: z.enum([
    "formal",
    "casual",
    "promotional",
  ]).optional(),
  promptId: z.enum([
    "daily-menu",
    "lunch-invitation",
    "local-homemade",
  ]).optional(),
  sourceText: z.string().min(10).max(5000).optional(),
  versionCount: z.union([
    z.literal(2),
    z.literal(3),
  ]).optional(),
  variantSeed: z.number().int().min(0).optional(),
  photo: z.object({
    data: z.string().min(1).max(3_000_000),
    mimeType: z.enum([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]),
  }).optional(),
  workspace: z.object({
    name: z.string().min(1).max(120),
    business_type: z.string().min(1).max(120),
    city: z.string().min(1).max(120),
    instagram_username: z.string().max(120).nullable(),
    content_focus: z.enum([
      "menu",
      "pizza",
      "both",
    ]),
    goal: z.enum([
      "sales",
      "followers",
      "both",
    ]),
  }),
  platform: z.enum([
    "instagram",
    "facebook",
    "whatsapp",
  ]),
  menu: z.object({
    starter: z.string().min(1).max(200),
    main_course: z.string().min(1).max(200),
    dessert: z.string().min(1).max(200),
    price: z.number().nonnegative(),
  }),
}).refine(
  (input) =>
    !["rewrite", "hashtags", "emojis"].includes(
      input.action ?? "generate"
    ) ||
    Boolean(input.sourceText?.trim()),
  {
    message:
      "La publicación original es obligatoria para esta acción.",
    path: ["sourceText"],
  }
);
