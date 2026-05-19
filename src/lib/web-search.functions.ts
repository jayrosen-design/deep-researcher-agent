import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  query: z.string().min(1).max(500),
  apiKey: z.string().min(1).max(500).optional(),
  maxResults: z.number().int().min(1).max(20).optional(),
  timeRange: z.enum(["day", "week", "month", "year"]).optional(),
  includeDomains: z.array(z.string().min(1).max(253)).max(20).optional(),
  chunksPerSource: z.number().int().min(1).max(5).optional(),
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

    const maxResults = data.maxResults ?? 5;
    const body: Record<string, unknown> = {
      query: data.query,
      max_results: maxResults,
      search_depth: "advanced",
      chunks_per_source: data.chunksPerSource ?? 3,
    };
    if (data.timeRange) body.time_range = data.timeRange;
    if (data.includeDomains && data.includeDomains.length > 0) {
      body.include_domains = data.includeDomains;
    }

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Tavily API error [${res.status}]: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      results?: Array<{ url?: string; title?: string; content?: string }>;
    };

    const results: SearchResult[] = (json.results ?? [])
      .slice(0, maxResults)
      .map((r) => ({
        url: r.url ?? "",
        title: r.title ?? r.url ?? "Untitled",
        content: r.content ?? "",
      }))
      .filter((r) => r.url);

    return { results };
  });
