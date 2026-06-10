import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  ChevronDown,
  AlertTriangle,
  MessagesSquare,
  LayoutTemplate,
} from "lucide-react";

import { navigatorChat } from "@/lib/navigator-chat.functions";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import type { UserSettings } from "@/lib/user-settings";
import { RESEARCH_ROLE_GROUPS, type UserRoleId, type ResearchTemplate } from "@/lib/research-templates";
import { PERSONA_ICONS } from "@/lib/persona-icons";
import { PERSONA_IMAGES } from "@/lib/persona-images";
import {
  MOE_EXPERT_IDS,
  MOE_EXPERT_LABELS,
  MOE_PANEL_PRESETS,
  MOE_PANEL_PRESET_META,
  MOE_PANEL_PRESET_IMAGES,
  MOE_PANEL_TEMPLATES,
  PANEL_PRESET_ORDER,
  type ExpertAnswer,
  type MoeExpertId,
  type MoePanelTemplate,
  type PanelPresetId,
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
  content: string;
  selectedExperts: RouterRoute[];
  expertAnswers: ExpertAnswer[];
  failures: Array<{ expertId: MoeExpertId; error: string }>;
};
type ChatMsg =
  | { role: "user"; content: string }
  | SingleAssistantMsg
  | MoeAssistantMsg;

type Props = {
  settings: UserSettings;
  roleId?: UserRoleId;
};

type PanelPreset = PanelPresetId | "custom";
type LoadingStage = "routing" | "consulting" | "synthesizing" | null;

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
  const Icon = PERSONA_ICONS[expertId];
  return (
    <span
      title={reason}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
    >
      <Icon className="size-4" />
      {MOE_EXPERT_LABELS[expertId]}
    </span>
  );
}

