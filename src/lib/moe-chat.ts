import { navigatorChat } from "./navigator-chat.functions";
import type { UserSettings } from "./user-settings";
import {
  MOE_EXPERT_IDS,
  MOE_EXPERT_LABELS,
  MOE_EXPERT_REACTION_INSTRUCTIONS,
  buildExpertContextBlock,
  buildExpertReactionUserMessage,
  buildExpertUserMessage,
  buildModeratorUserMessage,
  buildRouterUserMessage,
  isMoeExpertId,
  type ExpertAnswer,
  type ExpertReaction,
  type MoeExpertId,
  type RouterRoute,
} from "./moe-prompts";
import type { SearchResult } from "./web-search.functions";

export type MoeDoc = {
  id: string;
  title: string;
  prompt: string;
  report: string;
  sources: SearchResult[];
};

export type MoeMode = "single" | "auto" | "panel";

export type MoeTurnResult = {
  selectedExperts: RouterRoute[];
  expertAnswers: ExpertAnswer[];
  failures: Array<{ expertId: MoeExpertId; error: string }>;
  synthesis: string;
};

function mergeDocs(docs: MoeDoc[]): {
  originalQuery: string;
  compiledReport: string;
  sources: SearchResult[];
} {
  if (docs.length === 1) {
    return {
      originalQuery: docs[0].prompt,
      compiledReport: docs[0].report,
      sources: docs[0].sources,
    };
  }
  const queries = docs.map((d) => `- ${d.title}: ${d.prompt}`).join("\n");
  const reports = docs
    .map((d) => `===== ${d.title} =====\n${d.report}`)
    .join("\n\n");
  const sourceMap = new Map<string, SearchResult>();
  for (const d of docs) for (const s of d.sources) if (!sourceMap.has(s.url)) sourceMap.set(s.url, s);
  return {
    originalQuery: `Combined across ${docs.length} reports:\n${queries}`,
    compiledReport: reports,
    sources: Array.from(sourceMap.values()),
  };
}

