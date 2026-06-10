import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, Send, Plus, X, Loader2, BookOpen, Minus, ChevronDown, AlertTriangle } from "lucide-react";

import { navigatorChat } from "@/lib/navigator-chat.functions";
import { loadHistory, type HistoryEntry } from "@/lib/research-history";
import type { SearchResult } from "@/lib/web-search.functions";
import type { UserSettings } from "@/lib/user-settings";
import type { UserRoleId } from "@/lib/research-templates";
import { PERSONA_IMAGES } from "@/lib/persona-images";
import {
  MOE_EXPERT_IDS,
  MOE_EXPERT_LABELS,
  MOE_PANEL_PRESETS,
  type ExpertAnswer,
  type MoeExpertId,
  type RouterRoute,
} from "@/lib/moe-prompts";
import { runMoeTurn, type MoeMode } from "@/lib/moe-chat";

type SingleAssistantMsg = {
  role: "assistant";
  mode: "single";
  content: string;
  personaId: MoeExpertId;
};
type MoeAssistantMsg = {
  role: "assistant";
  mode: "auto" | "panel";
  content: string; // synthesis markdown
  selectedExperts: RouterRoute[];
  expertAnswers: ExpertAnswer[];
  failures: Array<{ expertId: MoeExpertId; error: string }>;
};
type ChatMsg =
  | { role: "user"; content: string }
  | SingleAssistantMsg
  | MoeAssistantMsg;

type ContextDoc = {
  id: string;
  title: string;
  prompt: string;
  report: string;
  sources: SearchResult[];
};

type Props = {
  currentDoc: ContextDoc;
  settings: UserSettings;
  roleId?: UserRoleId;
};

type PanelPreset = "default" | "education" | "custom";
type LoadingStage = "routing" | "consulting" | "synthesizing" | null;

function buildDocsBlock(docs: ContextDoc[]): string {
  const flatSources: { url: string; title: string }[] = [];
  const seen = new Set<string>();
  const docBlocks: string[] = [];

  for (const doc of docs) {
    const localStart = flatSources.length + 1;
    const localLines: string[] = [];
    for (const s of doc.sources) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      flatSources.push({ url: s.url, title: s.title });
      localLines.push(`  [${flatSources.length}] ${s.title} — ${s.url}`);
    }
    docBlocks.push(
      `===== DOCUMENT: ${doc.title} =====
Original research prompt: ${doc.prompt}

Report:
${doc.report}

Sources for this document (numbered globally, ${localStart}–${flatSources.length}):
${localLines.join("\n") || "  (none)"}
===== END DOCUMENT =====`,
    );
  }

  return `Available documents and sources:\n\n${docBlocks.join("\n\n")}`;
}

function buildSystemPrompt(
  docs: ContextDoc[],
  basePrompt: string,
  rolePrompt: string,
): string {
  return `${basePrompt}\n\n${rolePrompt}\n\n${buildDocsBlock(docs)}`;
}

