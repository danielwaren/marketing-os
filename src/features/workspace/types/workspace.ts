export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  business_type: string;
  city: string;
  instagram_username: string | null;
  content_focus: "menu" | "pizza" | "both";
  goal: "sales" | "followers" | "both";
  auto_publish_stories: boolean;
  created_at: string;
  updated_at: string;
}