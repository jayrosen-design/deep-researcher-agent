import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  apiKey: z.string().min(1).max(500).optional(),
});

function getNavigatorModelErrorMessage(status: number, bodyText: string) {
  if (status === 401 || status === 403) {
    return "Invalid NaviGator API key. NaviGator keys should start with 'sk-'.";
  }

  return `NaviGator model list unavailable right now [${status}].`;
}

export const listNavigatorModels = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = data.apiKey?.trim();
    if (!apiKey) return { models: [], error: null as string | null };
    if (!apiKey.startsWith("sk-")) {
      return {
        models: [],
        error: "Invalid NaviGator API key. NaviGator keys should start with 'sk-'.",
      };
    }

    try {
      const res = await fetch("https://api.ai.it.ufl.edu/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          models: [],
          error: getNavigatorModelErrorMessage(res.status, text),
        };
      }

      const json = (await res.json()) as { data?: Array<{ id?: string }> };
      const ids = (json.data ?? [])
        .map((m) => m.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
        .sort();
      return { models: ids, error: null as string | null };
    } catch {
      return {
        models: [],
        error: "Unable to reach NaviGator to load models right now.",
      };
    }
  });
