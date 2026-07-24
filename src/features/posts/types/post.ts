import type {
  DailyMenuMedia,
} from "@/features/menu/types/daily-menu";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "published";

export type Platform =
  | "instagram"
  | "facebook"
  | "whatsapp";

export type PostFormat = "post" | "story";

export interface PostMenu {
  media: DailyMenuMedia | null;
}

export interface PostMedia {
  file_path: string;
  file_name: string;
}

export interface Post {
  id: string;

  workspace_id: string;

  menu_id: string | null;

  menu: PostMenu | null;

  media_id: string | null;

  media: PostMedia | null;

  title: string;

  content: string;

  platform: Platform;

  format: PostFormat | null;

  status: PostStatus;

  scheduled_at: string | null;

  published_at: string | null;

  created_at: string;

  updated_at: string;
}

export interface CreatePostDto {
  menu_id: string | null;

  media_id?: string | null;

  title: string;

  content: string;

  platform: Platform;

  format?: PostFormat | null;
}

export interface UpdatePostDto
  extends Partial<CreatePostDto> {
  status?: PostStatus;

  scheduled_at?: string | null;

  published_at?: string | null;
}
