import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RotateCcw, ChevronDown, ChevronRight, Sparkles, ArrowRight, Loader2 } from "lucide-react";

import { PromptInput } from "@/components/research/PromptInput";
import { PasswordGate } from "@/components/research/PasswordGate";
import { PlanReview } from "@/components/research/PlanReview";
import { AgentTrace, type TraceStep } from "@/components/research/AgentTrace";
import { ProgressTracker, type Phase } from "@/components/research/ProgressTracker";
import { WorkflowStepper, type WorkflowStep } from "@/components/research/WorkflowStepper";
import { Disclaimer } from "@/components/research/Disclaimer";
import { ReportView } from "@/components/research/ReportView";
import { SourcesPanel } from "@/components/research/SourcesPanel";
import { Navbar } from "@/components/research/Navbar";
import { HistorySidebar } from "@/components/research/HistorySidebar";
import { StageHeader } from "@/components/research/StageHeader";
import { ResearchChat } from "@/components/research/ResearchChat";
import { MoeChatWorkspace } from "@/components/research/MoeChatWorkspace";
import { saveEntry, updateEntry, type HistoryEntry } from "@/lib/research-history";
import type { UserRoleId } from "@/lib/research-templates";
import { PERSONA_IMAGES, AGENT_IMAGES } from "@/lib/persona-images";


