import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginSchema } from "../schemas/login.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { signIn } from "../services/auth.service";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginSchema) {
    const { error } = await signIn(data.email, data.password);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/app";
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
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
    </form>
  );
}
