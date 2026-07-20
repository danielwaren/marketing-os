import { useEffect, useState } from "react";

import {
  getWorkspace,
  updateAutoPublishStories,
} from "../services/workspace.service";
import type { Workspace } from "../types/workspace";

export function useWorkspace() {
  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await getWorkspace();

      // Si falla por sesión inválida/expirada, no dejar el spinner
      // colgado para siempre — mandar a login para que pueda recuperarse.
      if (
        error &&
        error.message === "not_authenticated"
      ) {
        window.location.href = "/login";
        return;
      }

      if (!error) {
        setWorkspace(data as Workspace | null);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function setAutoPublishStories(
    value: boolean
  ) {
    if (!workspace) return;

    const { data, error } =
      await updateAutoPublishStories(
        workspace.id,
        value
      );

    if (!error && data) {
      setWorkspace(data as Workspace);
    }

    return { error };
  }

  return {
    workspace,
    loading,
    setAutoPublishStories,
  };
}