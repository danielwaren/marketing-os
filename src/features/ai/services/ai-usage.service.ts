import { supabase } from "@/lib/supabase";

import type { AIUsageSummary } from "../types/ai";

function getStartOfMonth() {
  const date = new Date();

  date.setDate(1);
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

export async function getAIUsageSummary(
  workspaceId: string
) {
  const { data, error } = await supabase
    .from("ai_usage_log")
    .select("input_tokens, output_tokens")
    .eq("workspace_id", workspaceId)
    .gte("created_at", getStartOfMonth());

  if (error || !data) {
    return { data: null, error };
  }

  const summary = data.reduce<AIUsageSummary>(
    (acc, row) => ({
      inputTokens:
        acc.inputTokens + (row.input_tokens ?? 0),
      outputTokens:
        acc.outputTokens + (row.output_tokens ?? 0),
      generations: acc.generations + 1,
    }),
    { inputTokens: 0, outputTokens: 0, generations: 0 }
  );

  return { data: summary, error: null };
}
