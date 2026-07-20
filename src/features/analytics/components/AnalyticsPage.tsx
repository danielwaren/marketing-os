import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import { useInstagramInsights } from "../hooks/useInstagramInsights";
import { MetricCard } from "./MetricCard";
import { ReachBreakdown } from "./ReachBreakdown";

export default function AnalyticsPage() {
  const { workspace, loading: loadingWorkspace } =
    useWorkspace();

  const { insights, loading, error, refresh } =
    useInstagramInsights(workspace?.id ?? null);

  if (loadingWorkspace || loading) {
    return <p>Cargando estadísticas...</p>;
  }

  if (!workspace) {
    return (
      <EmptyState
        title="Crea tu workspace primero"
        description="Necesitas un negocio configurado antes de ver estadísticas."
      />
    );
  }

  if (error?.code === "not_connected") {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Estadísticas"
          description="Analiza el rendimiento de la cuenta de Instagram del negocio."
        />

        <EmptyState
          title="Conecta Instagram para ver estadísticas"
          description="Necesitas una cuenta de Instagram conectada antes de mostrar sus métricas."
          action={
            <Button
              onClick={() => {
                window.location.href = "/app/instagram";
              }}
            >
              Ir a conexión de Instagram
            </Button>
          }
        />
      </div>
    );
  }

  const periodDays = insights?.periodDays ?? 30;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Estadísticas"
        description="Resumen del rendimiento de la cuenta de Instagram del negocio."
        actions={
          <Button
            variant="outline"
            onClick={refresh}
          >
            Actualizar
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>
            No fue posible cargar las estadísticas
          </AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {insights && (
        <>
          <Card className="flex flex-row items-center gap-4 px-6">
            {insights.profilePictureUrl ? (
              <img
                src={insights.profilePictureUrl}
                alt={insights.username ?? "Perfil"}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted" />
            )}

            <div>
              <p className="text-lg font-semibold text-foreground">
                @{insights.username ?? "cuenta"}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat("es-CL").format(
                  insights.followersCount ?? 0
                )}{" "}
                seguidores ·{" "}
                {new Intl.NumberFormat("es-CL").format(
                  insights.mediaCount ?? 0
                )}{" "}
                publicaciones
              </p>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              label={`Alcance (últimos ${periodDays} días)`}
              value={insights.reach}
              hint="Cuentas únicas que vieron el contenido."
              previousValue={insights.previousPeriod.reach}
            />

            <MetricCard
              label={`Visitas al perfil (últimos ${periodDays} días)`}
              value={insights.profileViews}
              hint="Veces que se abrió el perfil."
              previousValue={
                insights.previousPeriod.profileViews
              }
            />

            <MetricCard
              label={`Clics en enlaces del perfil (últimos ${periodDays} días)`}
              value={insights.profileLinksTaps}
              hint="Toques en los botones del perfil (sitio web, llamar, etc.)."
              previousValue={
                insights.previousPeriod.profileLinksTaps
              }
            />
          </div>

          <ReachBreakdown
            breakdown={insights.reachByFollowType}
          />

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">
                Interacciones (últimos {periodDays} días)
              </h2>
              <p className="text-sm text-muted-foreground">
                Cómo respondió la audiencia al contenido del
                período.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="Interacciones totales"
                value={insights.engagement.totalInteractions}
                hint="Me gusta, comentarios y compartidos sumados."
                previousValue={
                  insights.previousPeriod.engagement
                    .totalInteractions
                }
              />

              <MetricCard
                label="Cuentas que interactuaron"
                value={insights.engagement.accountsEngaged}
                hint="Cuentas únicas que interactuaron."
                previousValue={
                  insights.previousPeriod.engagement
                    .accountsEngaged
                }
              />

              <MetricCard
                label="Me gusta"
                value={insights.engagement.likes}
                hint="Reacciones al contenido."
                previousValue={
                  insights.previousPeriod.engagement.likes
                }
              />

              <MetricCard
                label="Comentarios"
                value={insights.engagement.comments}
                hint="Comentarios recibidos."
                previousValue={
                  insights.previousPeriod.engagement.comments
                }
              />

              <MetricCard
                label="Compartidos"
                value={insights.engagement.shares}
                hint="Veces que se compartió el contenido."
                previousValue={
                  insights.previousPeriod.engagement.shares
                }
              />

              <MetricCard
                label="Guardados"
                value={insights.engagement.saves}
                hint="Veces que guardaron el contenido."
                previousValue={
                  insights.previousPeriod.engagement.saves
                }
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Actualizado el{" "}
            {new Intl.DateTimeFormat("es-CL", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(insights.updatedAt))}
            . Las comparativas se calculan contra los{" "}
            {periodDays} días previos al período mostrado.
          </p>
        </>
      )}
    </div>
  );
}
