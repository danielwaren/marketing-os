import { WorkspaceForm } from "./WorkspaceForm";

export default function WorkspacePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border p-8">
        <h1 className="text-3xl font-bold">
          Configura tu negocio
        </h1>

        <p className="mt-2 mb-8 text-muted-foreground">
          Esta información permitirá personalizar la estrategia de contenido.
        </p>

        <WorkspaceForm />
      </div>
    </div>
  );
}