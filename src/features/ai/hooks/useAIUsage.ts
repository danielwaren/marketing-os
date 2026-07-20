import { useEffect, useState } from "react";

import { getAIUsageSummary } from "../services/ai-usage.service";
import type { AIUsageSummary } from "../types/ai";

export function useAIUsage(
  workspaceId: string | null
) {
  const [summary, setSummary] =
    useState<AIUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      const { data } = await getAIUsageSummary(
        workspaceId
      );

      setSummary(data);
      setLoading(false);
    }

    load();
  }, [workspaceId]);

  return { summary, loading };
}
