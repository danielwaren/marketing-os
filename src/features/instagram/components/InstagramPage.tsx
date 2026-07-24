import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";
import { useConfirm } from "@/hooks/useConfirm";

import { useInstagramConnection } from "../hooks/useInstagramConnection";

export default function InstagramPage() {
  const { workspace, loading: loadingWorkspace } =
    useWorkspace();

  const {
    status,
    loading,
    connecting,
    error,
    connect,
    disconnect,
  } = useInstagramConnection(workspace?.id ?? null);

  const { confirm, dialog: confirmDialog } = useConfirm();

  async function handleDisconnect() {
    const confirmed = await confirm({
      title: "Desconectar Instagram",
      description:
        "Se detiene toda publicación automática hacia Instagram hasta que vuelvas a conectar la cuenta. Los borradores y publicaciones ya hechas no se pierden.",
      confirmLabel: "Desconectar",
      variant: "destructive",
    });

    if (!confirmed) return;

    await disconnect();
  }

  if (loadingWorkspace || loading) {
    return <p>Cargando...</p>;
  }

  if (!workspace) {
    return (
      <EmptyState
        title="Crea tu workspace primero"
        description="Necesitas un negocio configurado antes de conectar Instagram."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Instagram"
        description="Conecta la cuenta de Instagram del negocio para publicar contenido automáticamente."
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {status?.connected
              ? "Cuenta conectada"
              : "Sin conexión"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {status?.connected ? (
            <>
              <p className="text-sm">
                Conectado como{" "}
                <span className="font-medium">
                  @{status.igUsername}
                </span>
              </p>

              {status.connectedAt && (
                <p className="text-sm text-muted-foreground">
                  Conectado el{" "}
                  {new Intl.DateTimeFormat("es-CL", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(status.connectedAt))}
                </p>
              )}

              <Button
                variant="destructive"
                disabled={connecting}
                onClick={handleDisconnect}
              >
                {connecting
                  ? "Desconectando..."
                  : "Desconectar"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Ninguna cuenta de Instagram está conectada
                todavía.
              </p>

              <Button
                disabled={connecting}
                onClick={connect}
              >
                {connecting
                  ? "Conectando..."
                  : "Conectar con Instagram"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>
            No fue posible completar la operación
          </AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {confirmDialog}
    </div>
  );
}
