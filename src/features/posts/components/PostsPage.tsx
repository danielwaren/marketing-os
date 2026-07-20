import { useEffect, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { usePosts } from "../hooks/usePosts";
import { PostForm } from "./PostForm";
import { InstagramPostPreview } from "./InstagramPostPreview";

import { useDailyMenu } from "@/features/menu/hooks/useDailyMenu";
import { MenuPhoto } from "@/features/menu/components/MenuPhoto";
import { PostScheduler } from "@/features/calendar/components/PostScheduler";
import { useInstagramConnection } from "@/features/instagram/hooks/useInstagramConnection";
import {
  publishInstagramCarousel,
  publishInstagramPost,
} from "@/features/instagram/services/instagram.service";
import { CarouselPickerDialog } from "@/features/instagram/components/CarouselPickerDialog";

import type {
  Post,
  PostStatus,
} from "../types/post";
import type { PostSchema } from "../schemas/post.schema";
import type {
  GeneratePostInput,
} from "@/features/ai/types/ai";
import {
  clearStashedSuggestion,
  readStashedSuggestion,
} from "@/features/dashboard/services/suggestions.service";
import type { SuggestionFormat } from "@/features/dashboard/services/suggestions.service";

const platformLabels: Record<Post["platform"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

const statusLabels: Record<PostStatus, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  published: "Publicada",
};

const statusStyles: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-warning/20 text-warning-foreground",
  published: "bg-success/15 text-success",
};

type PostFilter = "all" | PostStatus;

const postFilters: Array<{
  value: PostFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Borradores" },
  { value: "scheduled", label: "Programados" },
  { value: "published", label: "Publicados" },
];

