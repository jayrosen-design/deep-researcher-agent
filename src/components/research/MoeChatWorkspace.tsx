import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  ChevronDown,
  AlertTriangle,
  MessagesSquare,
} from "lucide-react";

import { navigatorChat } from "@/lib/navigator-chat.functions";
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

type PanelPreset = "default" | "education" | "custom";
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

export function MoeChatWorkspace({ settings, roleId }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<MoeMode>("auto");
  const [singleExpert, setSingleExpert] = useState<MoeExpertId>(roleId ?? "researcher");
  const [panelPreset, setPanelPreset] = useState<PanelPreset>("default");
  const [customPanel, setCustomPanel] = useState<MoeExpertId[]>([
    "researcher",
    "experience-designer",
    "software-developer",
  ]);

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [mode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, loadingStage]);

  const effectivePanel: MoeExpertId[] =
    panelPreset === "custom" ? customPanel : MOE_PANEL_PRESETS[panelPreset];

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pt-6 pb-8 sm:px-6">
      <div className="flex items-center gap-2">
        <MessagesSquare className="size-5 text-foreground" />
        <h1 className="text-base font-semibold text-foreground">MoE Chat</h1>
        <span className="text-xs text-muted-foreground">
          Chat directly with experts — no research run required.
        </span>
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
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          The router will pick 1–3 experts based on your question
          {roleId ? ` and prefer the ${MOE_EXPERT_LABELS[roleId]} persona when relevant` : ""}.
        </div>
      )}

      {mode === "panel" && (
        <div className="space-y-2">
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

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-[420px] flex-1 overflow-y-auto rounded-lg border border-border bg-background p-4"
      >
        {messages.length === 0 && !sending && (
          <div className="py-16 text-center text-sm text-muted-foreground">
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
  );
}
