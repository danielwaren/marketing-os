import { ChefHat } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { LoginForm } from "./LoginForm";

export default function LoginPage() {
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
              Iniciar sesión
            </h1>

            <p className="mt-2 mb-8 text-sm text-muted-foreground">
              Bienvenido nuevamente a Marketing OS.
            </p>

            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}