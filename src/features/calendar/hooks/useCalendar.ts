import { useMemo, useState } from "react";

import { usePosts } from "@/features/posts/hooks/usePosts";
import type { Post } from "@/features/posts/types/post";

export type CalendarView = "month" | "week";

export interface CalendarDay {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: Post[];
}

const WEEKDAY_LABELS = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getPostDate(post: Post) {
  if (post.scheduled_at) {
    return new Date(post.scheduled_at);
  }

  if (post.status === "published" && post.published_at) {
    return new Date(post.published_at);
  }

  return null;
}

function getMondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function useCalendar() {
  const { workspace, posts, loading, update } =
    usePosts();

  const [view, setView] =
    useState<CalendarView>("month");

  const [referenceDate, setReferenceDate] =
    useState(() => new Date());

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();

    for (const post of posts) {
      const date = getPostDate(post);

      if (!date) continue;

      const key = toDateKey(date);
      const existing = map.get(key) ?? [];

      existing.push(post);
      map.set(key, existing);
    }

    return map;
  }, [posts]);

  function buildDay(
    date: Date,
    month: number,
    todayKey: string
  ): CalendarDay {
    const dateKey = toDateKey(date);

    return {
      date,
      dateKey,
      isCurrentMonth:
        view === "week" || date.getMonth() === month,
      isToday: dateKey === todayKey,
      posts: postsByDate.get(dateKey) ?? [],
    };
  }

  const weeks = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const month = referenceDate.getMonth();

    if (view === "week") {
      const start = new Date(referenceDate);

      start.setDate(
        referenceDate.getDate() -
          getMondayIndex(referenceDate)
      );

      const days: CalendarDay[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(start);

        date.setDate(start.getDate() + i);
        days.push(buildDay(date, month, todayKey));
      }

      return [days];
    }

    const firstDayOfMonth = new Date(
      referenceDate.getFullYear(),
      month,
      1
    );
    const firstGridDate = new Date(firstDayOfMonth);

    firstGridDate.setDate(
      firstDayOfMonth.getDate() -
        getMondayIndex(firstDayOfMonth)
    );

    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(firstGridDate);

      date.setDate(firstGridDate.getDate() + i);
      days.push(buildDay(date, month, todayKey));
    }

    const result: CalendarDay[][] = [];

    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceDate, postsByDate, view]);

  const rangeLabel = useMemo(() => {
    if (view === "week") {
      const week = weeks[0];
      const start = week[0].date;
      const end = week[6].date;

      const sameMonth =
        start.getMonth() === end.getMonth();
      const startLabel = new Intl.DateTimeFormat(
        "es-CL",
        sameMonth
          ? { day: "numeric" }
          : { day: "numeric", month: "short" }
      ).format(start);
      const endLabel = new Intl.DateTimeFormat(
        "es-CL",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      ).format(end);

      return `${startLabel} – ${endLabel}`;
    }

    return capitalize(
      new Intl.DateTimeFormat("es-CL", {
        month: "long",
        year: "numeric",
      }).format(referenceDate)
    );
  }, [view, weeks, referenceDate]);

  function goToPrevious() {
    setReferenceDate((date) => {
      if (view === "week") {
        const next = new Date(date);

        next.setDate(date.getDate() - 7);

        return next;
      }

      return new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        1
      );
    });
  }

  function goToNext() {
    setReferenceDate((date) => {
      if (view === "week") {
        const next = new Date(date);

        next.setDate(date.getDate() + 7);

        return next;
      }

      return new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1
      );
    });
  }

  function goToToday() {
    setReferenceDate(new Date());
  }

  async function reschedule(
    post: Post,
    targetDate: Date
  ) {
    const source = post.scheduled_at
      ? new Date(post.scheduled_at)
      : null;
    const next = new Date(targetDate);

    next.setHours(
      source ? source.getHours() : 12,
      source ? source.getMinutes() : 0,
      0,
      0
    );

    return await update(post.id, {
      status: "scheduled",
      scheduled_at: next.toISOString(),
    });
  }

  // Alternativa sin arrastrar: reprograma a una fecha y hora exactas,
  // elegidas desde un selector accesible por teclado.
  async function rescheduleToDateTime(
    post: Post,
    scheduledAt: string
  ) {
    return await update(post.id, {
      status: "scheduled",
      scheduled_at: scheduledAt,
    });
  }

  return {
    workspace,
    loading,
    view,
    setView,
    weeks,
    weekdayLabels: WEEKDAY_LABELS,
    rangeLabel,
    goToPrevious,
    goToNext,
    goToToday,
    reschedule,
    rescheduleToDateTime,
  };
}
