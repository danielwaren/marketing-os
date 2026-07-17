import { supabase } from "@/lib/supabase";

import type {
  CreatePostDto,
  UpdatePostDto,
} from "../types/post";

const postSelect = `
  *,
  menu:menu_id (
    media:media_id (
      file_path,
      file_name
    )
  )
`;

export async function getPosts(
  workspaceId: string
) {
  return await supabase
    .from("posts")
    .select(postSelect)
    .eq("workspace_id", workspaceId)
    .order("created_at", {
      ascending: false,
    });
}

export async function createPost(
  workspaceId: string,
  post: CreatePostDto
) {
  return await supabase
    .from("posts")
    .insert({
      workspace_id: workspaceId,
      menu_id: post.menu_id,
      title: post.title,
      content: post.content,
      platform: post.platform,
    })
    .select(postSelect)
    .single();
}

export async function updatePost(
  id: string,
  post: UpdatePostDto
) {
  return await supabase
    .from("posts")
    .update({
      ...post,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(postSelect)
    .single();
}

export async function deletePost(
  id: string
) {
  return await supabase
    .from("posts")
    .delete()
    .eq("id", id);
}