function MarkdownBlock({ children }: { children: string }) {
  return (
    <div className="prose prose-sm prose-neutral max-w-none dark:prose-invert prose-a:text-foreground prose-a:underline prose-a:underline-offset-2 hover:prose-a:opacity-70 prose-p:my-2 prose-ul:my-2 prose-headings:mt-3 prose-headings:mb-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function ExpertChip({ expertId, reason }: { expertId: MoeExpertId; reason?: string }) {
  return (
    <span
      title={reason}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
    >
      <img
        src={PERSONA_IMAGES[expertId]}
        alt=""
        className="size-4 rounded-full object-cover"
      />
      {MOE_EXPERT_LABELS[expertId]}
    </span>
  );
}

export function ResearchChat({ currentDoc, settings, roleId }: Props) {
  const [extraDocs, setExtraDocs] = useState<ContextDoc[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mode state
  const [mode, setMode] = useState<MoeMode>("single");
  const [singleExpert, setSingleExpert] = useState<MoeExpertId>(roleId ?? "researcher");
  const [panelPreset, setPanelPreset] = useState<PanelPreset>("default");
  const [customPanel, setCustomPanel] = useState<MoeExpertId[]>([
    "researcher",
    "experience-designer",
    "software-developer",
  ]);

  useEffect(() => {
    setHistory(loadHistory());
  }, [pickerOpen]);

  // Reset chat when the current research changes.
  useEffect(() => {
    setMessages([]);
    setExtraDocs([]);
    setError(null);
    if (roleId) setSingleExpert(roleId);
  }, [currentDoc.id, roleId]);

  // Clear messages when mode changes so transcripts stay consistent.
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [mode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, loadingStage]);

  const allDocs = useMemo(() => [currentDoc, ...extraDocs], [currentDoc, extraDocs]);

  const availableHistory = history.filter(
    (h) => h.id !== currentDoc.id && !extraDocs.some((d) => d.id === h.id) && !!h.report,
  );

  const handleAddDoc = (entry: HistoryEntry) => {
    setExtraDocs((d) => [
      ...d,
      {
        id: entry.id,
        title: entry.title || entry.prompt,
        prompt: entry.prompt,
        report: entry.report,
        sources: entry.sources,
      },
    ]);
    setPickerOpen(false);
  };

  const handleRemoveDoc = (id: string) => {
    setExtraDocs((d) => d.filter((doc) => doc.id !== id));
  };

  const effectivePanel: MoeExpertId[] =
    panelPreset === "custom" ? customPanel : MOE_PANEL_PRESETS[panelPreset];

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setError(null);

    if (mode === "panel") {
      if (effectivePanel.length < 2 || effectivePanel.length > 6) {
        setError("Expert Panel requires 2 to 6 experts.");
        return;
      }
    }

    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);

    try {
      if (mode === "single") {
        const personaCfg = settings.personaChat[singleExpert];
        const system = buildSystemPrompt(
          allDocs,
          settings.personaChatBasePrompt,
          personaCfg?.systemPrompt ?? "",
        );
        const chatModel = personaCfg?.model ?? settings.synthesisModel;
        const priorTurns = messages
          .filter(
            (m): m is { role: "user"; content: string } | SingleAssistantMsg =>
              m.role === "user" || (m.role === "assistant" && m.mode === "single"),
          )
          .map((m) => ({ role: m.role, content: m.content }));
        const { content } = await navigatorChat({
          data: {
            model: chatModel,
            temperature: 0.3,
            maxTokens: 4000,
            apiKey: settings.navigatorApiKey || undefined,
            messages: [
              { role: "system", content: system },
              ...priorTurns,
              { role: "user", content: trimmed },
            ],
          },
        });
        setMessages((m) => [
          ...m,
          { role: "assistant", mode: "single", content: content.trim(), personaId: singleExpert },
        ]);
      } else {
        const result = await runMoeTurn({
          mode,
          question: trimmed,
          docs: allDocs,
          settings,
          preferredExpertId: mode === "auto" ? (roleId ?? singleExpert) : undefined,
          panelExperts: mode === "panel" ? effectivePanel : undefined,
          onStage: (s) => setLoadingStage(s),
        });
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            mode,
            content: result.synthesis,
            selectedExperts: result.selectedExperts,
            expertAnswers: result.expertAnswers,
            failures: result.failures,
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
      setLoadingStage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const toggleCustomExpert = (id: MoeExpertId) => {
    setCustomPanel((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : arr.length >= 6 ? arr : [...arr, id],
    );
  };

  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-90"
        aria-label="Open chat"
      >
        <MessageSquare className="size-4" />
        Chat with this report
      </button>
    );
  }

  const stageLabel: Record<Exclude<LoadingStage, null>, string> = {
    routing: "Routing question…",
    consulting: "Consulting experts…",
    synthesizing: "Synthesizing answer…",
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[min(720px,calc(100vh-3rem))] w-[min(480px,calc(100vw-3rem))] flex-col rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Chat with this report
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Minimize chat"
        >
          <Minus className="size-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        {/* Mode tabs */}
        <div className="mb-3 inline-flex w-full items-center rounded-full border border-border bg-muted/40 p-1 text-xs">
          {([
            { id: "single", label: "Single Expert" },
            { id: "auto", label: "Auto-Pick" },
            { id: "panel", label: "Expert Panel" },
          ] as const).map((t) => {
            const active = mode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id)}
                className={
                  "flex-1 rounded-full px-3 py-1.5 font-medium transition " +
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

        {/* Mode-specific controls */}
        {mode === "single" && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {MOE_EXPERT_IDS.map((id) => {
              const active = singleExpert === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSingleExpert(id)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition " +
                    (active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-accent")
                  }
                  title={MOE_EXPERT_LABELS[id]}
                >
                  <img
                    src={PERSONA_IMAGES[id]}
                    alt=""
                    className="size-4 rounded-full object-cover"
                  />
                  {MOE_EXPERT_LABELS[id]}
                </button>
              );
            })}
          </div>
        )}

        {mode === "auto" && (
          <div className="mb-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            The router will pick 1–3 experts based on your question
            {roleId ? ` and prefer the ${MOE_EXPERT_LABELS[roleId]} persona when relevant` : ""}.
          </div>
        )}

        {mode === "panel" && (
          <div className="mb-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: "default", label: "Default panel" },
                { id: "education", label: "Education panel" },
                { id: "custom", label: "Custom" },
              ] as const).map((p) => {
                const active = panelPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPanelPreset(p.id)}
                    className={
                      "rounded-full border px-3 py-1 text-[11px] transition " +
                      (active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:bg-accent")
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {panelPreset !== "custom" ? (
              <div className="flex flex-wrap gap-1.5">
                {MOE_PANEL_PRESETS[panelPreset].map((id) => (
                  <ExpertChip key={id} expertId={id} />
                ))}
              </div>
            ) : (
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Pick 2–6 experts ({customPanel.length} selected)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MOE_EXPERT_IDS.map((id) => {
                    const active = customPanel.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleCustomExpert(id)}
                        className={
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition " +
                          (active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-foreground hover:bg-accent")
                        }
                      >
                        <img
                          src={PERSONA_IMAGES[id]}
                          alt=""
                          className="size-4 rounded-full object-cover"
                        />
                        {MOE_EXPERT_LABELS[id]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document chips */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-foreground/30 bg-background px-3 py-1 text-[11px] text-foreground">
            <BookOpen className="size-3.5" />
            <span className="max-w-[200px] truncate" title={currentDoc.title}>
              {currentDoc.title}
            </span>
            <span className="text-muted-foreground">(this report)</span>
          </div>
          {extraDocs.map((d) => (
            <div
              key={d.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[11px] text-foreground"
            >
              <BookOpen className="size-3.5" />
              <span className="max-w-[200px] truncate" title={d.title}>
                {d.title}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveDoc(d.id)}
                className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Remove document"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Add report
            </button>
            {pickerOpen && (
              <div className="absolute left-0 top-full z-10 mt-2 w-80 rounded-lg border border-border bg-popover p-2 shadow-lg">
                {availableHistory.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No other researches available.
                  </div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto">
                    {availableHistory.map((h) => (
                      <li key={h.id}>
                        <button
                          type="button"
                          onClick={() => handleAddDoc(h)}
                          className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-xs hover:bg-accent"
                        >
                          <span className="line-clamp-1 font-medium text-foreground">
                            {h.title || h.prompt}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {h.sources.length} sources
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="mb-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background p-3"
        >
          {messages.length === 0 && !sending && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Ask anything about {extraDocs.length > 0 ? "these reports" : "this report"}.
              Answers are grounded in the report and selected sources.
            </div>
          )}
          <div className="space-y-5">
            {messages.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                      {m.content}
                    </div>
                  </div>
                );
              }
              if (m.mode === "single") {
                return (
                  <div key={i} className="flex items-start gap-2">
                    <img
                      src={PERSONA_IMAGES[m.personaId]}
                      alt=""
                      className="mt-1 size-6 shrink-0 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {MOE_EXPERT_LABELS[m.personaId]}
                      </div>
                      <MarkdownBlock>{m.content}</MarkdownBlock>
                    </div>
                  </div>
                );
              }
              // auto / panel
              return (
                <div key={i} className="space-y-3">
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.mode === "auto" ? "Auto-routed answer" : "Expert Panel synthesis"}
                    </div>
                    <MarkdownBlock>{m.content}</MarkdownBlock>
                  </div>
                  {m.selectedExperts.length > 0 && (
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Selected experts
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.selectedExperts.map((r) => (
                          <ExpertChip key={r.expertId} expertId={r.expertId} reason={r.reason} />
                        ))}
                      </div>
                    </div>
                  )}
                  {m.failures.length > 0 && (
                    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
                      <div className="mb-1 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="size-3.5" />
                        Some experts failed
                      </div>
                      <ul className="space-y-0.5">
                        {m.failures.map((f) => (
                          <li key={f.expertId}>
                            <strong>{MOE_EXPERT_LABELS[f.expertId]}</strong>: {f.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.expertAnswers.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Expert contributions
                      </div>
                      {m.expertAnswers.map((ea) => (
                        <details
                          key={ea.expertId}
                          className="group rounded-md border border-border bg-muted/20"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs">
                            <span className="flex items-center gap-2">
                              <img
                                src={PERSONA_IMAGES[ea.expertId]}
                                alt=""
                                className="size-5 rounded-full object-cover"
                              />
                              <span className="font-medium text-foreground">
                                {MOE_EXPERT_LABELS[ea.expertId]}
                              </span>
                              <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {ea.confidence} confidence
                              </span>
                            </span>
                            <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
                          </summary>
                          <div className="space-y-2 border-t border-border px-3 py-2">
                            <MarkdownBlock>{ea.answer}</MarkdownBlock>
                            {ea.evidenceUsed.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Evidence used
                                </div>
                                <ul className="ml-4 list-disc text-xs text-foreground">
                                  {ea.evidenceUsed.map((x, j) => (
                                    <li key={j}>{x}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {ea.missingEvidence.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Missing evidence
                                </div>
                                <ul className="ml-4 list-disc text-xs text-foreground">
                                  {ea.missingEvidence.map((x, j) => (
                                    <li key={j}>{x}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {ea.recommendations.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Recommendations
                                </div>
                                <ul className="ml-4 list-disc text-xs text-foreground">
                                  {ea.recommendations.map((x, j) => (
                                    <li key={j}>{x}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {loadingStage ? stageLabel[loadingStage] : "Thinking…"}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Composer */}
        <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the research…"
            rows={2}
            className="min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
