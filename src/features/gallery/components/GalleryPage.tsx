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

import { GOOGLE_PHOTOS_CLIENT_ID } from "../constants/gallery.constants";
import { useGooglePhotosConnection } from "../hooks/useGooglePhotosConnection";
import { usePhotosPicker } from "../hooks/usePhotosPicker";

const PICKER_STATE_LABELS: Record<string, string> = {
  waiting_selection:
    "Elige tus fotos en la ventana de Google Photos que se abrió...",
  importing: "Importando fotos al banco de medios...",
};

export default function GalleryPage() {
  const { workspace, loading: loadingWorkspace } =
    useWorkspace();

  const {
    status,
    loading,
    connecting,
    error,
    connect,
    disconnect,
  } = useGooglePhotosConnection(workspace?.id ?? null);

  const {
    state: pickerState,
    error: pickerError,
    importedCount,
    pickPhotos,
    reset: resetPicker,
  } = usePhotosPicker(workspace?.id ?? null);

  if (loadingWorkspace || loading) {
    return <p>Cargando...</p>;
  }

  if (!workspace) {
    return (
      <EmptyState
        title="Crea tu workspace primero"
        description="Necesitas un negocio configurado antes de conectar Google Photos."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Galería"
        description="Conecta Google Photos para elegir fotos del banco al crear posts e historias."
      />

      {!GOOGLE_PHOTOS_CLIENT_ID && (
        <Alert>
          <AlertTitle>
            Google Photos aún no está configurado
          </AlertTitle>
          <AlertDescription>
            Falta registrar el Client ID de Google Cloud en el
            proyecto.
          </AlertDescription>
        </Alert>
      )}

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
                  {status.googleEmail}
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
                onClick={disconnect}
              >
                {connecting
                  ? "Desconectando..."
                  : "Desconectar"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Ninguna cuenta de Google Photos está
                conectada todavía.
              </p>

              <Button
                disabled={
                  connecting || !GOOGLE_PHOTOS_CLIENT_ID
                }
                onClick={connect}
              >
                {connecting
                  ? "Conectando..."
                  : "Conectar con Google Photos"}
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

      {status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>
              Elegir fotos del banco de Google Photos
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se abre una ventana de Google para elegir fotos
              puntuales; las que elijas se copian al banco de
              medios del negocio.
            </p>

            <Button
              disabled={
                pickerState === "waiting_selection" ||
                pickerState === "importing"
              }
              onClick={pickPhotos}
            >
              {pickerState === "waiting_selection" ||
              pickerState === "importing"
                ? "Procesando..."
                : "Elegir fotos de Google Photos"}
            </Button>

            {(pickerState === "waiting_selection" ||
              pickerState === "importing") && (
              <p className="text-sm text-muted-foreground">
                {PICKER_STATE_LABELS[pickerState]}
              </p>
            )}

            {pickerState === "done" && (
              <Alert>
                <AlertTitle>
                  Fotos importadas
                </AlertTitle>
                <AlertDescription>
                  Se agregaron {importedCount}{" "}
                  {importedCount === 1
                    ? "foto"
                    : "fotos"}{" "}
                  al banco de medios.{" "}
                  <button
                    className="underline"
                    onClick={resetPicker}
                  >
                    Elegir más
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {pickerState === "error" && pickerError && (
              <Alert variant="destructive">
                <AlertTitle>
                  No fue posible importar las fotos
                </AlertTitle>
                <AlertDescription>
                  {pickerError.message}{" "}
                  <button
                    className="underline"
                    onClick={resetPicker}
                  >
                    Reintentar
                  </button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
