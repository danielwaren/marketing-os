import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from "../schemas/forgot-password.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

import { requestPasswordReset } from "../services/auth.service";

export function ForgotPasswordForm() {
  const [formError, setFormError] =
    useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordSchema) {
    setFormError(null);

    const { error } = await requestPasswordReset(
      data.email
    );

    if (error) {
      setFormError(
        "No fue posible enviar el correo. Intenta de nuevo en unos minutos."
      );
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Alert>
        <AlertDescription>
          Si el correo está registrado, te enviamos un
          enlace para crear una nueva contraseña. Revisa
          tu bandeja de entrada (y la carpeta de spam).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>
            {formError}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <label
          htmlFor="forgot-email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Correo electrónico
        </label>

        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email) || undefined}
          {...register("email")}
        />

        {errors.email && (
          <p className="mt-1.5 text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Enviando..."
          : "Enviar enlace de recuperación"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <a
          href="/login"
          className="underline underline-offset-2"
        >
          Volver a iniciar sesión
        </a>
      </p>
    </form>
  );
}
