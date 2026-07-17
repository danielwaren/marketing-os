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
    throw new Error("Usuario no autenticado");
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