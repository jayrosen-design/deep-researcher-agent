import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  url: z.string().url(),
  provider: z.enum(["firecrawl", "tavily"]).optional(),
  tavilyApiKey: z.string().min(1).max(500).optional(),
  firecrawlApiKey: z.string().min(1).max(500).optional(),
  // legacy alias — older clients sent `apiKey` meaning Tavily key
  apiKey: z.string().min(1).max(500).optional(),
});

export type ExtractedPage = {
  url: string;
  content: string;
};

async function extractTavily(url: string, apiKey: string): Promise<ExtractedPage> {
  const res = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls: [url], extract_depth: "advanced" }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tavily extract error [${res.status}]: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    results?: Array<{ url?: string; raw_content?: string }>;
  };
  const first = json.results?.[0];
  if (!first?.raw_content) throw new Error("Tavily returned no content");
  return { url: first.url ?? url, content: first.raw_content.slice(0, 8000) };
}

async function extractFirecrawl(url: string, apiKey: string): Promise<ExtractedPage> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firecrawl scrape error [${res.status}]: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    data?: { markdown?: string; metadata?: { sourceURL?: string } };
    markdown?: string;
    metadata?: { sourceURL?: string };
  };
  const md = json.data?.markdown ?? json.markdown;
  if (!md) throw new Error("Firecrawl returned no content");
  const sourceUrl = json.data?.metadata?.sourceURL ?? json.metadata?.sourceURL ?? url;
  return { url: sourceUrl, content: md.slice(0, 8000) };
}

export const readUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<ExtractedPage> => {
    const tavilyKey = data.tavilyApiKey || data.apiKey || process.env.TAVILY_API_KEY;
    const firecrawlKey = data.firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
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
        return provider === "firecrawl"
          ? await extractFirecrawl(data.url, key)
          : await extractTavily(data.url, key);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    throw new Error(`URL extraction failed. ${errors.join(" | ")}`);
  });