export default function PostsPage() {
  const {
    workspace,
    posts,
    loading,
    create,
    update,
    remove,
    refresh,
  } = usePosts();

  const {
    menu,
  } = useDailyMenu();

  const { status: instagramStatus } =
    useInstagramConnection(workspace?.id ?? null);

  const instagramConnected =
    instagramStatus?.connected ?? false;

  const [publishing, setPublishing] =
    useState<{
      postId: string;
      mediaType: "feed" | "stories" | "carousel";
    } | null>(null);

  const [carouselPost, setCarouselPost] =
    useState<Post | null>(null);

  const [publishFeedback, setPublishFeedback] =
    useState<{
      postId: string;
      type: "success" | "error";
      message: string;
    } | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [editingPost, setEditingPost] =
    useState<Post | null>(null);

  const [previewPost, setPreviewPost] =
    useState<Post | null>(null);

  const [deletingPostId, setDeletingPostId] =
    useState<string | null>(null);

  const [duplicatingPostId, setDuplicatingPostId] =
    useState<string | null>(null);

  const [updatingStatusPostId, setUpdatingStatusPostId] =
    useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<PostFilter>("all");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [suggestedFormat, setSuggestedFormat] =
    useState<SuggestionFormat | null>(null);

  // Al llegar desde una sugerencia del dashboard, abre el editor
  // directamente y recuerda si se pidió un post o una historia.
  useEffect(() => {
    const stashed = readStashedSuggestion();

    if (stashed) {
      setSuggestedFormat(stashed.format);
      setCreating(true);
      clearStashedSuggestion();
    }
  }, []);

  if (loading) {
    return <p>Cargando...</p>;
  }

  async function handleCreate(data: PostSchema) {
    const result = await create(data);

    if (!result?.error) {
      setCreating(false);
      setSuggestedFormat(null);
    }
  }

  async function handleUpdate(data: PostSchema) {
    if (!editingPost) return;

    const { error } = await update(
      editingPost.id,
      data
    );

    if (!error) {
      setEditingPost(null);
    }
  }

  async function handleDelete(post: Post) {
    const confirmed = window.confirm(
      `¿Eliminar el borrador "${post.title}"?`
    );

    if (!confirmed) return;

    setDeletingPostId(post.id);

    await remove(post.id);

    setDeletingPostId(null);
  }

  async function handleStatusChange(
    postId: string,
    status: PostStatus
  ) {
    setUpdatingStatusPostId(postId);

    await update(
      postId,
      status === "published"
        ? {
            status,
            published_at: new Date().toISOString(),
            scheduled_at: null,
          }
        : {
            status,
            scheduled_at: null,
            published_at: null,
          }
    );

    setUpdatingStatusPostId(null);
  }

  async function handleSchedule(
    postId: string,
    scheduledAt: string
  ) {
    setUpdatingStatusPostId(postId);

    await update(postId, {
      status: "scheduled",
      scheduled_at: scheduledAt,
    });

    setUpdatingStatusPostId(null);
  }

  async function handleUnschedule(postId: string) {
    setUpdatingStatusPostId(postId);

    await update(postId, {
      status: "draft",
      scheduled_at: null,
    });

    setUpdatingStatusPostId(null);
  }

  async function handlePublish(
    post: Post,
    mediaType: "feed" | "stories"
  ) {
    if (!workspace) return;

    const confirmed = window.confirm(
      mediaType === "stories"
        ? `¿Publicar "${post.title}" como historia de Instagram ahora?`
        : `¿Publicar "${post.title}" en Instagram ahora?`
    );

    if (!confirmed) return;

    setPublishing({ postId: post.id, mediaType });
    setPublishFeedback(null);

    const result = await publishInstagramPost(
      workspace.id,
      post.id,
      mediaType
    );

    if (result.error) {
      setPublishFeedback({
        postId: post.id,
        type: "error",
        message: result.error.message,
      });
    } else {
      setPublishFeedback({
        postId: post.id,
        type: "success",
        message:
          mediaType === "stories"
            ? "Historia publicada en Instagram."
            : "Publicado en Instagram.",
      });

      if (mediaType === "feed") {
        await refresh();
      }
    }

    setPublishing(null);
  }

  async function handleConfirmCarousel(
    mediaIds: string[]
  ) {
    if (!workspace || !carouselPost) return;

    const post = carouselPost;

    setPublishing({
      postId: post.id,
      mediaType: "carousel",
    });
    setPublishFeedback(null);

    const result = await publishInstagramCarousel(
      workspace.id,
      post.id,
      mediaIds
    );

    if (result.error) {
      setPublishFeedback({
        postId: post.id,
        type: "error",
        message: result.error.message,
      });
    } else {
      setPublishFeedback({
        postId: post.id,
        type: "success",
        message: "Carrusel publicado en Instagram.",
      });

      await refresh();
    }

    setPublishing(null);
    setCarouselPost(null);
  }

  async function handleDuplicate(post: Post) {
    setDuplicatingPostId(post.id);

    const result = await create({
      menu_id: post.menu_id,
      title: `Copia de ${post.title}`,
      content: post.content,
      platform: post.platform,
    });

    if (!result?.error) {
      setStatusFilter("draft");
      setSearchQuery("");
    }

    setDuplicatingPostId(null);
  }

  const initialValues: PostSchema = {
    title: menu
      ? `Menú del ${new Intl.DateTimeFormat(
          "es-CL",
          { weekday: "long" }
        ).format(new Date())} - ${workspace?.name ?? "Hostal Monchito"}`
      : "",

    content: "",

    platform: "instagram",

    menu_id: menu?.id ?? null,
  };

  const generationContext:
    (
      Omit<GeneratePostInput, "platform" | "photo"> & {
        photoPath?: string | null;
      }
    ) | null =
      workspace && menu
        ? {
            workspace: {
              name: workspace.name,
              business_type:
                workspace.business_type,
              city: workspace.city,
              instagram_username:
                workspace.instagram_username,
              content_focus:
                workspace.content_focus,
              goal: workspace.goal,
            },
            menu: {
              starter: menu.starter,
              main_course: menu.main_course,
              dessert: menu.dessert,
              price: Number(menu.price),
            },
            photoPath:
              menu.media?.file_path ?? null,
          }
        : null;

  const normalizedSearchQuery = searchQuery
    .trim()
    .toLocaleLowerCase("es-CL");

  const filteredPosts = posts.filter((post) => {
    const matchesStatus =
      statusFilter === "all" ||
      post.status === statusFilter;

    const searchableContent = [
      post.title,
      post.content,
      platformLabels[post.platform],
    ]
      .join(" ")
      .toLocaleLowerCase("es-CL");

    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      searchableContent.includes(
        normalizedSearchQuery
      );

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">

      <PageHeader
        title="Publicaciones"
        description="Administra tus borradores."
        actions={
          !creating && !editingPost && (
            <Button
              onClick={() =>
                setCreating(true)
              }
            >
              Nueva publicación
            </Button>
          )
        }
      />

      {creating && suggestedFormat && (
        <div className="rounded-lg border border-warning/40 bg-warning/15 px-4 py-3 text-sm text-warning-foreground">
          {suggestedFormat === "story"
            ? "Estás creando una historia sugerida desde el banco de contenido. Recuerda adjuntar la foto sugerida al menú de hoy para publicarla."
            : "Estás creando un post sugerido desde el banco de contenido. Recuerda adjuntar la foto sugerida al menú de hoy para publicarlo."}
        </div>
      )}

      {creating && (
        <PostForm
          initialValues={initialValues}
          generationContext={generationContext}
          mode="create"
          onSubmit={handleCreate}
        />
      )}

      {editingPost && (
        <PostForm
          initialValues={{
            title: editingPost.title,
            content: editingPost.content,
            platform: editingPost.platform,
            menu_id: editingPost.menu_id,
          }}
          generationContext={generationContext}
          mode="edit"
          onSubmit={handleUpdate}
        />
      )}

      {!creating &&
        !editingPost &&
        posts.length > 0 && (
          <div className="space-y-3">
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Buscar por título, contenido o plataforma"
              aria-label="Buscar publicaciones"
              className="max-w-xl"
            />

            <div
              className="flex flex-wrap gap-2"
              aria-label="Filtrar publicaciones"
            >
              {postFilters.map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={
                    statusFilter === filter.value
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setStatusFilter(filter.value)
                  }
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        )}

      {!creating && !editingPost &&
        posts.length === 0 && (
          <EmptyState
            title="No existen publicaciones"
            description="Crea tu primer borrador."
          />
        )}

      {!creating &&
        !editingPost &&
        posts.length > 0 &&
        filteredPosts.length === 0 && (
          <EmptyState
            title="No hay publicaciones"
            description="No existen publicaciones que coincidan con la búsqueda o el filtro."
          />
        )}

      {!creating &&
        !editingPost &&
        filteredPosts.length > 0 && (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="gap-0 py-0 transition-shadow hover:shadow-md"
              >
                <CardHeader className="border-b py-5">
                  <CardTitle className="pr-4 text-lg">
                    {post.title}
                  </CardTitle>

                  <CardDescription>
                    {platformLabels[post.platform]}
                    {" · "}
                    {new Intl.DateTimeFormat(
                      "es-CL",
                      { dateStyle: "medium" }
                    ).format(new Date(post.created_at))}
                  </CardDescription>

                  <CardAction>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[post.status]}`}
                    >
                      {statusLabels[post.status]}
                    </span>
                  </CardAction>
                </CardHeader>

                <CardContent className="space-y-4 py-5">
                  <p className="whitespace-pre-line leading-6 text-foreground/90">
                    {post.content}
                  </p>

                  {post.menu?.media && (
                    <MenuPhoto
                      filePath={post.menu.media.file_path}
                    />
                  )}
                </CardContent>

                <CardFooter className="flex-wrap justify-between gap-3">
                  {post.status === "scheduled" ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-muted-foreground">
                        Programada para{" "}
                        <span className="font-medium text-foreground">
                          {post.scheduled_at
                            ? new Intl.DateTimeFormat(
                                "es-CL",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              ).format(
                                new Date(post.scheduled_at)
                              )
                            : "sin fecha"}
                        </span>
                      </span>

                      {instagramConnected &&
                      post.menu?.media ? (
                        <span className="text-xs text-muted-foreground">
                          Se publicará automáticamente en Instagram a esa hora.
                        </span>
                      ) : (
                        <span className="text-xs text-warning-foreground">
                          Conecta Instagram y agrega una foto para la publicación automática.
                        </span>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <PostScheduler
                          initialValue={
                            post.scheduled_at ?? undefined
                          }
                          label="Reprogramar"
                          savingLabel="Reprogramando..."
                          disabled={
                            updatingStatusPostId === post.id ||
                            deletingPostId === post.id ||
                            duplicatingPostId === post.id
                          }
                          onSchedule={(scheduledAt) =>
                            handleSchedule(
                              post.id,
                              scheduledAt
                            )
                          }
                        />

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            updatingStatusPostId === post.id ||
                            deletingPostId === post.id ||
                            duplicatingPostId === post.id
                          }
                          onClick={() =>
                            handleUnschedule(post.id)
                          }
                        >
                          Cancelar programación
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor={`post-status-${post.id}`}
                        className="sr-only"
                      >
                        Estado
                      </label>

                      <select
                        id={`post-status-${post.id}`}
                        value={post.status}
                        disabled={
                          updatingStatusPostId === post.id ||
                          deletingPostId === post.id ||
                          duplicatingPostId === post.id
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            post.id,
                            event.target.value as PostStatus
                          )
                        }
                        className="h-8 rounded-lg border bg-background px-2.5 text-sm"
                      >
                        <option value="draft">Borrador</option>
                        <option value="published">Publicada</option>
                      </select>

                      {post.status === "draft" && (
                        <PostScheduler
                          disabled={
                            updatingStatusPostId === post.id ||
                            deletingPostId === post.id ||
                            duplicatingPostId === post.id
                          }
                          onSchedule={(scheduledAt) =>
                            handleSchedule(
                              post.id,
                              scheduledAt
                            )
                          }
                        />
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {instagramConnected &&
                      post.platform === "instagram" &&
                      post.menu?.media &&
                      post.status !== "published" && (
                        <Button
                          disabled={
                            publishing?.postId === post.id ||
                            deletingPostId === post.id ||
                            duplicatingPostId === post.id ||
                            updatingStatusPostId === post.id
                          }
                          onClick={() =>
                            handlePublish(post, "feed")
                          }
                        >
                          {publishing?.postId === post.id &&
                          publishing.mediaType === "feed"
                            ? "Publicando..."
                            : "Publicar en Instagram"}
                        </Button>
                      )}

                    {instagramConnected &&
                      post.platform === "instagram" &&
                      post.menu?.media && (
                        <Button
                          variant="outline"
                          disabled={
                            publishing?.postId === post.id ||
                            deletingPostId === post.id ||
                            duplicatingPostId === post.id ||
                            updatingStatusPostId === post.id
                          }
                          onClick={() =>
                            handlePublish(post, "stories")
                          }
                        >
                          {publishing?.postId === post.id &&
                          publishing.mediaType === "stories"
                            ? "Publicando historia..."
                            : "Publicar historia"}
                        </Button>
                      )}

                    {instagramConnected &&
                      post.platform === "instagram" &&
                      post.status !== "published" && (
                        <Button
                          variant="outline"
                          disabled={
                            publishing?.postId === post.id ||
                            deletingPostId === post.id ||
                            duplicatingPostId === post.id ||
                            updatingStatusPostId === post.id
                          }
                          onClick={() =>
                            setCarouselPost(post)
                          }
                        >
                          {publishing?.postId === post.id &&
                          publishing.mediaType === "carousel"
                            ? "Publicando carrusel..."
                            : "Publicar carrusel"}
                        </Button>
                      )}

                    {post.platform === "instagram" && (
                      <Button
                        variant="outline"
                        disabled={
                          deletingPostId === post.id ||
                          duplicatingPostId === post.id ||
                          updatingStatusPostId === post.id
                        }
                        onClick={() =>
                          setPreviewPost(post)
                        }
                      >
                        Vista previa
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      disabled={
                        deletingPostId === post.id ||
                        duplicatingPostId === post.id ||
                        updatingStatusPostId === post.id
                      }
                      onClick={() =>
                        handleDuplicate(post)
                      }
                    >
                      {duplicatingPostId === post.id
                        ? "Duplicando..."
                        : "Duplicar"}
                    </Button>

                    {post.status === "draft" && (
                      <>
                      <Button
                        variant="outline"
                        disabled={
                          deletingPostId === post.id ||
                          duplicatingPostId === post.id ||
                          updatingStatusPostId === post.id
                        }
                        onClick={() =>
                          setEditingPost(post)
                        }
                      >
                        Editar
                      </Button>

                      <Button
                        variant="destructive"
                        disabled={
                          deletingPostId === post.id ||
                          duplicatingPostId === post.id ||
                          updatingStatusPostId === post.id
                        }
                        onClick={() =>
                          handleDelete(post)
                        }
                      >
                        {deletingPostId === post.id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </Button>
                      </>
                    )}
                  </div>

                  {publishFeedback?.postId === post.id && (
                    <p
                      className={`w-full text-sm ${
                        publishFeedback.type === "success"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {publishFeedback.message}
                    </p>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

      <InstagramPostPreview
        post={previewPost}
        workspaceName={
          workspace?.name ?? "Tu negocio"
        }
        instagramUsername={
          workspace?.instagram_username ?? null
        }
        onClose={() => setPreviewPost(null)}
      />

      <CarouselPickerDialog
        open={carouselPost !== null}
        publishing={
          publishing?.mediaType === "carousel"
        }
        onClose={() => setCarouselPost(null)}
        onConfirm={handleConfirmCarousel}
      />
    </div>
  );
}
