import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogOut, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { PromptInput } from "@/components/research/PromptInput";
import { PasswordGate } from "@/components/research/PasswordGate";
import { PlanReview } from "@/components/research/PlanReview";
import { AgentTrace, type TraceStep } from "@/components/research/AgentTrace";
import { ProgressTracker, type Phase } from "@/components/research/ProgressTracker";
import { WorkflowStepper, type WorkflowStep } from "@/components/research/WorkflowStepper";
import { Disclaimer } from "@/components/research/Disclaimer";
import { ReportView } from "@/components/research/ReportView";
import { SourcesPanel } from "@/components/research/SourcesPanel";
import { navigatorChat } from "@/lib/navigator-chat.functions";
import { webSearch, type SearchResult } from "@/lib/web-search.functions";
import { readUrl } from "@/lib/read-url.functions";
import {
  AGENT_SYSTEM_PROMPT,
  SYNTHESIS_SYSTEM_PROMPT,
  buildBudgetWarning,
  buildInitialUserMessage,
  buildReadObservation,
  buildSearchObservation,
  buildStepCounter,
  buildSynthesisUserMessage,
  type SynthesisSource,
} from "@/lib/agent-prompts";
import {
  PLAN_SYSTEM_PROMPT,
  buildAgentPlanContext,
  buildPlanRevisionMessage,
  buildPlanUserMessage,
} from "@/lib/plan-prompts";
import { type NavigatorModel } from "@/lib/models";
import { isAuthed, setAuthed } from "@/lib/auth";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  type UserSettings,
} from "@/lib/user-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deep Researcher Agent — Autonomous AI research assistant" },
      {
        name: "description",
        content:
          "Ask any question. An autonomous ReAct agent plans, searches, reads sources, and writes a fully cited Markdown report.",
      },
    ],
  }),
  component: Index,
});

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type AgentAction =
  | {
      tool: "web_search";
      args: {
        query: string;
        timeRange?: "day" | "week" | "month" | "year";
        includeDomains?: string[];
      };
    }
  | { tool: "read_url"; args: { url: string } }
  | { tool: "finish"; args: Record<string, unknown> };

type AgentTurn = { thought: string; action: AgentAction };

function stripFences(s: string): string {
  const t = s.trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : t).trim();
}

const ALLOWED_TIME_RANGES = ["day", "week", "month", "year"] as const;

function parseTurn(raw: string): AgentTurn {
  const text = stripFences(raw);
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
    const rawTime = args.time_range ?? args.timeRange;
    const timeRange =
      typeof rawTime === "string" && (ALLOWED_TIME_RANGES as readonly string[]).includes(rawTime)
        ? (rawTime as (typeof ALLOWED_TIME_RANGES)[number])
        : undefined;
    const rawDomains = args.include_domains ?? args.includeDomains;
    const includeDomains = Array.isArray(rawDomains)
      ? rawDomains.filter((d): d is string => typeof d === "string" && d.length > 0).slice(0, 20)
      : undefined;
    return {
      thought,
      action: {
        tool: "web_search",
        args: {
          query: args.query,
          ...(timeRange ? { timeRange } : {}),
          ...(includeDomains && includeDomains.length > 0 ? { includeDomains } : {}),
        },
      },
    };
  }
  if (action.tool === "read_url" && typeof args.url === "string") {
    return { thought, action: { tool: "read_url", args: { url: args.url } } };
  }
  if (action.tool === "finish") {
    return { thought, action: { tool: "finish", args } };
  }
  throw new Error(`Unknown or invalid tool: ${action.tool}`);
}

