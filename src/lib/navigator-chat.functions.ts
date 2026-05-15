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
});

export const navigatorChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = data.apiKey || process.env.UF_NAVIGATOR_API_KEY;
    if (!apiKey) throw new Error("NaviGator API key not configured. Add one in Settings.");

    const body: Record<string, unknown> = {
      model: data.model ?? "gemini-1.5-pro",
      messages: data.messages,
      temperature: data.temperature ?? 0.3,
    };
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
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("NaviGator returned no content");
    return { content };
  });
