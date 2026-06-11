import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  apiKey: z.string().min(1).max(500).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
});

export const Route = createFileRoute("/api/navigator-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof inputSchema>;
        try {
          const raw = await request.json();
          parsed = inputSchema.parse(raw);
        } catch (e) {
          return new Response(
            `Invalid request body: ${e instanceof Error ? e.message : String(e)}`,
            { status: 400 },
          );
        }

        const apiKey = parsed.apiKey || process.env.UF_NAVIGATOR_API_KEY;
        if (!apiKey) {
          return new Response("NaviGator API key not configured. Add one in Settings.", {
            status: 500,
          });
        }

        const body: Record<string, unknown> = {
          model: parsed.model ?? "gemini-1.5-pro",
          messages: parsed.messages,
          temperature: parsed.temperature ?? 0.3,
          stream: true,
        };
        if (parsed.maxTokens) body.max_tokens = parsed.maxTokens;

        const upstream = await fetch("https://api.ai.it.ufl.edu/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(body),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(
            `NaviGator stream error [${upstream.status}]: ${text.slice(0, 500)}`,
            { status: 502 },
          );
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (!payload) continue;
                  if (payload === "[DONE]") {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                    continue;
                  }
                  try {
                    const json = JSON.parse(payload) as {
                      choices?: Array<{ delta?: { content?: string } }>;
                    };
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`),
                      );
                    }
                  } catch {
                    // ignore malformed chunks
                  }
                }
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              controller.close();
            } catch (e) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ error: e instanceof Error ? e.message : String(e) })}\n\n`,
                ),
              );
              controller.close();
            }
          },
          cancel(reason) {
            return reader.cancel(reason);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
