import { useEffect, useState } from "react";

import {
  deleteMedia,
  getMedia,
  uploadMedia,
} from "../services/media.service";
import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";
import type { Media } from "../types/media";

export function useMedia() {
  const { workspace } = useWorkspace();

  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!workspace) return;

      const { data, error } = await getMedia(workspace.id);

      if (!error && data) {
        setMedia(data);
      }

      setLoading(false);
    }

    load();
  }, [workspace]);

  return {
    media,
    loading,
    workspace,
    upload: async (file: File) => {
  if (!workspace) {
    return {
      error: new Error("Workspace no encontrado"),
    };
  }

  console.log("Workspace:", workspace);
  console.log("User Workspace ID:", workspace?.id);
  
  const { error } = await uploadMedia(
    workspace.id,
    file
  );

  if (!error) {
    const { data } = await getMedia(workspace.id);

    if (data) {
      setMedia(data);
    }
  }

  return { error };
},
    refresh: async () => {
      if (!workspace) return;

      const { data } = await getMedia(workspace.id);

      if (data) {
        setMedia(data);
      }
    },
    remove: async (item: Media) => {
      const { error } = await deleteMedia({
        id: item.id,
        file_path: item.file_path,
      });

      if (!error) {
        setMedia((current) =>
          current.filter((entry) => entry.id !== item.id)
        );
      }

      return { error };
    },
  };
}