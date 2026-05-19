import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  query: z.string().min(1).max(500),
  apiKey: z.string().min(1).max(500).optional(),
  maxResults: z.number().int().min(1).max(20).optional(),
});

export type SearchResult = {
  url: string;
  title: string;
  content: string;
};

export const webSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ results: SearchResult[] }> => {
    const apiKey = data.apiKey || process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("Tavily API key not configured. Add one in Settings.");

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: data.query,
        max_results: 5,
        search_depth: "advanced",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Tavily API error [${res.status}]: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      results?: Array<{ url?: string; title?: string; content?: string }>;
    };

    const results: SearchResult[] = (json.results ?? [])
      .slice(0, 5)
      .map((r) => ({
        url: r.url ?? "",
        title: r.title ?? r.url ?? "Untitled",
        content: r.content ?? "",
      }))
      .filter((r) => r.url);

    return { results };
  });
