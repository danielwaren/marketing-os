import { supabase } from "@/lib/supabase";

export interface CreateWorkspaceDto {
  name: string;
  business_type: string;
  city: string;
  instagram_username: string;
  content_focus: "menu" | "pizza" | "both";
  goal: "sales" | "followers" | "both";
}

export async function getWorkspace() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: new Error("not_authenticated"),
    };
  }

  return await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
}

export async function createWorkspace(
  workspace: CreateWorkspaceDto
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  return await supabase.from("workspaces").insert({
    owner_id: user.id,
    ...workspace,
  });
}

export async function updateAutoPublishStories(
  workspaceId: string,
  autoPublishStories: boolean
) {
  return await supabase
    .from("workspaces")
    .update({
      auto_publish_stories: autoPublishStories,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId)
    .select("*")
    .single();
}