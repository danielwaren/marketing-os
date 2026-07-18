import { useEffect, useState } from "react";

import { getInstagramInsights } from "../services/analytics.service";
import type {
  AnalyticsError,
  InstagramInsights,
} from "../types/analytics";

export function useInstagramInsights(
  workspaceId: string | null
) {
  const [insights, setInsights] =
    useState<InstagramInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<AnalyticsError | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function refresh() {
    if (!workspaceId) return;

    setLoading(true);

    const result = await getInstagramInsights(
      workspaceId
    );

    if (result.data) {
      setInsights(result.data);
      setError(null);
    } else if (result.error) {
      setInsights(null);
      setError(result.error);
    }

    setLoading(false);
  }

  return { insights, loading, error, refresh };
}
