import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border p-8 shadow-sm">
        <h1 className="text-3xl font-bold">
          Iniciar sesión
        </h1>

        <p className="mt-2 mb-8 text-muted-foreground">
          Bienvenido nuevamente a Marketing OS.
        </p>

        <LoginForm />
      </div>
    </div>
  );
}