export function MoeChatWorkspace({ settings, roleId }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<MoeMode>("panel");
  const [singleExpert, setSingleExpert] = useState<MoeExpertId>(roleId ?? "researcher");
  const [panelPreset, setPanelPreset] = useState<PanelPreset>("education");
  const [customPanel, setCustomPanel] = useState<MoeExpertId[]>([
    "researcher",
    "experience-designer",
    "software-developer",
  ]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [mode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, loadingStage]);

  const effectivePanel: MoeExpertId[] =
    panelPreset === "custom" ? customPanel : MOE_PANEL_PRESETS[panelPreset];

  const isSingle = mode === "single";
  const heroImage = isSingle
    ? PERSONA_IMAGES[singleExpert]
    : mode === "panel" && panelPreset !== "custom"
      ? MOE_PANEL_PRESET_IMAGES[panelPreset]
      : MOE_PANEL_PRESET_IMAGES["product-design"];
  const heroLabel = isSingle
    ? MOE_EXPERT_LABELS[singleExpert]
    : mode === "panel" && panelPreset !== "custom"
      ? MOE_PANEL_PRESET_META[panelPreset].label
      : MOE_PANEL_PRESET_META["product-design"].label;

  const templateExperts: MoeExpertId[] = useMemo(() => {
    if (mode === "single") return [singleExpert];
    if (mode === "panel") return effectivePanel;
    return [roleId ?? singleExpert ?? "researcher"];
  }, [mode, singleExpert, effectivePanel, roleId]);

  const suggestedTemplates: Array<MoePanelTemplate | ResearchTemplate> = useMemo(() => {
    if (mode === "panel" && panelPreset !== "custom" && panelPreset !== "default") {
      return MOE_PANEL_TEMPLATES[panelPreset];
    }
    const ids = new Set<UserRoleId>(templateExperts);
    const list: ResearchTemplate[] = [];
    const seen = new Set<string>();
    for (const group of RESEARCH_ROLE_GROUPS) {
      if (!ids.has(group.id)) continue;
      for (const t of group.templates) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        list.push(t);
      }
    }
    return list.slice(0, 8);
  }, [mode, panelPreset, templateExperts]);

  const stageLabel: Record<Exclude<LoadingStage, null>, string> = {
    routing: "Routing question…",
    consulting: "Consulting experts…",
    synthesizing: "Synthesizing answer…",
  };

  const toggleCustomExpert = (id: MoeExpertId) => {
    setCustomPanel((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : arr.length >= 6 ? arr : [...arr, id],
    );
  };

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
        const system = `${settings.personaChatBasePrompt}\n\n${personaCfg?.systemPrompt ?? ""}\n\nNo research report has been provided. Answer from your professional expertise as ${MOE_EXPERT_LABELS[singleExpert]}, and be transparent when a claim would normally require sources you don't have.`;
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
            temperature: 0.4,
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
          docs: [],
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

  return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pt-4 pb-6 sm:px-6">
      <div className="flex flex-col items-center text-center">
        {mode === "panel" && panelPreset === "custom" ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {customPanel.map((id) => (
              <img
                key={id}
                src={PERSONA_IMAGES[id]}
                alt={MOE_EXPERT_LABELS[id]}
                loading="eager"
                className={
                  (messages.length === 0 ? "h-[220px] " : "h-[80px] ") +
                  "w-auto object-contain transition-opacity duration-300 dark:drop-shadow-[0_0_32px_rgba(0,242,254,0.4)]"
                }
              />
            ))}
          </div>
        ) : (
          <img
            key={heroImage}
            src={heroImage}
            alt={`${heroLabel}${isSingle ? "" : " panel"}`}
            loading="eager"
            className={
              (messages.length === 0 ? "h-[300px] " : "h-[160px] ") + "w-auto object-contain transition-opacity duration-300 " +
              (isSingle ? "dark:drop-shadow-[0_0_32px_rgba(0,242,254,0.4)]" : "rounded-xl")
            }
          />
        )}
        <div className="mt-2 mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <MessagesSquare className="size-3.5" />
          Mixture of Experts · No research run required
        </div>
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Chat with Mixture of Experts
        </h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Ask any question and have one expert, an auto-routed group, or a full panel weigh in.
        </p>
      </div>




      {/* Mode tabs */}
      <div className="inline-flex w-full items-center rounded-full border border-border bg-muted/40 p-1 text-xs">
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

      {mode === "single" && (
        <div className="flex flex-wrap gap-1.5">
          {MOE_EXPERT_IDS.map((id) => {
            const active = singleExpert === id;
            const Icon = PERSONA_ICONS[id];
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
              >
                <Icon className="size-4" />
                {MOE_EXPERT_LABELS[id]}
              </button>
            );
          })}
        </div>
      )}

      {mode === "auto" && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          The router will pick 1–3 experts based on your question
          {roleId ? ` and prefer the ${MOE_EXPERT_LABELS[roleId]} persona when relevant` : ""}.
        </div>
      )}

      {mode === "panel" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {PANEL_PRESET_ORDER.map((pid) => {
              const active = panelPreset === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setPanelPreset(pid)}
                  className={
                    "rounded-full border px-3 py-1 text-[11px] transition " +
                    (active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-accent")
                  }
                >
                  {MOE_PANEL_PRESET_META[pid].label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPanelPreset("custom")}
              className={
                "rounded-full border px-3 py-1 text-[11px] transition " +
                (panelPreset === "custom"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-accent")
              }
            >
              Custom
            </button>
          </div>
          {panelPreset !== "custom" ? (
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <div className="text-xs text-foreground">
                {MOE_PANEL_PRESET_META[panelPreset].description}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {MOE_PANEL_PRESETS[panelPreset].map((id) => (
                  <ExpertChip key={id} expertId={id} />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Pick 2–6 experts ({customPanel.length} selected)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MOE_EXPERT_IDS.map((id) => {
                  const active = customPanel.includes(id);
                  const Icon = PERSONA_ICONS[id];
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
                      <Icon className="size-4" />
                      {MOE_EXPERT_LABELS[id]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Messages */}
      <div
        ref={scrollRef}
        className={(messages.length === 0 ? "min-h-[120px] " : "min-h-[500px] ") + "flex-1 overflow-y-auto rounded-lg border border-border bg-background p-3"}
      >
        {messages.length === 0 && !sending && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Ask any question and chat with the selected experts. No deep research required.
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
              const Icon = PERSONA_ICONS[m.personaId];
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {MOE_EXPERT_LABELS[m.personaId]}
                    </div>
                    <MarkdownBlock>{m.content}</MarkdownBlock>
                  </div>
                </div>
              );
            }
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
                            {(() => {
                              const Icon = PERSONA_ICONS[ea.expertId];
                              return <Icon className="size-5" />;
                            })()}
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
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question for the experts…"
          rows={2}
          className="min-h-[48px] flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
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

      {/* Templates (below composer so opening doesn't push the chat) */}
      <div className="space-y-2">
        <div>
          <button
            type="button"
            onClick={() => setShowTemplates((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground hover:text-background"
          >
            <LayoutTemplate className="size-3.5" />
            {showTemplates ? "Hide templates" : "Templates"}
          </button>
        </div>
        <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
          <CollapsibleContent className="collapsible-content">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 text-[11px] text-muted-foreground">
                Starter prompts for the {mode === "panel" ? "selected panel" : "selected expert"}.
                Click one to load it into the composer.
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestedTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setInput(t.prompt);
                      setShowTemplates(false);
                    }}
                    className="group flex flex-col items-start gap-1 rounded-md border border-border bg-background p-2 text-left transition hover:border-foreground/40 hover:bg-foreground hover:text-background"
                  >
                    <div className="text-xs font-medium text-foreground group-hover:text-background">
                      {t.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground group-hover:text-background/80">
                      {t.description}
                    </div>
                  </button>
                ))}
                {suggestedTemplates.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    No templates available for the current selection.
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

    </div>
  );
}
