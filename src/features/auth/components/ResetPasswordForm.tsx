import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "../schemas/reset-password.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

import {
  getSession,
  updatePassword,
} from "../services/auth.service";

export function ResetPasswordForm() {
  const [formError, setFormError] =
    useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    getSession().then(({ data }) => {
      setValidLink(Boolean(data.session));
      setReady(true);
    });
  }, []);

  async function onSubmit(data: ResetPasswordSchema) {
    setFormError(null);

    const { error } = await updatePassword(
      data.password
    );

    if (error) {
      setFormError(
        "No fue posible actualizar la contraseña. Intenta de nuevo."
      );
      return;
    }

    setDone(true);
  }

  if (!ready) {
    return <p>Cargando...</p>;
  }

  if (!validLink) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Este enlace ya no es válido o expiró. Solicita
          uno nuevo desde{" "}
          <a
            href="/forgot-password"
            className="underline underline-offset-2"
          >
            recuperar contraseña
          </a>
          .
        </AlertDescription>
      </Alert>
    );
  }

  if (done) {
    return (
      <Alert>
        <AlertDescription>
          Tu contraseña se actualizó correctamente.{" "}
          <a
            href="/login"
            className="underline underline-offset-2"
          >
            Ir a iniciar sesión
          </a>
          .
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
          htmlFor="reset-password"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Nueva contraseña
        </label>

        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password) || undefined}
          {...register("password")}
        />

        {errors.password && (
          <p className="mt-1.5 text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="reset-confirm-password"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Confirmar contraseña
        </label>

        <Input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={
            Boolean(errors.confirmPassword) || undefined
          }
          {...register("confirmPassword")}
        />

        {errors.confirmPassword && (
          <p className="mt-1.5 text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Guardando..."
          : "Guardar nueva contraseña"}
      </Button>
    </form>
  );
}
