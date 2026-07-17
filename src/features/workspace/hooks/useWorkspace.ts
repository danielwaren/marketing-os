import { useEffect, useState } from "react";
import { getWorkspace } from "../services/workspace.service";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await getWorkspace();

      if (!error) {
        setWorkspace(data);
      }

      setLoading(false);
    }

    load();
  }, []);

  return {
    workspace,
    loading,
  };
}