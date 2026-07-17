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

export interface PostMenu {
  media: DailyMenuMedia | null;
}

export interface Post {
  id: string;

  workspace_id: string;

  menu_id: string | null;

  menu: PostMenu | null;

  title: string;

  content: string;

  platform: Platform;

  status: PostStatus;

  scheduled_at: string | null;

  published_at: string | null;

  created_at: string;

  updated_at: string;
}

export interface CreatePostDto {
  menu_id: string | null;

  title: string;

  content: string;

  platform: Platform;
}

export interface UpdatePostDto
  extends Partial<CreatePostDto> {
  status?: PostStatus;

  scheduled_at?: string | null;

  published_at?: string | null;
}
