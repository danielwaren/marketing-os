export interface Media {
  id: string;
  workspace_id: string;

  file_name: string;
  file_path: string;

  file_type: string;
  mime_type: string;
  file_size: number;

  category: string | null;
  description: string | null;

  tags: string[];

  created_at: string;
  updated_at: string;
}