import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),

    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Las contraseñas no coinciden.",
      path: ["confirmPassword"],
    }
  );

export type ResetPasswordSchema = z.infer<
  typeof resetPasswordSchema
>;
