import { useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";

import { useCalendar } from "../hooks/useCalendar";

import type { Post, PostStatus } from "@/features/posts/types/post";

const statusDotStyles: Record<PostStatus, string> = {
  draft: "bg-muted-foreground/40",
  scheduled: "bg-warning",
  published: "bg-success",
};

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
  } = useCalendar();

  const [draggingPost, setDraggingPost] =
    useState<Post | null>(null);

  const [dropTargetKey, setDropTargetKey] =
    useState<string | null>(null);

  const [rescheduling, setRescheduling] =
    useState(false);

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

    await reschedule(post, targetDate);

    setRescheduling(false);
  }

  const isWeek = view === "week";

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

      <div className="overflow-hidden rounded-xl border">
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
                    {day.posts.map((post) => {
                      const draggable =
                        post.status === "scheduled";

                      return (
                        <div
                          key={post.id}
                          draggable={draggable}
                          onDragStart={() =>
                            setDraggingPost(post)
                          }
                          onDragEnd={() => {
                            setDraggingPost(null);
                            setDropTargetKey(null);
                          }}
                          title={
                            draggable
                              ? "Arrastra para reprogramar"
                              : undefined
                          }
                          className={`flex items-center gap-1.5 rounded-md bg-muted/50 px-1.5 py-1 text-xs ${
                            draggable
                              ? "cursor-grab active:cursor-grabbing"
                              : ""
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotStyles[post.status]}`}
                          />

                          <span className="truncate">
                            {post.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
