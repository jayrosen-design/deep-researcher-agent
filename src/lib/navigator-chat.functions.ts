import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  responseFormat: z.enum(["text", "json_object"]).optional(),
  apiKey: z.string().min(1).max(500).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
});

export const navigatorChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = data.apiKey;
    if (!apiKey) throw new Error("Missing NaviGator API key. Open Settings → API Keys to add one.");

    const body: Record<string, unknown> = {
      model: data.model ?? "gemini-1.5-pro",
      messages: data.messages,
      temperature: data.temperature ?? 0.3,
    };
    if (data.maxTokens) body.max_tokens = data.maxTokens;
    if (data.responseFormat === "json_object") {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch("https://api.ai.it.ufl.edu/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`NaviGator API error [${res.status}]: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
    };
    const choice = json.choices?.[0];
    const content = choice?.message?.content ?? "";
    if (!content) {
      console.warn("NaviGator returned empty content", {
        finish_reason: choice?.finish_reason,
        raw: JSON.stringify(json).slice(0, 500),
      });
    }
    return { content };
  });
