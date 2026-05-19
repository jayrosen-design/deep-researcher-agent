import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  apiKey: z.string().min(1).max(500).optional(),
});

export const listNavigatorModels = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = data.apiKey || process.env.UF_NAVIGATOR_API_KEY;
    if (!apiKey) throw new Error("NaviGator API key not configured.");

    const res = await fetch("https://api.ai.it.ufl.edu/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`NaviGator /v1/models error [${res.status}]: ${text.slice(0, 300)}`);
    }

    const json = (await res.json()) as { data?: Array<{ id?: string }> };
    const ids = (json.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .sort();
    return { models: ids };
  });