function tryParseJson<T = unknown>(raw: string): T | null {
  // Strip code fences if present.
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract first JSON object.
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

export async function routeExperts(args: {
  question: string;
  docs: MoeDoc[];
  settings: UserSettings;
  preferredExpertId?: MoeExpertId;
  conversationHistory?: string;
}): Promise<RouterRoute[]> {
  const merged = mergeDocs(args.docs);
  const context = buildExpertContextBlock(merged);
  const userMsg = buildRouterUserMessage({
    context,
    userQuestion: args.question,
    preferredExpertId: args.preferredExpertId,
    conversationHistory: args.conversationHistory,
  });

  try {
    const { content } = await navigatorChat({
      data: {
        model: args.settings.moeRouterModel || args.settings.synthesisModel,
        temperature: 0.2,
        maxTokens: 800,
        responseFormat: "json_object",
        apiKey: args.settings.navigatorApiKey || undefined,
        messages: [
          { role: "system", content: args.settings.moeRouterPrompt },
          { role: "user", content: userMsg },
        ],
      },
    });
    const parsed = tryParseJson<{ routes?: unknown }>(content);
    const routesRaw = Array.isArray(parsed?.routes) ? parsed!.routes : [];
    const routes: RouterRoute[] = [];
    for (const r of routesRaw) {
      if (!r || typeof r !== "object") continue;
      const o = r as Record<string, unknown>;
      if (!isMoeExpertId(o.expertId)) continue;
      routes.push({
        expertId: o.expertId,
        reason: typeof o.reason === "string" ? o.reason : "",
        priority: typeof o.priority === "number" ? o.priority : routes.length + 1,
      });
    }
    if (routes.length === 0) throw new Error("Router returned no valid experts");
    // Dedupe by expertId, keep first.
    const seen = new Set<string>();
    return routes.filter((r) => (seen.has(r.expertId) ? false : (seen.add(r.expertId), true)));
  } catch (e) {
    // Fallback: preferred expert or researcher.
    const fallback = args.preferredExpertId ?? "researcher";
    return [
      {
        expertId: fallback,
        reason: `Router unavailable (${e instanceof Error ? e.message : String(e)}). Falling back to ${MOE_EXPERT_LABELS[fallback]}.`,
        priority: 1,
      },
    ];
  }
}

export async function askExpert(args: {
  expertId: MoeExpertId;
  question: string;
  docs: MoeDoc[];
  settings: UserSettings;
  conversationHistory?: string;
}): Promise<ExpertAnswer> {
  const merged = mergeDocs(args.docs);
  const context = buildExpertContextBlock(merged);
  const personaCfg = args.settings.personaChat[args.expertId];
  const system = `${args.settings.personaChatBasePrompt}

${personaCfg.systemPrompt}

${args.settings.moeExpertPrompt}`;

  const userMsg = buildExpertUserMessage({
    expertId: args.expertId,
    context,
    userQuestion: args.question,
    conversationHistory: args.conversationHistory,
  });

  const { content } = await navigatorChat({
    data: {
      model: personaCfg.model || args.settings.synthesisModel,
      temperature: 0.3,
      maxTokens: 1200,
      responseFormat: "json_object",
      apiKey: args.settings.navigatorApiKey || undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    },
  });

  const parsed = tryParseJson<Partial<ExpertAnswer>>(content);
  if (parsed && typeof parsed.answer === "string" && parsed.answer.trim()) {
    const conf = parsed.confidence;
    return {
      expertId: args.expertId,
      answer: parsed.answer.trim(),
      confidence: conf === "high" || conf === "medium" || conf === "low" ? conf : "medium",
      evidenceUsed: Array.isArray(parsed.evidenceUsed)
        ? parsed.evidenceUsed.filter((x): x is string => typeof x === "string")
        : [],
      missingEvidence: Array.isArray(parsed.missingEvidence)
        ? parsed.missingEvidence.filter((x): x is string => typeof x === "string")
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((x): x is string => typeof x === "string")
        : [],
    };
  }
  // Fallback: wrap raw text.
  return {
    expertId: args.expertId,
    answer: content.trim(),
    confidence: "low",
    evidenceUsed: [],
    missingEvidence: ["Response could not be parsed as structured JSON."],
    recommendations: [],
  };
}

export async function synthesizePanel(args: {
  question: string;
  docs: MoeDoc[];
  expertAnswers: ExpertAnswer[];
  settings: UserSettings;
  discussionAnswers?: ExpertReaction[];
  conversationHistory?: string;
}): Promise<string> {
  const merged = mergeDocs(args.docs);
  const context = buildExpertContextBlock(merged);
  const userMsg = buildModeratorUserMessage({
    context,
    userQuestion: args.question,
    expertAnswers: args.expertAnswers,
    discussionAnswers: args.discussionAnswers,
    conversationHistory: args.conversationHistory,
  });

  const { content } = await navigatorChat({
    data: {
      model: args.settings.moeModeratorModel || args.settings.synthesisModel,
      temperature: 0.3,
      maxTokens: 4000,
      apiKey: args.settings.navigatorApiKey || undefined,
      messages: [
        { role: "system", content: args.settings.moeModeratorPrompt },
        { role: "user", content: userMsg },
      ],
    },
  });
  return content.trim();
}

export async function runMoeTurn(args: {
  mode: Exclude<MoeMode, "single">;
  question: string;
  docs: MoeDoc[];
  settings: UserSettings;
  preferredExpertId?: MoeExpertId;
  // For panel mode, caller provides experts directly; for auto, router decides.
  panelExperts?: MoeExpertId[];
  onStage?: (stage: "routing" | "consulting" | "synthesizing") => void;
}): Promise<MoeTurnResult> {
  let selectedExperts: RouterRoute[];

  if (args.mode === "panel") {
    const list = (args.panelExperts ?? []).filter((id) => MOE_EXPERT_IDS.includes(id));
    if (list.length === 0) throw new Error("No experts selected for the panel.");
    selectedExperts = list.map((id, i) => ({
      expertId: id,
      reason: "Selected by user for expert panel.",
      priority: i + 1,
    }));
  } else {
    args.onStage?.("routing");
    selectedExperts = await routeExperts({
      question: args.question,
      docs: args.docs,
      settings: args.settings,
      preferredExpertId: args.preferredExpertId,
    });
  }

  args.onStage?.("consulting");
  const results = await Promise.allSettled(
    selectedExperts.map((r) =>
      askExpert({
        expertId: r.expertId,
        question: args.question,
        docs: args.docs,
        settings: args.settings,
      }),
    ),
  );

  const expertAnswers: ExpertAnswer[] = [];
  const failures: Array<{ expertId: MoeExpertId; error: string }> = [];
  results.forEach((res, i) => {
    const eid = selectedExperts[i].expertId;
    if (res.status === "fulfilled") expertAnswers.push(res.value);
    else failures.push({ expertId: eid, error: res.reason instanceof Error ? res.reason.message : String(res.reason) });
  });

  if (expertAnswers.length === 0) {
    throw new Error(
      `All experts failed: ${failures.map((f) => `${MOE_EXPERT_LABELS[f.expertId]} (${f.error})`).join("; ")}`,
    );
  }

  let synthesis = "";
  // Synthesize when we have multiple experts, OR when auto-routed.
  if (expertAnswers.length > 1 || args.mode === "panel") {
    args.onStage?.("synthesizing");
    synthesis = await synthesizePanel({
      question: args.question,
      docs: args.docs,
      expertAnswers,
      settings: args.settings,
    });
  } else {
    // Single auto-routed expert: use its answer directly as the "synthesis".
    synthesis = expertAnswers[0].answer;
  }

  return { selectedExperts, expertAnswers, failures, synthesis };
}

// ------------------------- Streaming group-chat orchestration -------------------------

const MOE_TOTAL_ROUNDS = 4;

export async function askExpertReaction(args: {
  expertId: MoeExpertId;
  round: number;
  question: string;
  otherMessages: Array<{ expertId: MoeExpertId; content: string }>;
  settings: UserSettings;
  conversationHistory?: string;
}): Promise<ExpertReaction> {
  const personaCfg = args.settings.personaChat[args.expertId];
  const system = `${args.settings.personaChatBasePrompt}

${personaCfg.systemPrompt}

${MOE_EXPERT_REACTION_INSTRUCTIONS}`;

  const userMsg = buildExpertReactionUserMessage({
    expertId: args.expertId,
    round: args.round,
    userQuestion: args.question,
    otherMessages: args.otherMessages,
    conversationHistory: args.conversationHistory,
  });

  const { content } = await navigatorChat({
    data: {
      model: personaCfg.model || args.settings.synthesisModel,
      temperature: 0.5,
      maxTokens: 400,
      apiKey: args.settings.navigatorApiKey || undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    },
  });

  return { expertId: args.expertId, round: args.round, content: content.trim() };
}

export type MoeStreamEvent =
  | { type: "routed"; selectedExperts: RouterRoute[] }
  | { type: "stage"; stage: "round1" | "round2" | "round3" | "round4" | "moderator" }
  | { type: "expertAnswer"; round: 1; answer: ExpertAnswer }
  | { type: "expertFailed"; round: 1 | 2 | 3 | 4; expertId: MoeExpertId; error: string }
  | { type: "reactionAnswer"; round: 2 | 3 | 4; reaction: ExpertReaction }
  | { type: "moderatorStart" }
  | { type: "moderatorDelta"; text: string }
  | { type: "moderatorDone"; fullText: string };

export async function streamModeratorSynthesis(args: {
  question: string;
  docs: MoeDoc[];
  expertAnswers: ExpertAnswer[];
  discussionAnswers: ExpertReaction[];
  settings: UserSettings;
  onDelta: (text: string) => void;
  conversationHistory?: string;
}): Promise<string> {
  const merged = mergeDocs(args.docs);
  const context = buildExpertContextBlock(merged);
  const userMsg = buildModeratorUserMessage({
    context,
    userQuestion: args.question,
    expertAnswers: args.expertAnswers,
    discussionAnswers: args.discussionAnswers,
    conversationHistory: args.conversationHistory,
  });

  const res = await fetch("/api/navigator-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: args.settings.moeModeratorModel || args.settings.synthesisModel,
      temperature: 0.3,
      maxTokens: 4000,
      apiKey: args.settings.navigatorApiKey || undefined,
      messages: [
        { role: "system", content: args.settings.moeModeratorPrompt },
        { role: "user", content: userMsg },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Moderator stream failed [${res.status}]: ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

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
      try {
        const evt = JSON.parse(payload) as { text?: string; done?: boolean; error?: string };
        if (evt.error) throw new Error(evt.error);
        if (evt.text) {
          full += evt.text;
          args.onDelta(evt.text);
        }
      } catch (e) {
        if (e instanceof Error && e.message && !e.message.includes("JSON")) throw e;
      }
    }
  }

  return full;
}

export async function runMoeTurnStreaming(args: {
  mode: Exclude<MoeMode, "single">;
  question: string;
  docs: MoeDoc[];
  settings: UserSettings;
  preferredExpertId?: MoeExpertId;
  panelExperts?: MoeExpertId[];
  onEvent: (e: MoeStreamEvent) => void;
}): Promise<void> {
  let selectedExperts: RouterRoute[];

  if (args.mode === "panel") {
    const list = (args.panelExperts ?? []).filter((id) => MOE_EXPERT_IDS.includes(id));
    if (list.length === 0) throw new Error("No experts selected for the panel.");
    selectedExperts = list.map((id, i) => ({
      expertId: id,
      reason: "Selected by user for expert panel.",
      priority: i + 1,
    }));
  } else {
    selectedExperts = await routeExperts({
      question: args.question,
      docs: args.docs,
      settings: args.settings,
      preferredExpertId: args.preferredExpertId,
    });
  }

  args.onEvent({ type: "routed", selectedExperts });
  args.onEvent({ type: "stage", stage: "round1" });

  const round1Answers: ExpertAnswer[] = [];
  await Promise.all(
    selectedExperts.map(async (r) => {
      try {
        const ans = await askExpert({
          expertId: r.expertId,
          question: args.question,
          docs: args.docs,
          settings: args.settings,
        });
        round1Answers.push(ans);
        args.onEvent({ type: "expertAnswer", round: 1, answer: ans });
      } catch (e) {
        args.onEvent({
          type: "expertFailed",
          round: 1,
          expertId: r.expertId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }),
  );

  if (round1Answers.length === 0) {
    throw new Error("All experts failed in round 1.");
  }

  const reactions: ExpertReaction[] = [];
  if (round1Answers.length > 1) {
    args.onEvent({ type: "stage", stage: "round2" });
    await Promise.all(
      round1Answers.map(async (a) => {
        try {
          const r = await askExpertReaction({
            expertId: a.expertId,
            question: args.question,
            otherAnswers: round1Answers,
            settings: args.settings,
          });
          reactions.push(r);
          args.onEvent({ type: "reactionAnswer", round: 2, reaction: r });
        } catch (e) {
          args.onEvent({
            type: "expertFailed",
            round: 2,
            expertId: a.expertId,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }),
    );
  }

  args.onEvent({ type: "stage", stage: "moderator" });
  args.onEvent({ type: "moderatorStart" });

  if (round1Answers.length === 1) {
    const text = round1Answers[0].answer;
    args.onEvent({ type: "moderatorDelta", text });
    args.onEvent({ type: "moderatorDone", fullText: text });
    return;
  }

  const fullText = await streamModeratorSynthesis({
    question: args.question,
    docs: args.docs,
    expertAnswers: round1Answers,
    reactionAnswers: reactions,
    settings: args.settings,
    onDelta: (t) => args.onEvent({ type: "moderatorDelta", text: t }),
  });
  args.onEvent({ type: "moderatorDone", fullText });
}