function Index() {
  const [authed, setAuthedState] = useState(false);
  useEffect(() => {
    setAuthedState(isAuthed());
  }, []);

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const [prompt, setPrompt] = useState<string | null>(null);
  const [phase, setPhase] = useState<"input" | "plan" | "research">("input");
  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  // Investigator + synthesizer models come from settings (split-model).
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [running, setRunning] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const cancelled = useRef(false);

  const handleSignOut = useCallback(() => {
    setAuthed(false);
    setAuthedState(false);
    setPrompt(null);
    setPhase("input");
    setPlan(null);
    setPlanError(null);
    setPlanLoading(false);
    setTrace([]);
    setReport(null);
    setSources([]);
    setFatalError(null);
    cancelled.current = true;
  }, []);

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
    async (userQuery: string, approvedPlan?: string | null) => {
      cancelled.current = false;
      setRunning(true);
      setFatalError(null);
      setReport(null);
      setSources([]);
      setTrace([]);

      const maxSources = settings.maxSources;
      // Step budget scales with desired source count but stays reasonable.
      const maxSteps = Math.max(8, Math.ceil(maxSources * 1.5));
      const navigatorKey = settings.navigatorApiKey || undefined;
      const tavilyKey = settings.tavilyApiKey || undefined;

      const initialUser = approvedPlan
        ? `${buildInitialUserMessage(userQuery, maxSteps)}\n\n${buildAgentPlanContext(approvedPlan)}`
        : buildInitialUserMessage(userQuery, maxSteps);

      const messages: ChatMessage[] = [
        { role: "system", content: settings.agentSystemPrompt || AGENT_SYSTEM_PROMPT },
        { role: "user", content: initialUser },
      ];

      const seenUrls = new Set<string>();
      const collectedSources: SearchResult[] = [];
      const readPages: SynthesisSource[] = [];
      let stepsUsed = 0;
      let sourceCapNotified = false;

      try {
        for (let i = 0; i < maxSteps + 1; i++) {
          if (cancelled.current) return;

          // Inject dynamic step counter so the LLM tracks its remaining budget.
          const counterMsg: ChatMessage = {
            role: "user",
            content: buildStepCounter(stepsUsed + 1, maxSteps),
          };

          const { content } = await navigatorChat({
            data: {
              model: settings.investigatorModel,
              messages: [...messages, counterMsg],
              temperature: 0.2,
              responseFormat: "json_object",
              apiKey: navigatorKey,
            },
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
            const readCount = readPages.length;
            const minOk = collectedSources.length > 0 && stepsUsed >= 2 && readCount >= 1;
            const outOfBudget = stepsUsed >= maxSteps;
            if (!minOk && !outOfBudget) {
              messages.push({
                role: "user",
                content: `System: REJECTED. You attempted to finish without doing real research (tool steps so far: ${stepsUsed}, sources gathered: ${collectedSources.length}, pages read: ${readCount}). You MUST call web_search at least 2 times AND read_url at least once before finishing. Continue researching now.`,
              });
              appendStep({
                kind: "error",
                message: "Agent tried to finish without researching — forcing it to keep going.",
              });
              continue;
            }
            // Hand off to dedicated synthesizer.
            appendStep({ kind: "finish", status: "active" });
            setSources(collectedSources);
            const synthesisMessages: ChatMessage[] = [
              { role: "system", content: settings.synthesisSystemPrompt || SYNTHESIS_SYSTEM_PROMPT },

              {
                role: "user",
                content: buildSynthesisUserMessage(
                  userQuery,
                  approvedPlan ?? null,
                  collectedSources,
                  readPages,
                ),
              },
            ];
            const { content: reportMd } = await navigatorChat({
              data: {
                model: settings.synthesisModel,
                messages: synthesisMessages,
                temperature: 0.3,
                apiKey: navigatorKey,
              },
            });
            if (cancelled.current) return;
            setReport(reportMd.trim());
            updateLastStep(() => ({ kind: "finish", status: "done" }));
            return;
          }

          // Tool step — counts against budget.
          stepsUsed += 1;
          const remaining = maxSteps - stepsUsed;

          if (turn.action.tool === "web_search") {
            const { query, timeRange, includeDomains } = turn.action.args;
            appendStep({ kind: "search", query, status: "active" });
            try {
              const remainingCap = Math.max(1, maxSources - collectedSources.length);
              const requestSize = Math.min(10, Math.max(3, remainingCap));
              const { results } = await webSearch({
                data: {
                  query,
                  apiKey: tavilyKey,
                  maxResults: requestSize,
                  ...(timeRange ? { timeRange } : {}),
                  ...(includeDomains && includeDomains.length > 0 ? { includeDomains } : {}),
                },
              });
              for (const r of results) {
                if (collectedSources.length >= maxSources) break;
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
                resultUrls: results.map((r) => r.url),
              }));
              const capReached = collectedSources.length >= maxSources;
              const capMsg =
                capReached && !sourceCapNotified
                  ? `\n\nSystem: You have reached the user's max-sources cap of ${maxSources}. Do not run more web_search calls. You may still read_url on already-collected sources, then call finish.`
                  : "";
              if (capReached) sourceCapNotified = true;
              messages.push({
                role: "user",
                content:
                  buildSearchObservation(query, results) +
                  "\n\n" +
                  buildBudgetWarning(remaining) +
                  capMsg,
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
              const page = await readUrl({ data: { url, apiKey: tavilyKey } });
              const matchedTitle =
                collectedSources.find((s) => s.url === page.url || s.url === url)?.title ?? "";
              readPages.push({ url: page.url, title: matchedTitle, content: page.content });
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
    [settings, appendStep, updateLastStep],
  );

  const generatePlan = useCallback(
    async (
      query: string,
      opts?: { currentPlan?: string; edits?: string },
    ) => {
      setPlanLoading(true);
      setPlanError(null);
      try {
        const userMsg =
          opts?.currentPlan && opts?.edits
            ? buildPlanRevisionMessage(query, opts.currentPlan, opts.edits)
            : buildPlanUserMessage(query);
        const { content } = await navigatorChat({
          data: {
            model: settings.synthesisModel,
            messages: [
              { role: "system", content: PLAN_SYSTEM_PROMPT },
              { role: "user", content: userMsg },
            ],
            temperature: 0.4,
            apiKey: settings.navigatorApiKey || undefined,
          },
        });
        setPlan(content.trim());
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setPlanError(msg);
      } finally {
        setPlanLoading(false);
      }
    },
    [settings.synthesisModel, settings.navigatorApiKey],
  );

  const handleStart = useCallback(
    (q: string) => {
      setPrompt(q);
      setPhase("plan");
      setPlan(null);
      setPlanError(null);
      void generatePlan(q);
    },
    [generatePlan],
  );

  const handleRevisePlan = useCallback(
    (edits: string) => {
      if (!prompt || !plan) return;
      void generatePlan(prompt, { currentPlan: plan, edits });
    },
    [prompt, plan, generatePlan],
  );

  const handleRegeneratePlan = useCallback(() => {
    if (!prompt) return;
    void generatePlan(prompt);
  }, [prompt, generatePlan]);

  const handleAcceptPlan = useCallback(() => {
    if (!prompt) return;
    setPhase("research");
    void runAgent(prompt, plan);
  }, [prompt, plan, runAgent]);

  const handleReset = useCallback(() => {
    cancelled.current = true;
    setPrompt(null);
    setPhase("input");
    setPlan(null);
    setPlanError(null);
    setPlanLoading(false);
    setTrace([]);
    setReport(null);
    setSources([]);
    setFatalError(null);
    setRunning(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (prompt) void runAgent(prompt, plan);
  }, [prompt, plan, runAgent]);


  const isDone = useMemo(() => !running && !!report, [running, report]);

  const phases = useMemo<Phase[]>(() => {
    const hasSearch = trace.some((s) => s.kind === "search");
    const searchDone = trace.filter((s) => s.kind === "search" && s.status === "done").length;
    const hasRead = trace.some((s) => s.kind === "read");
    const readDone = trace.filter((s) => s.kind === "read" && s.status === "done").length;
    const finishStep = trace.find((s) => s.kind === "finish");
    const finishDone = !!finishStep && finishStep.kind === "finish" && finishStep.status === "done";

    const phase = (
      key: string,
      label: string,
      isDoneCond: boolean,
      isActiveCond: boolean,
      detail?: string,
    ): Phase => ({
      key,
      label,
      status: isDoneCond
        ? "done"
        : isActiveCond
          ? running
            ? "active"
            : fatalError
              ? "error"
              : "pending"
          : "pending",
      detail,
    });

    return [
      phase(
        "plan",
        "Planning research",
        hasSearch || hasRead || !!finishStep,
        running && !hasSearch && !finishStep,
      ),
      phase(
        "search",
        "Searching the web",
        hasRead || !!finishStep,
        hasSearch && !hasRead && !finishStep,
        hasSearch ? `${searchDone} ${searchDone === 1 ? "search" : "searches"} run` : undefined,
      ),
      phase(
        "read",
        "Reading sources",
        !!finishStep,
        hasRead && !finishStep,
        hasRead ? `${readDone} ${readDone === 1 ? "page" : "pages"} read` : undefined,
      ),
      phase(
        "write",
        "Writing report",
        finishDone,
        !!finishStep && !finishDone,
      ),
    ];
  }, [trace, running, fatalError]);

  const workflowSteps = useMemo<WorkflowStep[]>(() => {
    const hasResearchActivity = trace.length > 0;
    const reportReady = !!report;
    const onInput = phase === "input";
    const onPlan = phase === "plan";
    const onResearch = phase === "research";

    return [
      {
        key: "topic",
        label: "Topic",
        status: onInput ? "active" : "done",
      },
      {
        key: "plan",
        label: "Plan",
        status: onInput ? "pending" : onPlan ? "active" : "done",
      },
      {
        key: "searching",
        label: "Searching",
        status: !onResearch
          ? "pending"
          : reportReady
            ? "done"
            : hasResearchActivity || running
              ? "active"
              : "pending",
      },
      {
        key: "report",
        label: "Report",
        status: reportReady ? "done" : onResearch && running ? "active" : "pending",
      },
    ];
  }, [phase, trace.length, report, running]);

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthedState(true)} />;
  }

  if (phase === "input" || !prompt) {
    return (
      <div className="relative">
        <button
          onClick={handleSignOut}
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
        <WorkflowStepper steps={workflowSteps} />
        <PromptInput
          onSubmit={handleStart}
          settings={settings}
          onSettingsChange={setSettings}
        />
        <Disclaimer />
      </div>
    );
  }

  if (phase === "plan") {
    return (
      <div>
        <WorkflowStepper steps={workflowSteps} />
        <PlanReview
          prompt={prompt}
          plan={plan}
          isGenerating={planLoading}
          error={planError}
          onAccept={handleAcceptPlan}
          onRevise={handleRevisePlan}
          onRegenerate={handleRegeneratePlan}
          onCancel={handleReset}
        />
        <Disclaimer />
      </div>
    );
  }


  return (
    <div>
      <WorkflowStepper steps={workflowSteps} />
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
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Progress
              </div>
              <div className="text-xs text-muted-foreground">
                {running ? "Working…" : fatalError ? "Stopped" : "Idle"} · up to {settings.maxSources} sources
              </div>
            </div>
            <ProgressTracker phases={phases} />
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

          <section className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setTraceOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left"
            >
              <div className="flex items-center gap-2">
                {traceOpen ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Agent trace
                </span>
                <span className="text-xs text-muted-foreground">({trace.length})</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {traceOpen ? "Hide details" : "Show details"}
              </span>
            </button>
            {traceOpen && (
              <div className="border-t border-border px-6 py-5">
                {trace.length === 0 && running && (
                  <div className="text-sm text-muted-foreground">Thinking…</div>
                )}
                <AgentTrace steps={trace} />
              </div>
            )}
          </section>
        </div>
      )}

      {isDone && report && (
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-8">
            <ReportView markdown={report} sources={sources} prompt={prompt} />
          </section>
          {trace.length > 0 && (
            <section className="rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setTraceOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left"
              >
                <div className="flex items-center gap-2">
                  {traceOpen ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Agent trace
                  </span>
                  <span className="text-xs text-muted-foreground">({trace.length} steps)</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {traceOpen ? "Hide details" : "Show details"}
                </span>
              </button>
              {traceOpen && (
                <div className="border-t border-border px-6 py-5">
                  <AgentTrace steps={trace} />
                </div>
              )}
            </section>
          )}
          <SourcesPanel sources={sources} />
        </div>
      )}
      </div>
      <Disclaimer />
    </div>
  );
}
