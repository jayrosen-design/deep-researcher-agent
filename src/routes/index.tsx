import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { PromptInput } from "@/components/research/PromptInput";
import { AgentTrace, type TraceStep } from "@/components/research/AgentTrace";
import { ReportView } from "@/components/research/ReportView";
import { SourcesPanel } from "@/components/research/SourcesPanel";
import { navigatorChat } from "@/lib/navigator-chat.functions";
import { webSearch, type SearchResult } from "@/lib/web-search.functions";
import { readUrl } from "@/lib/read-url.functions";
import {
  AGENT_SYSTEM_PROMPT,
  buildBudgetWarning,
  buildInitialUserMessage,
  buildReadObservation,
  buildSearchObservation,
} from "@/lib/agent-prompts";
import { DEFAULT_MODEL, type NavigatorModel } from "@/lib/models";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deep Research — Autonomous AI research assistant" },
      {
        name: "description",
        content:
          "Ask any question. An autonomous ReAct agent plans, searches, reads sources, and writes a fully cited Markdown report.",
      },
    ],
  }),
  component: Index,
});

const MAX_STEPS = 10;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type AgentAction =
  | { tool: "web_search"; args: { query: string } }
  | { tool: "read_url"; args: { url: string } }
  | { tool: "finish"; args: { report: string } };

type AgentTurn = { thought: string; action: AgentAction };

function stripFences(s: string): string {
  const t = s.trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : t).trim();
}

function parseTurn(raw: string): AgentTurn {
  const text = stripFences(raw);
  // Try direct parse; fall back to extracting first {...} block.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Agent did not return JSON.");
    parsed = JSON.parse(text.slice(start, end + 1));
  }
  if (typeof parsed !== "object" || parsed === null) throw new Error("Bad agent JSON.");
  const obj = parsed as Record<string, unknown>;
  const thought = typeof obj.thought === "string" ? obj.thought : "";
  const action = obj.action as { tool?: string; args?: Record<string, unknown> } | undefined;
  if (!action || typeof action.tool !== "string") throw new Error("Missing action.tool.");
  const args = action.args ?? {};
  if (action.tool === "web_search" && typeof args.query === "string") {
    return { thought, action: { tool: "web_search", args: { query: args.query } } };
  }
  if (action.tool === "read_url" && typeof args.url === "string") {
    return { thought, action: { tool: "read_url", args: { url: args.url } } };
  }
  if (action.tool === "finish" && typeof args.report === "string") {
    return { thought, action: { tool: "finish", args: { report: args.report } } };
  }
  throw new Error(`Unknown or invalid tool: ${action.tool}`);
}

