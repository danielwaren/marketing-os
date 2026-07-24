import { z } from "zod";

export const dailyMenuSchema = z.object({
  starter: z.string().min(2, "Escribe la entrada del día."),

  main_course: z.string().min(2, "Escribe el plato principal del día."),

  dessert: z.string().min(2, "Escribe el postre del día."),

  media_id: z.string().nullable().optional(),
});

export type DailyMenuSchema = z.infer<
  typeof dailyMenuSchema
>;
