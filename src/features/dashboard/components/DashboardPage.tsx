import {
  CalendarClock,
  Images,
  Link2,
  UtensilsCrossed,
} from "lucide-react";

import { DashboardHeader } from "./DashboardHeader";
import { DashboardCard } from "./DashboardCard";
import { AIUsageCard } from "./AIUsageCard";
import { ContentSuggestions } from "./ContentSuggestions";
import { SeasonalSuggestionBanner } from "./SeasonalSuggestionBanner";
import { PublishNudgeBanner } from "./PublishNudgeBanner";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";
import { useMedia } from "@/features/media/hooks/useMedia";
import { useDailyMenu } from "@/features/menu/hooks/useDailyMenu";
import { useInstagramConnection } from "@/features/instagram/hooks/useInstagramConnection";
import { usePosts } from "@/features/posts/hooks/usePosts";
import { useSeasonalSuggestion } from "../hooks/useSeasonalSuggestion";

export default function DashboardPage() {
  const {
    workspace,
    loading: workspaceLoading,
    setAutoPublishStories,
  } = useWorkspace();

  const {
    media,
    loading: mediaLoading,
  } = useMedia();

  const {
    menu,
    loading: menuLoading,
  } = useDailyMenu();

  const { status: instagramStatus } =
    useInstagramConnection(workspace?.id ?? null);

  const { posts, loading: postsLoading } = usePosts();

  const seasonal = useSeasonalSuggestion();

  const loading =
    workspaceLoading ||
    mediaLoading ||
    menuLoading ||
    postsLoading;

  if (loading) {
    return <p>Cargando dashboard...</p>;
  }

  if (!workspace) {
    window.location.href = "/workspace";
    return null;
  }

  const publishedCount = posts.filter(
    (post) => post.status === "published"
  ).length;
  const scheduledCount = posts.filter(
    (post) => post.status === "scheduled"
  ).length;
  const instagramConnected =
    instagramStatus?.connected ?? false;

  return (
    <div className="space-y-8">
      <DashboardHeader
        workspaceName={workspace.name}
      />

      <PublishNudgeBanner
        posts={posts}
        media={media}
        menu={menu}
        workspace={workspace}
        instagramConnected={instagramConnected}
      />

      {seasonal.available && (
        <SeasonalSuggestionBanner
          event={seasonal.event}
          message={seasonal.message}
          workspace={workspace}
          menu={menu}
        />
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          icon={UtensilsCrossed}
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
          icon={Images}
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
          icon={Link2}
          title="Instagram"
          value={
            instagramConnected
              ? "Conectado"
              : "Sin conectar"
          }
          description={
            instagramConnected
              ? "Puedes publicar directo desde tus publicaciones."
              : "Conecta tu cuenta para poder publicar."
          }
          actionLabel={
            instagramConnected
              ? "Ver conexión"
              : "Conectar ahora"
          }
          badge={
            instagramConnected
              ? { label: "Activo", variant: "success" }
              : undefined
          }
          onClick={() => {
            window.location.href = "/app/instagram";
          }}
        />

        <DashboardCard
          icon={CalendarClock}
          title="Publicaciones"
          value={`${posts.length}`}
          description={
            scheduledCount > 0
              ? `${publishedCount} publicadas · ${scheduledCount} programadas`
              : `${publishedCount} publicadas hasta ahora`
          }
          actionLabel="Ver publicaciones"
          onClick={() => {
            window.location.href = "/app/posts";
          }}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AIUsageCard workspaceId={workspace.id} />
      </div>

      <ContentSuggestions
        media={media}
        menu={menu}
        workspace={workspace}
        instagramConnected={instagramConnected}
        onToggleAutoPublish={setAutoPublishStories}
      />
    </div>
  );
}
