import { z } from "zod";

export const postSchema = z.object({

  title: z.string().min(3),

  content: z.string().min(10),

  platform: z.enum([
    "instagram",
    "facebook",
    "whatsapp",
  ]),

  menu_id: z.string().nullable(),
});

export type PostSchema =
  z.infer<typeof postSchema>;