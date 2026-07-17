import { DashboardHeader } from "./DashboardHeader";
import { DashboardCard } from "./DashboardCard";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";
import { useMedia } from "@/features/media/hooks/useMedia";
import { useDailyMenu } from "@/features/menu/hooks/useDailyMenu";

export default function DashboardPage() {
  const {
    workspace,
    loading: workspaceLoading,
  } = useWorkspace();

  const {
    media,
    loading: mediaLoading,
  } = useMedia();

  const {
    menu,
    loading: menuLoading,
  } = useDailyMenu();

  const loading =
    workspaceLoading ||
    mediaLoading ||
    menuLoading;

  if (loading) {
    return <p>Cargando dashboard...</p>;
  }

  if (!workspace) {
    window.location.href = "/workspace";
    return null;
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        workspaceName={workspace.name}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardCard
          title="Menú de hoy"
          value={menu?.main_course ?? "Sin configurar"}
          description={
            menu
              ? `$${Number(menu.price).toLocaleString("es-CL")}`
              : "Aún no has creado el menú de hoy."
          }
          actionLabel={menu ? "Ver menú" : "Crear menú"}
          onClick={() => {
            window.location.href = "/app/menu";
          }}
        />

        <DashboardCard
          title="Banco de contenido"
          value={`${media.length}`}
          description={
            media.length === 1
              ? "1 archivo disponible"
              : `${media.length} archivos disponibles`
          }
          actionLabel="Administrar contenido"
          onClick={() => {
            window.location.href = "/app/media";
          }}
        />

        <DashboardCard
          title="Instagram"
          value="Pendiente"
          description="La conexión con Instagram se implementará en el siguiente módulo."
          actionLabel="Próximamente"
          disabled
        />

        <DashboardCard
          title="Publicaciones"
          value="0"
          description="Todavía no hay publicaciones creadas."
          actionLabel="Próximamente"
          disabled
        />
      </div>
    </div>
  );
}