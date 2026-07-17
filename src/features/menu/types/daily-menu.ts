export interface DailyMenuMedia {
  file_path: string;
  file_name: string;
}

export interface DailyMenu {
  id: string;
  workspace_id: string;
  date: string;
  starter: string;
  main_course: string;
  dessert: string;
  price: number;
  media_id: string | null;
  media: DailyMenuMedia | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDailyMenuDto {
  starter: string;
  main_course: string;
  dessert: string;
  price: number;
  media_id?: string | null;
}

export interface UpdateDailyMenuDto {
  starter: string;
  main_course: string;
  dessert: string;
  price: number;
  media_id: string | null;
}