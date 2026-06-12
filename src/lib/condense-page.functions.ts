import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  url: z.string().min(1).max(2000),
  title: z.string().max(500).optional(),
  content: z.string().min(1),
  question: z.string().min(1).max(4000),
  model: z.string().min(1).max(200),
  apiKey: z.string().min(1).max(500).optional(),
});

// Tuned so even a single chunk + the small extraction prompt stays well under
// a 32k-token investigator model context window.
const CHUNK_CHAR_SIZE = 6000;
const CHUNK_OVERLAP = 400;
const PASS_THROUGH_THRESHOLD = 8000; // pages this small don't need condensing
const MAX_FINAL_CHARS = 14000; // safety cap on the merged extraction
const MAX_PARALLEL = 4;

function splitIntoChunks(text: string): string[] {
  if (text.length <= CHUNK_CHAR_SIZE) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + CHUNK_CHAR_SIZE);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function callNavigator(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch("https://api.ai.it.ufl.edu/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NaviGator condense error [${res.status}]: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export const condensePage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ condensed: string; chunkCount: number; wasCondensed: boolean }> => {
    const apiKey = data.apiKey;
    if (!apiKey) throw new Error("Missing NaviGator API key. Open Settings → API Keys to add one.");

    if (data.content.length <= PASS_THROUGH_THRESHOLD) {
      return { condensed: data.content, chunkCount: 1, wasCondensed: false };
    }

    const chunks = splitIntoChunks(data.content);

    const mapSystem = `You extract every fact, statistic, quote, named entity, date, and finding from a single chunk of a web page that is relevant to a research question. Be exhaustive — do NOT summarize loosely. Preserve numbers, names, and exact quoted phrases verbatim. Output dense Markdown bullets only. If the chunk has nothing relevant, output exactly: (nothing relevant)`;

    const extractions = await runWithConcurrency(chunks, MAX_PARALLEL, async (chunk, idx) => {
      const user = `Research question:\n${data.question}\n\nPage title: ${data.title ?? "(unknown)"}\nPage URL: ${data.url}\nChunk ${idx + 1} of ${chunks.length}:\n\n${chunk}\n\nExtract every relevant fact now as Markdown bullets.`;
      try {
        return await callNavigator(apiKey, data.model, mapSystem, user, 1500);
      } catch (e) {
        // If a single chunk fails, fall back to a raw truncated slice so we
        // don't lose the data entirely.
        const msg = e instanceof Error ? e.message : String(e);
        return `- [chunk ${idx + 1} extraction failed: ${msg}; raw excerpt follows]\n${chunk.slice(0, 1500)}`;
      }
    });

    const merged = extractions
      .map((ex, i) => `### Chunk ${i + 1}\n${ex || "(nothing relevant)"}`)
      .join("\n\n");

    // If the merged extraction is small enough, skip the reduce pass.
    if (merged.length <= MAX_FINAL_CHARS) {
      return { condensed: merged, chunkCount: chunks.length, wasCondensed: true };
    }

    // Reduce pass: collapse duplicate bullets across chunks, keep all unique facts.
    const reduceSystem = `You merge per-chunk extractions from a single web page into one deduplicated bullet list of facts relevant to a research question. Keep ALL unique facts, numbers, names, and quotes — do not drop information. Remove only verbatim duplicates. Output dense Markdown bullets only.`;
    const reduceUser = `Research question:\n${data.question}\n\nPage: ${data.title ?? data.url} (${data.url})\n\nPer-chunk extractions:\n\n${merged}\n\nProduce the deduplicated bullet list now.`;
    try {
      const reduced = await callNavigator(apiKey, data.model, reduceSystem, reduceUser, 4000);
      const final = reduced.length > MAX_FINAL_CHARS ? reduced.slice(0, MAX_FINAL_CHARS) : reduced;
      return { condensed: final, chunkCount: chunks.length, wasCondensed: true };
    } catch {
      // Fall back to the truncated merged map output.
      return {
        condensed: merged.slice(0, MAX_FINAL_CHARS),
        chunkCount: chunks.length,
        wasCondensed: true,
      };
    }
  });
