import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().min(3, "Ingresa el nombre del negocio"),

  business_type: z.string().min(1, "Selecciona un tipo"),

  city: z.string().min(2, "Ingresa la ciudad"),

  instagram_username: z.string().optional(),

  content_focus: z.enum(["menu", "pizza", "both"]),

  goal: z.enum(["sales", "followers", "both"]),
});

export type WorkspaceSchema = z.infer<typeof workspaceSchema>;