import { navigatorChat } from "@/lib/navigator-chat.functions";
import { webSearch, type SearchResult } from "@/lib/web-search.functions";
import { readUrl } from "@/lib/read-url.functions";
import { condensePage } from "@/lib/condense-page.functions";
import {
  AGENT_SYSTEM_PROMPT,
  REVIEW_SYSTEM_PROMPT,
  SYNTHESIS_SYSTEM_PROMPT,
  buildBudgetWarning,
  buildInitialUserMessage,
  buildReadObservation,
  buildReviewUserMessage,
  buildSearchObservation,
  buildStepCounter,
  buildSynthesisUserMessage,
  type FollowUpSuggestion,
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
import { sanitizeReportCitations } from "@/lib/citation-validator";


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
  // Searcher + writer models come from settings (split-model).
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [running, setRunning] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpSuggestion[]>([]);
  const cancelled = useRef(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const savedReportRef = useRef<string | null>(null);
  const [roleId, setRoleId] = useState<UserRoleId>("researcher");
  const [workflowMode, setWorkflowMode] = useState<"research" | "moe">("research");
  const [moeEntryId, setMoeEntryId] = useState<string | null>(null);
  const [moeInitialEntry, setMoeInitialEntry] = useState<HistoryEntry | null>(null);


  // Persist completed researches to localStorage (per-device only).
  useEffect(() => {
    if (!report || !prompt) return;
    if (savedReportRef.current === report) return;
    if (activeHistoryId) {
      // Loaded from history — don't re-save.
      savedReportRef.current = report;
      return;
    }
    const entry = saveEntry({ prompt, plan, report, sources, roleId });
    savedReportRef.current = report;
    setActiveHistoryId(entry.id);
    setHistoryRefresh((n) => n + 1);

    // Generate a short, memorable title via the LLM (best-effort).
    (async () => {
      try {
        const { content } = await navigatorChat({
          data: {
            model: settings.investigatorModel,
            temperature: 0.3,
            maxTokens: 32,
            apiKey: settings.navigatorApiKey || undefined,
            messages: [
              {
                role: "system",
                content:
                  "You generate ultra-short titles (3–6 words, Title Case, no quotes, no trailing punctuation) that capture the specific subject of a research request. Reply with ONLY the title.",
              },
              {
                role: "user",
                content: `Research prompt:\n${prompt}\n\nReport excerpt:\n${report.slice(0, 800)}\n\nTitle:`,
              },
            ],
          },
        });
        const title = content
          .trim()
          .replace(/^["'`]+|["'`]+$/g, "")
          .replace(/[.!?]+$/g, "")
          .split("\n")[0]
          .slice(0, 80);
        if (title) {
          updateEntry(entry.id, { title });
          setHistoryRefresh((n) => n + 1);
        }
      } catch {
        /* keep prompt as fallback */
      }
    })();
  }, [report, prompt, plan, sources, activeHistoryId, settings.investigatorModel, settings.navigatorApiKey]);

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
      setFollowUps([]);
      setReviewing(false);

      const maxSources = settings.maxSources;
      // Step budget scales with desired source count but stays reasonable.
      const maxSteps = Math.max(8, Math.ceil(maxSources * 1.5));
      const navigatorKey = settings.navigatorApiKey || undefined;
      const tavilyKey = settings.tavilyApiKey || undefined;
      const firecrawlKey = settings.firecrawlApiKey || undefined;
      const searchProvider = settings.searchProvider;

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
      const failedSearches = new Map<string, string>();
      const failedReads = new Map<string, string>();
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

          // Compact older observations to stay under the investigator model's
          // context window (some models cap at 32k tokens). Keep system + the
          // initial user task + the most recent turns intact; replace older
          // observation bodies with a short placeholder.
          const RECENT_TURNS_TO_KEEP = 6;
          const MAX_OLDER_OBSERVATION_CHARS = 400;
          const compacted: ChatMessage[] = messages.map((m, idx) => {
            const isSystem = m.role === "system";
            const isInitialUser = idx === 1; // first user message = research task
            const isRecent = idx >= messages.length - RECENT_TURNS_TO_KEEP;
            if (isSystem || isInitialUser || isRecent) return m;
            if (m.content.length <= MAX_OLDER_OBSERVATION_CHARS) return m;
            return {
              ...m,
              content:
                m.content.slice(0, MAX_OLDER_OBSERVATION_CHARS) +
                `\n\n[…older context truncated to save space; full sources retained for final report]`,
            };
          });

          const { content } = await navigatorChat({
            data: {
              model: settings.investigatorModel,
              messages: [...compacted, counterMsg],
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
                temperature: 0.4,
                maxTokens: 16000,
                apiKey: navigatorKey,
              },
            });
            if (cancelled.current) return;
            const { sanitizedMarkdown: draftSanitized, hallucinatedUrls } = sanitizeReportCitations(
              reportMd.trim(),
              collectedSources,
            );
            if (hallucinatedUrls.length > 0) {
              console.warn("Hallucinated citations stripped:", hallucinatedUrls);
              appendStep({
                kind: "error",
                message: `Stripped ${hallucinatedUrls.length} hallucinated citation${
                  hallucinatedUrls.length === 1 ? "" : "s"
                } from the draft: ${hallucinatedUrls.slice(0, 5).join(", ")}${
                  hallucinatedUrls.length > 5 ? "…" : ""
                }`,
              });
            }
            updateLastStep(() => ({ kind: "finish", status: "done" }));

            // Review pass: synthesizer polishes the draft and proposes follow-ups.
            setReviewing(true);
            appendStep({ kind: "thought", text: "Reviewing draft and identifying follow-up research…" });
            let finalReport = draftSanitized;
            try {
              const { content: reviewRaw } = await navigatorChat({
                data: {
                  model: settings.synthesisModel,
                  messages: [
                    { role: "system", content: REVIEW_SYSTEM_PROMPT },
                    {
                      role: "user",
                      content: buildReviewUserMessage(userQuery, approvedPlan ?? null, draftSanitized),
                    },
                  ],
                  temperature: 0.3,
                  maxTokens: 16000,
                  responseFormat: "json_object",
                  apiKey: navigatorKey,
                },
              });
              if (cancelled.current) return;
              const parsed = JSON.parse(stripFences(reviewRaw)) as {
                revisedReport?: unknown;
                followUps?: unknown;
              };
              if (typeof parsed.revisedReport === "string" && parsed.revisedReport.trim().length > 200) {
                const { sanitizedMarkdown: revisedSanitized } = sanitizeReportCitations(
                  parsed.revisedReport.trim(),
                  collectedSources,
                );
                finalReport = revisedSanitized;
              }
              if (Array.isArray(parsed.followUps)) {
                const cleaned: FollowUpSuggestion[] = parsed.followUps
                  .filter(
                    (f): f is { title: string; rationale: string; prompt: string } =>
                      !!f &&
                      typeof (f as { title?: unknown }).title === "string" &&
                      typeof (f as { prompt?: unknown }).prompt === "string",
                  )
                  .map((f) => ({
                    title: f.title.trim(),
                    rationale: typeof f.rationale === "string" ? f.rationale.trim() : "",
                    prompt: f.prompt.trim(),
                  }))
                  .slice(0, 3);
                setFollowUps(cleaned);
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              appendStep({ kind: "error", message: `Review pass failed — showing draft. (${msg})` });
            } finally {
              setReviewing(false);
            }
            setReport(finalReport);


            return;
          }

          // Tool step — counts against budget.
          stepsUsed += 1;
          const remaining = maxSteps - stepsUsed;

          if (turn.action.tool === "web_search") {
            const { query, timeRange, includeDomains } = turn.action.args;
            if (failedSearches.has(query)) {
              const prevError = failedSearches.get(query) ?? "previous attempt failed";
              appendStep({
                kind: "blocked",
                tool: "web_search",
                target: query,
                reason: prevError,
              });
              messages.push({
                role: "user",
                content: `System ERROR: You already attempted the search "${query}" and it failed (${prevError}). You MUST modify your search string or use a different tool.\n\n${buildBudgetWarning(remaining)}`,
              });
              continue;
            }
            appendStep({ kind: "search", query, status: "active" });
            try {
              const remainingCap = Math.max(1, maxSources - collectedSources.length);
              const requestSize = Math.min(10, Math.max(3, remainingCap));
              const { results } = await webSearch({
                data: {
                  query,
                  provider: searchProvider,
                  tavilyApiKey: tavilyKey,
                  firecrawlApiKey: firecrawlKey,
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
              failedSearches.set(query, msg);
              updateLastStep(() => ({ kind: "search", query, status: "error", error: msg }));
              messages.push({
                role: "user",
                content: `Observation (web_search "${query}"): ERROR — ${msg}\nDo NOT repeat this exact search query.\n\n${buildBudgetWarning(remaining)}`,
              });
            }
          } else if (turn.action.tool === "read_url") {
            const url = turn.action.args.url;
            if (failedReads.has(url)) {
              const prevError = failedReads.get(url) ?? "previous attempt failed";
              appendStep({
                kind: "blocked",
                tool: "read_url",
                target: url,
                reason: prevError,
              });
              messages.push({
                role: "user",
                content: `System ERROR: You already attempted to read ${url} and it failed (${prevError}). You MUST pick a different URL or use a different tool.\n\n${buildBudgetWarning(remaining)}`,
              });
              continue;
            }
            appendStep({ kind: "read", url, status: "active" });
            try {
              const page = await readUrl({
                data: {
                  url,
                  provider: searchProvider,
                  tavilyApiKey: tavilyKey,
                  firecrawlApiKey: firecrawlKey,
                },
              });
              const matchedTitle =
                collectedSources.find((s) => s.url === page.url || s.url === url)?.title ?? "";

              // For very large pages, chunk + extract relevant facts via
              // map-reduce so the synthesizer (and any future re-read) stays
              // under the model's context window without losing data.
              let storedContent = page.content;
              let condenseNote = "";
              try {
                const { condensed, chunkCount, wasCondensed } = await condensePage({
                  data: {
                    url: page.url,
                    title: matchedTitle,
                    content: page.content,
                    question: userQuery,
                    model: settings.investigatorModel,
                    apiKey: navigatorKey,
                  },
                });
                storedContent = condensed;
                if (wasCondensed) {
                  condenseNote = `\n\n[Page was ${page.content.length.toLocaleString()} chars — chunked into ${chunkCount} parts and condensed to ${condensed.length.toLocaleString()} chars of relevant facts for the report.]`;
                }
              } catch (e) {
                console.warn("condensePage failed; using raw content", e);
              }

              readPages.push({ url: page.url, title: matchedTitle, content: storedContent });
              updateLastStep(() => ({
                kind: "read",
                url,
                status: "done",
                chars: page.content.length,
              }));
              messages.push({
                role: "user",
                content:
                  buildReadObservation(page.url, storedContent) +
                  condenseNote +
                  "\n\n" +
                  buildBudgetWarning(remaining),
              });

            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              failedReads.set(url, msg);
              updateLastStep(() => ({ kind: "read", url, status: "error", error: msg }));
              messages.push({
                role: "user",
                content: `Observation (read_url ${url}): ERROR — ${msg}\nDo NOT retry this exact URL.\n\n${buildBudgetWarning(remaining)}`,
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
            model: settings.planModel,
            messages: [
              { role: "system", content: settings.planSystemPrompt || PLAN_SYSTEM_PROMPT },
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
    [settings.planModel, settings.navigatorApiKey, settings.planSystemPrompt],
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
    setActiveHistoryId(null);
    savedReportRef.current = null;
    setFollowUps([]);
    setReviewing(false);
    setMoeEntryId(null);
    setMoeInitialEntry(null);
  }, []);

  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    cancelled.current = true;
    setRunning(false);
    setPlanLoading(false);
    setPlanError(null);
    setFatalError(null);
    setTrace([]);
    if (entry.kind === "moe" && entry.moe) {
      setWorkflowMode("moe");
      setMoeEntryId(entry.id);
      setMoeInitialEntry(entry);
      setActiveHistoryId(entry.id);
      if (entry.roleId) setRoleId(entry.roleId);
      setPhase("input");
      setPrompt(null);
      setReport(null);
      setSources([]);
      savedReportRef.current = null;
      return;
    }
    setWorkflowMode("research");
    setMoeEntryId(null);
    setMoeInitialEntry(null);
    setPrompt(entry.prompt);
    setPlan(entry.plan);
    setSources(entry.sources);
    setReport(entry.report);
    savedReportRef.current = entry.report;
    setActiveHistoryId(entry.id);
    if (entry.roleId) setRoleId(entry.roleId);
    setFollowUps([]);
    setReviewing(false);
    setPhase("research");
  }, []);

  const handleMoeSnapshot = useCallback(
    (snapshot: import("@/components/research/MoeChatWorkspace").MoeSnapshot) => {
      const firstUser = snapshot.messages.find((m): m is { role: "user"; content: string } => m.role === "user");
      const prompt = firstUser?.content ?? "MoE chat";
      const title = prompt.trim().slice(0, 80);
      const moePayload = {
        mode: snapshot.mode,
        panelPreset: snapshot.panelPreset,
        customPanel: snapshot.customPanel,
        singleExpert: snapshot.singleExpert,
        messages: snapshot.messages,
      };
      const personaRole: UserRoleId | undefined =
        snapshot.mode === "single"
          ? snapshot.singleExpert
          : (snapshot.customPanel?.[0] as UserRoleId | undefined);

      if (!moeEntryId) {
        const created = saveEntry({
          prompt,
          title,
          plan: null,
          report: "",
          sources: [],
          roleId: personaRole,
          kind: "moe",
          moe: moePayload,
        });
        setMoeEntryId(created.id);
        setActiveHistoryId(created.id);
        setHistoryRefresh((n) => n + 1);
      } else {
        updateEntry(moeEntryId, { title, moe: moePayload, roleId: personaRole });
        setHistoryRefresh((n) => n + 1);
      }
    },
    [moeEntryId],
  );

  const handleMoeResetEntry = useCallback(() => {
    setMoeEntryId(null);
    setMoeInitialEntry(null);
    setActiveHistoryId(null);
  }, []);


  const handleRetry = useCallback(() => {
    if (prompt) void runAgent(prompt, plan);
  }, [prompt, plan, runAgent]);

  const handleFollowUp = useCallback(
    (nextPrompt: string) => {
      handleReset();
      setTimeout(() => handleStart(nextPrompt), 0);
    },
    [handleReset, handleStart],
  );


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

  let content: ReactNode;
  if (phase === "input" || !prompt) {
    content = (
      <>
        <Navbar onSignOut={handleSignOut} settings={settings} onSettingsChange={setSettings} />
        <div className="mx-auto mt-4 flex w-full max-w-4xl justify-center px-4 sm:px-6">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1 text-sm">
            {([
              { id: "research", label: "Deep Research" },
              { id: "moe", label: "MoE Chat" },
            ] as const).map((t) => {
              const active = workflowMode === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setWorkflowMode(t.id)}
                  className={
                    "rounded-full px-5 py-2 font-medium transition " +
                    (active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        {workflowMode === "research" ? (
          <>
            <WorkflowStepper steps={workflowSteps} />
            <PromptInput
              onSubmit={handleStart}
              settings={settings}
              onSettingsChange={setSettings}
              roleId={roleId}
              onRoleChange={setRoleId}
            />
          </>
        ) : (
          <MoeChatWorkspace settings={settings} roleId={roleId} />
        )}
        <Disclaimer />
      </>
    );
  } else if (phase === "plan") {
    content = (
      <>
        <Navbar onSignOut={handleSignOut} settings={settings} onSettingsChange={setSettings} />
        <WorkflowStepper steps={workflowSteps} />
        <div className="mx-auto w-full max-w-4xl px-4 pt-6 sm:px-6">
          <StageHeader stage="plan" title="Strategist is drafting your research plan" />
        </div>
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
      </>
    );
  } else {
    content = (
      <>
        <Navbar onSignOut={handleSignOut} settings={settings} onSettingsChange={setSettings} />
        <WorkflowStepper steps={workflowSteps} />
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
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
              <StageHeader
                stage={reviewing ? "report" : "searching"}
                title={reviewing ? "Writer is drafting the report" : "Searcher is investigating sources"}
              />
              <section className="rounded-xl border border-border bg-card p-4 sm:p-6">


                <div className="mb-4 flex items-center justify-between">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Progress
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {running ? "Working…" : fatalError ? "Stopped" : "Idle"} · up to {settings.maxSources} sources
                  </div>
                </div>
                <ProgressTracker phases={phases} />
                {reviewing && (
                  <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin text-foreground" />
                    Writer is reviewing the draft and identifying follow-up research…
                  </div>
                )}
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
              <div className="mb-6 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-4">
                  <img
                    src={PERSONA_IMAGES[roleId]}
                    alt="Your persona"
                    className="h-48 w-auto object-contain dark:drop-shadow-[0_0_22px_rgba(0,242,254,0.35)]"
                  />
                  <img
                    src={AGENT_IMAGES.workingTogether}
                    alt="Research agents working together"
                    className="h-48 w-auto object-contain dark:drop-shadow-[0_0_22px_rgba(0,242,254,0.35)]"
                  />
                </div>
                <div className="text-base font-medium text-foreground text-center">
                  Your research team's final report
                </div>
              </div>
              <section className="rounded-xl border border-border bg-card p-4 sm:p-8">
                <ReportView markdown={report} sources={sources} prompt={prompt} />
              </section>

              {followUps.length > 0 && (
                <section className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="size-4 text-foreground" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      Continue the research
                    </h2>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    The synthesizer reviewed the report and identified these gaps. Each suggestion
                    is a ready-to-run research prompt.
                  </p>
                  <ul className="space-y-3">
                    {followUps.map((f, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-border bg-background p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">{f.title}</div>
                            {f.rationale && (
                              <div className="mt-1 text-xs text-muted-foreground">{f.rationale}</div>
                            )}
                            <div className="mt-2 text-sm text-foreground/90">{f.prompt}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFollowUp(f.prompt)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                          >
                            Start research
                            <ArrowRight className="size-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
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
      </>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-stretch">
      <HistorySidebar
        activeId={activeHistoryId}
        onSelect={handleSelectHistory}
        onNew={handleReset}
        refreshKey={historyRefresh}
        onSignOut={handleSignOut}
      />

      <div className="min-w-0 flex-1">{content}</div>
      {isDone && report && prompt && (
        <ResearchChat
          currentDoc={{
            id: activeHistoryId ?? "current",
            title: prompt,
            prompt,
            report,
            sources,
          }}
          settings={settings}
          roleId={roleId}
        />
      )}
    </div>
  );
}
