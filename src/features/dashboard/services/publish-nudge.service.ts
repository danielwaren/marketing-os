import type { Post } from "@/features/posts/types/post";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// null = nunca ha publicado nada.
export function getDaysSincePublish(
  posts: Post[]
): number | null {
  const publishedTimestamps = posts
    .filter(
      (post) =>
        post.status === "published" && post.published_at
    )
    .map((post) =>
      new Date(post.published_at as string).getTime()
    );

  if (publishedTimestamps.length === 0) {
    return null;
  }

  const mostRecent = Math.max(...publishedTimestamps);

  return Math.floor((Date.now() - mostRecent) / MS_PER_DAY);
}

export type NudgeSeverity =
  | "none"
  | "never"
  | "attention"
  | "urgent";

const ATTENTION_THRESHOLD_DAYS = 2;
const URGENT_THRESHOLD_DAYS = 5;

export function getNudgeSeverity(
  daysSincePublish: number | null
): NudgeSeverity {
  if (daysSincePublish === null) {
    return "never";
  }

  if (daysSincePublish >= URGENT_THRESHOLD_DAYS) {
    return "urgent";
  }

  if (daysSincePublish >= ATTENTION_THRESHOLD_DAYS) {
    return "attention";
  }

  return "none";
}
