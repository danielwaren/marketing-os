import { useState } from "react";

import type { Post, PostStatus } from "@/features/posts/types/post";

import { PostScheduler } from "./PostScheduler";

const statusDotStyles: Record<PostStatus, string> = {
  draft: "bg-muted-foreground/40",
  scheduled: "bg-warning",
  published: "bg-success",
};

interface Props {
  post: Post;
  draggable?: boolean;
  onDragStart?(): void;
  onDragEnd?(): void;
  onReschedule(scheduledAt: string): Promise<unknown> | unknown;
}

export function CalendarPostChip({
  post,
  draggable = false,
  onDragStart,
  onDragEnd,
  onReschedule,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const canReschedule = post.status === "scheduled";

  return (
    <div className="space-y-1">
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title={
          draggable
            ? "Arrastra para reprogramar"
            : undefined
        }
        className={`flex items-center gap-1.5 rounded-md bg-muted/50 px-1.5 py-1 text-xs ${
          draggable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotStyles[post.status]}`}
        />

        <span className="min-w-0 flex-1 truncate">
          {post.title}
        </span>

        {canReschedule && (
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            aria-expanded={pickerOpen}
            className="shrink-0 cursor-pointer text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Reprogramar
          </button>
        )}
      </div>

      {pickerOpen && (
        <PostScheduler
          initialValue={post.scheduled_at ?? undefined}
          label="Guardar"
          savingLabel="Guardando..."
          onSchedule={async (scheduledAt) => {
            await onReschedule(scheduledAt);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
