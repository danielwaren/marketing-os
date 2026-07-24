import { ChefHat } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <ChefHat
              className="size-6"
              strokeWidth={2}
            />
          </div>
        </div>

        <Card>
          <CardContent className="px-8 py-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Recuperar contraseña
            </h1>

            <p className="mt-2 mb-8 text-sm text-muted-foreground">
              Escribe tu correo y te enviamos un enlace
              para crear una nueva contraseña.
            </p>

            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
