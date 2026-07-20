import { Card, CardContent } from "@/components/ui/card";

import { WorkspaceForm } from "./WorkspaceForm";

export default function WorkspacePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-xl">
        <Card>
          <CardContent className="px-8 py-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Configura tu negocio
            </h1>

            <p className="mt-2 mb-8 text-sm text-muted-foreground">
              Esta información permitirá personalizar la estrategia de contenido.
            </p>

            <WorkspaceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}