import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  url: z.string().url(),
});

export type ExtractedPage = {
  url: string;
  content: string;
};

export const readUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<ExtractedPage> => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("TAVILY_API_KEY is not configured");

    const res = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: [data.url],
        extract_depth: "advanced",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Tavily extract error [${res.status}]: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      results?: Array<{ url?: string; raw_content?: string }>;
    };
    const first = json.results?.[0];
    if (!first?.raw_content) {
      throw new Error("No content extracted from URL");
    }
    // Cap to keep the agent context manageable.
    const content = first.raw_content.slice(0, 8000);
    return { url: first.url ?? data.url, content };
  });
