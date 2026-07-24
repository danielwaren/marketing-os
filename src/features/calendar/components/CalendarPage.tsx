import { useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { EmptyState } from "@/components/common/EmptyState";

import { useCalendar } from "../hooks/useCalendar";
import { CalendarPostChip } from "./CalendarPostChip";

import type { Post } from "@/features/posts/types/post";

export default function CalendarPage() {
  const {
    loading,
    view,
    setView,
    weeks,
    weekdayLabels,
    rangeLabel,
    goToPrevious,
    goToNext,
    goToToday,
    reschedule,
    rescheduleToDateTime,
  } = useCalendar();

  const [draggingPost, setDraggingPost] =
    useState<Post | null>(null);

  const [dropTargetKey, setDropTargetKey] =
    useState<string | null>(null);

  const [rescheduling, setRescheduling] =
    useState(false);

  const [rescheduleError, setRescheduleError] =
    useState<string | null>(null);

  if (loading) {
    return <p>Cargando...</p>;
  }

  async function handleDrop(
    targetDate: Date,
    dateKey: string
  ) {
    setDropTargetKey(null);

    if (!draggingPost) return;

    const post = draggingPost;

    setDraggingPost(null);

    const currentKey = post.scheduled_at
      ? [
          new Date(post.scheduled_at).getFullYear(),
          String(
            new Date(post.scheduled_at).getMonth() + 1
          ).padStart(2, "0"),
          String(
            new Date(post.scheduled_at).getDate()
          ).padStart(2, "0"),
        ].join("-")
      : null;

    if (currentKey === dateKey) return;

    setRescheduling(true);
    setRescheduleError(null);

    const { error } = await reschedule(post, targetDate);

    if (error) {
      setRescheduleError(
        `No fue posible reprogramar "${post.title}". Intenta de nuevo.`
      );
    }

    setRescheduling(false);
  }

  async function handleKeyboardReschedule(
    post: Post,
    scheduledAt: string
  ) {
    setRescheduleError(null);

    const { error } = await rescheduleToDateTime(
      post,
      scheduledAt
    );

    if (error) {
      setRescheduleError(
        `No fue posible reprogramar "${post.title}". Intenta de nuevo.`
      );
    }
  }

  const isWeek = view === "week";
  const hasAnyPosts = weeks.some((week) =>
    week.some((day) => day.posts.length > 0)
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calendario"
        description="Visualiza y reprograma tus publicaciones. Arrastra una publicación programada a otro día para moverla."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="radiogroup"
              aria-label="Vista del calendario"
              className="inline-flex rounded-lg border border-border bg-muted/50 p-1"
            >
              <button
                type="button"
                role="radio"
                aria-checked={view === "month"}
                onClick={() => setView("month")}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "month"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mes
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={view === "week"}
                onClick={() => setView("week")}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "week"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semana
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
            >
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Hoy
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
            >
              Siguiente
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-medium">
          {rangeLabel}
        </h2>

        {rescheduling && (
          <span className="text-sm text-muted-foreground">
            Reprogramando...
          </span>
        )}
      </div>

      {rescheduleError && (
        <Alert variant="destructive">
          <AlertDescription>
            {rescheduleError}
          </AlertDescription>
        </Alert>
      )}

      {!hasAnyPosts && (
        <EmptyState
          title="No hay publicaciones en este rango"
          description="Programa una publicación desde Publicaciones y aparecerá aquí."
        />
      )}

      <div className="hidden overflow-hidden rounded-xl border md:block">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="px-3 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {weeks.flatMap((week) =>
            week.map((day) => {
              const isDropTarget =
                dropTargetKey === day.dateKey;

              return (
                <div
                  key={day.dateKey}
                  onDragOver={(event) => {
                    if (!draggingPost) return;

                    event.preventDefault();
                    setDropTargetKey(day.dateKey);
                  }}
                  onDragLeave={() => {
                    setDropTargetKey((current) =>
                      current === day.dateKey
                        ? null
                        : current
                    );
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(day.date, day.dateKey);
                  }}
                  className={`space-y-1.5 border-b border-r p-2 last:border-r-0 ${
                    isWeek ? "min-h-64" : "min-h-28"
                  } ${
                    day.isCurrentMonth
                      ? "bg-background"
                      : "bg-muted/20 text-muted-foreground"
                  } ${
                    isDropTarget
                      ? "ring-2 ring-inset ring-primary"
                      : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      day.isToday
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    {day.date.getDate()}
                  </span>

                  <div className="space-y-1">
                    {day.posts.map((post) => (
                      <CalendarPostChip
                        key={post.id}
                        post={post}
                        draggable={
                          post.status === "scheduled"
                        }
                        onDragStart={() =>
                          setDraggingPost(post)
                        }
                        onDragEnd={() => {
                          setDraggingPost(null);
                          setDropTargetKey(null);
                        }}
                        onReschedule={(scheduledAt) =>
                          handleKeyboardReschedule(
                            post,
                            scheduledAt
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {hasAnyPosts && (
        <div className="space-y-3 md:hidden">
          {weeks
            .flatMap((week) => week)
            .filter((day) => day.posts.length > 0)
            .map((day) => (
              <div
                key={day.dateKey}
                className={`rounded-xl border p-3 ${
                  day.isToday
                    ? "border-primary/40 bg-primary/5"
                    : ""
                }`}
              >
                <p className="mb-2 text-sm font-medium text-foreground">
                  {new Intl.DateTimeFormat("es-CL", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  }).format(day.date)}
                </p>

                <div className="space-y-1">
                  {day.posts.map((post) => (
                    <CalendarPostChip
                      key={post.id}
                      post={post}
                      onReschedule={(scheduledAt) =>
                        handleKeyboardReschedule(
                          post,
                          scheduledAt
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Programada
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Publicada
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Para programar una publicación, edítala desde{" "}
        <a
          href="/app/posts"
          className="underline underline-offset-2"
        >
          Publicaciones
        </a>
        .
      </p>
    </div>
  );
}
