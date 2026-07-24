import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginSchema } from "../schemas/login.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

import { signIn } from "../services/auth.service";

function translateLoginError(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "Correo o contraseña incorrectos. Intenta de nuevo.";
  }

  if (/email not confirmed/i.test(message)) {
    return "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.";
  }

  return "No fue posible iniciar sesión. Intenta de nuevo en unos minutos.";
}

export function LoginForm() {
  const [loginError, setLoginError] =
    useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginSchema) {
    setLoginError(null);

    const { error } = await signIn(data.email, data.password);

    if (error) {
      setLoginError(translateLoginError(error.message));
      return;
    }

    window.location.href = "/app";
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {loginError && (
        <Alert variant="destructive">
          <AlertDescription>
            {loginError}
          </AlertDescription>
        </Alert>
      )}
      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Correo electrónico
        </label>

        <Input
          id="login-email"
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

      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Contraseña
        </label>

        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password) || undefined}
          {...register("password")}
        />

        {errors.password && (
          <p className="mt-1.5 text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿No puedes entrar? Contacta a quien te dio acceso
        a esta cuenta.
      </p>
    </form>
  );
}
