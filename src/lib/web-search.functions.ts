import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  query: z.string().min(1).max(500),
  provider: z.enum(["firecrawl", "tavily"]).optional(),
  tavilyApiKey: z.string().min(1).max(500).optional(),
  firecrawlApiKey: z.string().min(1).max(500).optional(),
  // legacy alias — older clients sent `apiKey` meaning Tavily key
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

type SearchInput = z.infer<typeof inputSchema>;

async function searchTavily(
  data: SearchInput,
  apiKey: string,
): Promise<SearchResult[]> {
  const maxResults = data.maxResults ?? 5;
  const body: Record<string, unknown> = {
    query: data.query,
    max_results: maxResults,
    search_depth: "advanced",
    chunks_per_source: data.chunksPerSource ?? 3,
  };
  if (data.timeRange) body.time_range = data.timeRange;
  if (data.includeDomains?.length) body.include_domains = data.includeDomains;

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
  return (json.results ?? [])
    .slice(0, maxResults)
    .map((r) => ({
      url: r.url ?? "",
      title: r.title ?? r.url ?? "Untitled",
      content: r.content ?? "",
    }))
    .filter((r) => r.url);
}

const TAVILY_TBS_TO_FIRECRAWL: Record<string, string> = {
  day: "qdr:d",
  week: "qdr:w",
  month: "qdr:m",
  year: "qdr:y",
};

async function searchFirecrawl(
  data: SearchInput,
  apiKey: string,
): Promise<SearchResult[]> {
  const maxResults = data.maxResults ?? 5;
  const body: Record<string, unknown> = {
    query: data.query,
    limit: maxResults,
    scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
  };
  if (data.timeRange) body.tbs = TAVILY_TBS_TO_FIRECRAWL[data.timeRange];

  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firecrawl search error [${res.status}]: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    data?:
      | Array<{ url?: string; title?: string; description?: string; markdown?: string }>
      | { web?: Array<{ url?: string; title?: string; description?: string; markdown?: string }> };
  };
  const list = Array.isArray(json.data)
    ? json.data
    : (json.data?.web ?? []);

  return list
    .slice(0, maxResults)
    .map((r) => {
      const md = (r.markdown ?? "").slice(0, 2000);
      const desc = r.description ?? "";
      const content = md || desc;
      return {
        url: r.url ?? "",
        title: r.title ?? r.url ?? "Untitled",
        content,
      };
    })
    .filter((r) => r.url);
}

export const webSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ results: SearchResult[]; providerUsed: "firecrawl" | "tavily" }> => {
    const tavilyKey = data.tavilyApiKey || data.apiKey;
    const firecrawlKey = data.firecrawlApiKey;
    if (!tavilyKey && !firecrawlKey) {
      throw new Error("Missing search API key. Open Settings → API Keys to add Firecrawl or Tavily.");
    }
    const preferred = data.provider ?? "firecrawl";

    const order: Array<"firecrawl" | "tavily"> =
      preferred === "firecrawl" ? ["firecrawl", "tavily"] : ["tavily", "firecrawl"];

    const errors: string[] = [];
    for (const provider of order) {
      const key = provider === "firecrawl" ? firecrawlKey : tavilyKey;
      if (!key) {
        errors.push(`${provider}: no API key configured`);
        continue;
      }
      try {
        const results =
          provider === "firecrawl"
            ? await searchFirecrawl(data, key)
            : await searchTavily(data, key);
        return { results, providerUsed: provider };
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    throw new Error(`Web search failed. ${errors.join(" | ")}`);
  });
