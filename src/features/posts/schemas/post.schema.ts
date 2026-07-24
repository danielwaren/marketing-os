import { z } from "zod";

export const postSchema = z.object({

  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),

  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),

  platform: z.enum([
    "instagram",
    "facebook",
    "whatsapp",
  ]),

  menu_id: z.string().nullable(),
});

export type PostSchema =
  z.infer<typeof postSchema>;