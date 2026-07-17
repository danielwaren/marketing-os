import { supabase } from "@/lib/supabase";

export async function uploadMedia(
  workspaceId: string,
  file: File
) {
  const extension = file.name.split(".").pop();

  const now = new Date();

const fileName = `${crypto.randomUUID()}.${extension}`;

const filePath = `${workspaceId}/${now.getFullYear()}/${String(
  now.getMonth() + 1
).padStart(2, "0")}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(filePath, file);

  if (uploadError) {
    return { error: uploadError };
  }

  console.log({
    workspace_id: workspaceId,
    file_name: file.name,
    file_path: filePath,
  });

  return await supabase.from("media").insert({
    workspace_id: workspaceId,

    file_name: file.name,
    file_path: filePath,

    file_type: file.type.startsWith("image")
      ? "image"
      : "video",

    mime_type: file.type,

    file_size: file.size,
  });
}

export async function getMedia(workspaceId: string) {
  return await supabase
    .from("media")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", {
      ascending: false,
    });
}

export async function deleteMedia(media: {
  id: string;
  file_path: string;
}) {
  await supabase.storage
    .from("media")
    .remove([media.file_path]);

  return await supabase
    .from("media")
    .delete()
    .eq("id", media.id);
}

export async function getSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(path, 60 * 60);

  return {
    data,
    error,
  };
}