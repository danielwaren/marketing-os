import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Ingresa un correo válido"),
});

export type ForgotPasswordSchema = z.infer<
  typeof forgotPasswordSchema
>;
