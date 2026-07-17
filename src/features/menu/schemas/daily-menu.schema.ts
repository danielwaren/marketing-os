import { z } from "zod";

export const dailyMenuSchema = z.object({
  starter: z.string().min(2),

  main_course: z.string().min(2),

  dessert: z.string().min(2),

  media_id: z.string().nullable().optional(),
});

export type DailyMenuSchema = z.infer<
  typeof dailyMenuSchema
>;
