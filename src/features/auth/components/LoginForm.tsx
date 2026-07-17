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
    console.log("onSubmit", data);
    
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
        <Input
          type="email"
          placeholder="Correo electrónico"
          {...register("email")}
        />

        {errors.email && (
          <p className="mt-2 text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Contraseña"
          {...register("password")}
        />

        {errors.password && (
          <p className="mt-2 text-sm text-red-500">
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