function Index() {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [model, setModel] = useState<NavigatorModel>(DEFAULT_MODEL);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [running, setRunning] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const cancelled = useRef(false);

  const appendStep = useCallback((step: TraceStep) => {
    setTrace((t) => [...t, step]);
  }, []);

  const updateLastStep = useCallback((updater: (s: TraceStep) => TraceStep) => {
    setTrace((t) => {
      if (t.length === 0) return t;
      const copy = t.slice();
      copy[copy.length - 1] = updater(copy[copy.length - 1]);
      return copy;
    });
  }, []);

  const runAgent = useCallback(
    async (userQuery: string) => {
      cancelled.current = false;
      setRunning(true);
      setFatalError(null);
      setReport(null);
      setSources([]);
      setTrace([]);

      const messages: ChatMessage[] = [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        { role: "user", content: buildInitialUserMessage(userQuery, MAX_STEPS) },
      ];
      const seenUrls = new Set<string>();
      const collectedSources: SearchResult[] = [];
      let stepsUsed = 0;

      try {
        for (let i = 0; i < MAX_STEPS + 1; i++) {
          if (cancelled.current) return;

          const { content } = await navigatorChat({
            data: { model, messages, temperature: 0.2, responseFormat: "json_object" },
          });

          let turn: AgentTurn;
          try {
            turn = parseTurn(content);
          } catch (e) {
            // Nudge the model to fix its output and retry once.
            messages.push({ role: "assistant", content });
            messages.push({
              role: "user",
              content: `System: Your previous response was not valid JSON in the required format (${
                e instanceof Error ? e.message : String(e)
              }). Respond again with a single JSON object only.`,
            });
            continue;
          }

          messages.push({ role: "assistant", content });

          if (turn.thought) appendStep({ kind: "thought", text: turn.thought });

          if (turn.action.tool === "finish") {
            appendStep({ kind: "finish", status: "active" });
            setReport(turn.action.args.report);
            setSources(collectedSources);
            updateLastStep(() => ({ kind: "finish", status: "done" }));
            return;
          }

          // Tool step — counts against budget.
          stepsUsed += 1;
          const remaining = MAX_STEPS - stepsUsed;

          if (turn.action.tool === "web_search") {
            const query = turn.action.args.query;
            appendStep({ kind: "search", query, status: "active" });
            try {
              const { results } = await webSearch({ data: { query } });
              for (const r of results) {
                if (!seenUrls.has(r.url)) {
                  seenUrls.add(r.url);
                  collectedSources.push(r);
                }
              }
              updateLastStep(() => ({
                kind: "search",
                query,
                status: "done",
                resultCount: results.length,
              }));
              messages.push({
                role: "user",
                content:
                  buildSearchObservation(query, results) +
                  "\n\n" +
                  buildBudgetWarning(remaining),
              });
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              updateLastStep(() => ({ kind: "search", query, status: "error", error: msg }));
              messages.push({
                role: "user",
                content: `Observation (web_search "${query}"): ERROR — ${msg}\n\n${buildBudgetWarning(remaining)}`,
              });
            }
          } else if (turn.action.tool === "read_url") {
            const url = turn.action.args.url;
            appendStep({ kind: "read", url, status: "active" });
            try {
              const page = await readUrl({ data: { url } });
              updateLastStep(() => ({
                kind: "read",
                url,
                status: "done",
                chars: page.content.length,
              }));
              messages.push({
                role: "user",
                content:
                  buildReadObservation(page.url, page.content) +
                  "\n\n" +
                  buildBudgetWarning(remaining),
              });
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              updateLastStep(() => ({ kind: "read", url, status: "error", error: msg }));
              messages.push({
                role: "user",
                content: `Observation (read_url ${url}): ERROR — ${msg}\n\n${buildBudgetWarning(remaining)}`,
              });
            }
          }

          if (remaining <= 0) {
            // Force a final finish call on the next iteration.
            messages.push({
              role: "user",
              content: buildBudgetWarning(0),
            });
          }
        }

        // Loop exited without finish — synthesize fallback message.
        setFatalError(
          "Agent did not produce a final report within the step budget. Try again or pick a more focused query.",
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        appendStep({ kind: "error", message: msg });
        setFatalError(msg);
      } finally {
        setRunning(false);
      }
    },
    [model, appendStep, updateLastStep],
  );

  const handleStart = useCallback(
    (q: string) => {
      setPrompt(q);
      void runAgent(q);
    },
    [runAgent],
  );

  const handleReset = useCallback(() => {
    cancelled.current = true;
    setPrompt(null);
    setTrace([]);
    setReport(null);
    setSources([]);
    setFatalError(null);
    setRunning(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (prompt) void runAgent(prompt);
  }, [prompt, runAgent]);

  const isDone = useMemo(() => !running && !!report, [running, report]);

  if (!prompt) {
    return <PromptInput onSubmit={handleStart} model={model} onModelChange={setModel} />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Research
          </div>
          <h1 className="mt-1 text-xl font-semibold leading-snug text-foreground">{prompt}</h1>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          <RotateCcw className="size-3.5" />
          New research
        </button>
      </header>

      {!isDone && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Agent trace
            </div>
            <div className="text-xs text-muted-foreground">
              {running ? "Working…" : fatalError ? "Stopped" : "Idle"} · max {MAX_STEPS} steps
            </div>
          </div>
          {trace.length === 0 && running && (
            <div className="text-sm text-muted-foreground">Thinking…</div>
          )}
          <AgentTrace steps={trace} />
          {fatalError && (
            <div className="mt-6 border-t border-border pt-4">
              <div className="text-sm text-destructive">{fatalError}</div>
              <button
                onClick={handleRetry}
                className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                Retry research
              </button>
            </div>
          )}
        </section>
      )}

      {isDone && report && (
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-8">
            <ReportView markdown={report} />
          </section>
          {trace.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Agent trace
              </div>
              <AgentTrace steps={trace} />
            </section>
          )}
          <SourcesPanel sources={sources} />
        </div>
      )}
    </div>
  );
}
