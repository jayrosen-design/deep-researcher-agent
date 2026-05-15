import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { PromptInput } from "@/components/research/PromptInput";
import {
  ProgressTracker,
  type Phase,
  type PhaseStatus,
} from "@/components/research/ProgressTracker";
import { ReportView } from "@/components/research/ReportView";
import { SourcesPanel } from "@/components/research/SourcesPanel";
import { navigatorChat } from "@/lib/navigator-chat.functions";
import { webSearch, type SearchResult } from "@/lib/web-search.functions";
import {
  PLANNER_SYSTEM_PROMPT,
  SYNTHESIS_SYSTEM_PROMPT,
  buildSynthesisUserPrompt,
} from "@/lib/research-prompts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deep Research — Autonomous AI research assistant" },
      {
        name: "description",
        content:
          "Ask any question. An autonomous agent plans, searches the web, and writes a fully cited Markdown report.",
      },
    ],
  }),
  component: Index,
});

type PhaseKey = "plan" | "search" | "synthesize";
type ContextBlock = { query: string; results: SearchResult[] };

type State = {
  prompt: string | null;
  plan: string[] | null;
  context: ContextBlock[] | null;
  report: string | null;
  currentSearchQuery: string | null;
  statuses: Record<PhaseKey, PhaseStatus>;
  errors: Partial<Record<PhaseKey, string>>;
};

const INITIAL: State = {
  prompt: null,
  plan: null,
  context: null,
  report: null,
  currentSearchQuery: null,
  statuses: { plan: "pending", search: "pending", synthesize: "pending" },
  errors: {},
};

function parsePlan(raw: string): string[] {
  // Strip code fences if present
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : parsed.queries;
    if (!Array.isArray(arr)) throw new Error("not an array");
    const queries = arr
      .map((q) => (typeof q === "string" ? q.trim() : ""))
      .filter(Boolean)
      .slice(0, 5);
    if (queries.length === 0) throw new Error("empty");
    return queries;
  } catch {
    throw new Error("Planner did not return a valid JSON array of queries.");
  }
}

function Index() {
  const [state, setState] = useState<State>(INITIAL);

  const setStatus = useCallback((key: PhaseKey, status: PhaseStatus, error?: string) => {
    setState((s) => ({
      ...s,
      statuses: { ...s.statuses, [key]: status },
      errors: { ...s.errors, [key]: error },
    }));
  }, []);

  const runPlan = useCallback(
    async (prompt: string): Promise<string[] | null> => {
      setStatus("plan", "active");
      try {
        const { content } = await navigatorChat({
          data: {
            messages: [
              { role: "system", content: PLANNER_SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            responseFormat: "json_object",
          },
        });
        const queries = parsePlan(content);
        setState((s) => ({ ...s, plan: queries }));
        setStatus("plan", "done");
        return queries;
      } catch (e) {
        setStatus("plan", "error", e instanceof Error ? e.message : String(e));
        return null;
      }
    },
    [setStatus],
  );

  const runSearch = useCallback(
    async (queries: string[]): Promise<ContextBlock[] | null> => {
      setStatus("search", "active");
      const blocks: ContextBlock[] = [];
      try {
        for (const query of queries) {
          setState((s) => ({ ...s, currentSearchQuery: query }));
          const { results } = await webSearch({ data: { query } });
          blocks.push({ query, results });
        }
        setState((s) => ({ ...s, context: blocks, currentSearchQuery: null }));
        setStatus("search", "done");
        return blocks;
      } catch (e) {
        setState((s) => ({ ...s, currentSearchQuery: null }));
        setStatus("search", "error", e instanceof Error ? e.message : String(e));
        return null;
      }
    },
    [setStatus],
  );

  const runSynthesis = useCallback(
    async (prompt: string, context: ContextBlock[]): Promise<void> => {
      setStatus("synthesize", "active");
      try {
        const { content } = await navigatorChat({
          data: {
            messages: [
              { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
              { role: "user", content: buildSynthesisUserPrompt(prompt, context) },
            ],
            temperature: 0.4,
          },
        });
        setState((s) => ({ ...s, report: content }));
        setStatus("synthesize", "done");
      } catch (e) {
        setStatus("synthesize", "error", e instanceof Error ? e.message : String(e));
      }
    },
    [setStatus],
  );

  const runPipeline = useCallback(
    async (prompt: string) => {
      const queries = await runPlan(prompt);
      if (!queries) return;
      const blocks = await runSearch(queries);
      if (!blocks) return;
      await runSynthesis(prompt, blocks);
    },
    [runPlan, runSearch, runSynthesis],
  );

  const handleStart = useCallback(
    (prompt: string) => {
      setState({ ...INITIAL, prompt });
      void runPipeline(prompt);
    },
    [runPipeline],
  );

  const handleRetry = useCallback(
    async (key: string) => {
      const prompt = state.prompt;
      if (!prompt) return;
      if (key === "plan") {
        const queries = await runPlan(prompt);
        if (!queries) return;
        const blocks = await runSearch(queries);
        if (!blocks) return;
        await runSynthesis(prompt, blocks);
      } else if (key === "search" && state.plan) {
        const blocks = await runSearch(state.plan);
        if (!blocks) return;
        await runSynthesis(prompt, blocks);
      } else if (key === "synthesize" && state.context) {
        await runSynthesis(prompt, state.context);
      }
    },
    [state.prompt, state.plan, state.context, runPlan, runSearch, runSynthesis],
  );

  const handleReset = useCallback(() => setState(INITIAL), []);

  const phases: Phase[] = useMemo(() => {
    const planDetail =
      state.statuses.plan === "done" && state.plan
        ? `${state.plan.length} queries planned`
        : state.errors.plan;

    let searchDetail: string | undefined;
    if (state.statuses.search === "active" && state.currentSearchQuery) {
      searchDetail = `Searching: "${state.currentSearchQuery}"`;
    } else if (state.statuses.search === "done" && state.context) {
      const total = state.context.reduce((n, b) => n + b.results.length, 0);
      searchDetail = `${total} sources gathered`;
    } else if (state.errors.search) {
      searchDetail = state.errors.search;
    }

    return [
      { key: "plan", label: "Drafting research plan", status: state.statuses.plan, detail: planDetail },
      { key: "search", label: "Searching the web", status: state.statuses.search, detail: searchDetail },
      {
        key: "synthesize",
        label: "Synthesizing final report",
        status: state.statuses.synthesize,
        detail: state.errors.synthesize,
      },
    ];
  }, [state]);

  const allSources: SearchResult[] = useMemo(
    () => state.context?.flatMap((b) => b.results) ?? [],
    [state.context],
  );

  if (!state.prompt) {
    return <PromptInput onSubmit={handleStart} />;
  }

  const isDone = state.statuses.synthesize === "done" && state.report;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Research
          </div>
          <h1 className="mt-1 text-xl font-semibold leading-snug text-foreground">
            {state.prompt}
          </h1>
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
          <ProgressTracker phases={phases} onRetry={handleRetry} />
          {state.plan && state.statuses.plan === "done" && (
            <div className="mt-6 border-t border-border pt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Plan
              </div>
              <ul className="space-y-1.5 text-sm text-foreground">
                {state.plan.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {isDone && state.report && (
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-8">
            <ReportView markdown={state.report} />
          </section>
          <SourcesPanel sources={allSources} />
        </div>
      )}
    </div>
  );
}
