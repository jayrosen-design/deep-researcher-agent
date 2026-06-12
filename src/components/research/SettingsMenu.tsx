import { useEffect, useMemo, useState } from "react";
import { Settings as SettingsIcon, RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NAVIGATOR_MODELS, type NavigatorModel } from "@/lib/models";
import {
  DEFAULT_SETTINGS,
  saveSettings,
  type UserSettings,
} from "@/lib/user-settings";
import { RESEARCH_ROLE_GROUPS } from "@/lib/research-templates";
import { listNavigatorModels } from "@/lib/navigator-models.functions";
import { PERSONA_IMAGES, AGENT_IMAGES } from "@/lib/persona-images";
import {
  PERSONA_CHAT_ROLE_SYSTEM_PROMPTS,
  PERSONA_CHAT_BASE_SYSTEM_PROMPT,
} from "@/lib/persona-chat-prompts";
import {
  MOE_ROUTER_SYSTEM_PROMPT,
  MOE_EXPERT_ANSWER_INSTRUCTIONS,
  MOE_MODERATOR_SYSTEM_PROMPT,
} from "@/lib/moe-prompts";

const RECOMMENDED_INVESTIGATOR = new Set<string>([
  "llama-3.1-8b-instruct",
  "gpt-oss-20b",
  "llama-3.1-nemotron-nano-8B-v1",
]);
const RECOMMENDED_SYNTHESIZER = new Set<string>([
  "gpt-oss-120b",
  "llama-3.3-70b-instruct",
  "nemotron-3-super-120b-a12b",
]);
const RECOMMENDED_PLANNER = new Set<string>([
  "gpt-oss-120b",
  "llama-3.3-70b-instruct",
  "nemotron-3-super-120b-a12b",
]);

type Props = {
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
};

export function SettingsMenu({ settings, onSettingsChange }: Props) {
  const [showPrompts, setShowPrompts] = useState(false);
  const [promptsTab, setPromptsTab] = useState<"research" | "chat" | "apikeys">("research");
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [remoteModels, setRemoteModels] = useState<string[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ tab?: "research" | "chat" | "apikeys" }>).detail;
      setPromptsTab(detail?.tab ?? "apikeys");
      setShowPrompts(true);
    };
    window.addEventListener("app:open-settings", onOpen);
    return () => window.removeEventListener("app:open-settings", onOpen);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setModelsError(null);
    setModelsLoading(true);
    listNavigatorModels({ data: { apiKey: settings.navigatorApiKey || undefined } })
      .then((res) => {
        if (cancelled) return;
        setRemoteModels(res.models.length > 0 ? res.models : null);
        setModelsError(res.error);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [settings.navigatorApiKey]);

  const modelOptions = useMemo(() => {
    const base = remoteModels ?? (NAVIGATOR_MODELS as readonly string[]);
    const merged = new Set<string>(base);
    merged.add(settings.investigatorModel);
    merged.add(settings.synthesisModel);
    merged.add(settings.planModel);
    return Array.from(merged).sort();
  }, [remoteModels, settings.investigatorModel, settings.synthesisModel, settings.planModel]);

  const persistDraft = (next: UserSettings) => {
    setDraft(next);
    saveSettings(next);
    onSettingsChange(next);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPrompts(true)}
        className="clay-neutral inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
        title="Settings"
      >
        <SettingsIcon className="size-3.5" />
        Settings
      </button>




      <Dialog open={showPrompts} onOpenChange={setShowPrompts}>
        <DialogContent className="max-h-[85vh] max-w-[90vw] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>
                  Customize system prompts and API keys. Stored only in your browser.
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (promptsTab === "research") {
                    persistDraft({
                      ...draft,
                      planModel: DEFAULT_SETTINGS.planModel,
                      investigatorModel: DEFAULT_SETTINGS.investigatorModel,
                      synthesisModel: DEFAULT_SETTINGS.synthesisModel,
                      planSystemPrompt: DEFAULT_SETTINGS.planSystemPrompt,
                      agentSystemPrompt: DEFAULT_SETTINGS.agentSystemPrompt,
                      synthesisSystemPrompt: DEFAULT_SETTINGS.synthesisSystemPrompt,
                    });
                  } else if (promptsTab === "chat") {
                    persistDraft({
                      ...draft,
                      personaChatBasePrompt: PERSONA_CHAT_BASE_SYSTEM_PROMPT,
                      personaChat: DEFAULT_SETTINGS.personaChat,
                      moeRouterPrompt: MOE_ROUTER_SYSTEM_PROMPT,
                      moeExpertPrompt: MOE_EXPERT_ANSWER_INSTRUCTIONS,
                      moeModeratorPrompt: MOE_MODERATOR_SYSTEM_PROMPT,
                      moeRouterModel: DEFAULT_SETTINGS.moeRouterModel,
                      moeModeratorModel: DEFAULT_SETTINGS.moeModeratorModel,
                    });
                  } else {
                    persistDraft({
                      ...draft,
                      navigatorApiKey: DEFAULT_SETTINGS.navigatorApiKey,
                      firecrawlApiKey: DEFAULT_SETTINGS.firecrawlApiKey,
                      tavilyApiKey: DEFAULT_SETTINGS.tavilyApiKey,
                      searchProvider: DEFAULT_SETTINGS.searchProvider,
                    });
                  }
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                <RotateCcw className="size-3" />
                Reset all
              </button>
            </div>
          </DialogHeader>

          <div className="flex justify-center">
            <div className="clay-toggle">
              {([
                { id: "research", label: "Deep Research" },
                { id: "chat", label: "Chat" },
                { id: "apikeys", label: "API Keys" },
              ] as const).map((tab) => {
                const active = promptsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPromptsTab(tab.id)}
                    className={active ? "clay-dark rounded-full px-5 py-2 text-sm" : "clay-toggle-item"}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {promptsTab !== "apikeys" && (
              <div className="text-[11px] text-muted-foreground/80">
                {modelsLoading
                  ? "Loading models…"
                  : remoteModels
                    ? `${remoteModels.length} models available for your key`
                    : modelsError
                      ? modelsError
                      : "Using bundled defaults"}
              </div>
            )}

            {promptsTab === "apikeys" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  An API key is required to run searches and chats. Keys are stored only on this device (localStorage) and sent with each request.
                </p>
                <label className="block">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>NaviGator API key</span>
                    <a
                      href="https://api.ai.it.ufl.edu/ui/?page=api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground/70 underline-offset-2 hover:underline"
                    >
                      Get key ↗
                    </a>
                  </div>
                  <input
                    type="password"
                    value={draft.navigatorApiKey}
                    onChange={(e) =>
                      persistDraft({ ...draft, navigatorApiKey: e.target.value.trim() })
                    }
                    placeholder="sk-…"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none dark:bg-background"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Search provider</span>
                    <span className="text-[10px] text-muted-foreground/70">
                      Falls back to the other if the primary fails
                    </span>
                  </div>
                  <select
                    value={draft.searchProvider}
                    onChange={(e) =>
                      persistDraft({
                        ...draft,
                        searchProvider: e.target.value as "firecrawl" | "tavily",
                      })
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none dark:bg-background"
                  >
                    <option value="firecrawl">Firecrawl (default)</option>
                    <option value="tavily">Tavily</option>
                  </select>
                </label>
                <label className="block">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Firecrawl API key</span>
                    <a
                      href="https://www.firecrawl.dev/app/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground/70 underline-offset-2 hover:underline"
                    >
                      Get key ↗
                    </a>
                  </div>
                  <input
                    type="password"
                    value={draft.firecrawlApiKey}
                    onChange={(e) =>
                      persistDraft({ ...draft, firecrawlApiKey: e.target.value.trim() })
                    }
                    placeholder="fc-…"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none dark:bg-background"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tavily API key</span>
                    <a
                      href="https://www.tavily.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground/70 underline-offset-2 hover:underline"
                    >
                      Get key ↗
                    </a>
                  </div>
                  <input
                    type="password"
                    value={draft.tavilyApiKey}
                    onChange={(e) =>
                      persistDraft({ ...draft, tavilyApiKey: e.target.value.trim() })
                    }
                    placeholder="tvly-…"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none dark:bg-background"
                  />
                </label>
              </div>
            )}


            {promptsTab === "research" &&
              ([
                {
                  key: "planSystemPrompt",
                  label: "Strategist (plan)",
                  hint: "Drafts the structured research plan.",
                  defaultValue: DEFAULT_SETTINGS.planSystemPrompt,
                  image: AGENT_IMAGES.strategist,
                  modelKey: "planModel",
                  recommendedSet: RECOMMENDED_PLANNER,
                },
                {
                  key: "agentSystemPrompt",
                  label: "Searcher (ReAct loop)",
                  hint: "JSON-only tool-calling loop. Edit with care.",
                  defaultValue: DEFAULT_SETTINGS.agentSystemPrompt,
                  image: AGENT_IMAGES.searcher,
                  modelKey: "investigatorModel",
                  recommendedSet: RECOMMENDED_INVESTIGATOR,
                },
                {
                  key: "synthesisSystemPrompt",
                  label: "Writer (final report)",
                  hint: "Writes the final Markdown report from gathered sources.",
                  defaultValue: DEFAULT_SETTINGS.synthesisSystemPrompt,
                  image: AGENT_IMAGES.writer,
                  modelKey: "synthesisModel",
                  recommendedSet: RECOMMENDED_SYNTHESIZER,
                },
              ] as const).map((field) => {
                const value = draft[field.key];
                const isDefault = value === field.defaultValue;
                return (
                  <div key={field.key} className="flex gap-3">
                    <img
                      src={field.image}
                      alt={`${field.label} octopus agent`}
                      className="hidden h-24 w-24 shrink-0 object-contain sm:block dark:drop-shadow-[0_0_18px_rgba(0,242,254,0.3)]"
                    />
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-foreground">{field.label}</span>
                          <span className="text-xs text-muted-foreground">{field.hint}</span>
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Model</span>
                            <select
                              value={draft[field.modelKey]}
                              onChange={(e) =>
                                persistDraft({
                                  ...draft,
                                  [field.modelKey]: e.target.value as NavigatorModel,
                                } as UserSettings)
                              }
                              className="rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 dark:bg-background"
                            >
                              {modelOptions.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                  {field.recommendedSet?.has(m) ? " (Recommended)" : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <button
                          type="button"
                          disabled={isDefault}
                          onClick={() => persistDraft({ ...draft, [field.key]: field.defaultValue })}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
                        >
                          <RotateCcw className="size-3" />
                          Reset
                        </button>
                      </div>
                      <textarea
                        value={value}
                        onChange={(e) => persistDraft({ ...draft, [field.key]: e.target.value })}
                        rows={10}
                        className="w-full resize-y rounded-md border border-border bg-white px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus:border-foreground/30 focus:outline-none dark:bg-background"
                      />
                    </div>
                  </div>
                );
              })}

            {promptsTab === "chat" && (
              <div className="space-y-5">
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Shared chat base prompt</div>
                      <div className="text-xs text-muted-foreground">
                        Applied to every persona during post-report chat. Defines grounding, citation, and response rules.
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={draft.personaChatBasePrompt === PERSONA_CHAT_BASE_SYSTEM_PROMPT}
                      onClick={() =>
                        persistDraft({ ...draft, personaChatBasePrompt: PERSONA_CHAT_BASE_SYSTEM_PROMPT })
                      }
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      <RotateCcw className="size-3" />
                      Reset
                    </button>
                  </div>
                  <textarea
                    value={draft.personaChatBasePrompt}
                    onChange={(e) =>
                      persistDraft({ ...draft, personaChatBasePrompt: e.target.value })
                    }
                    rows={8}
                    className="w-full resize-y rounded-md border border-border bg-white px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus:border-foreground/30 focus:outline-none dark:bg-background"
                  />
                </div>

                {RESEARCH_ROLE_GROUPS.map((role) => {
                  const cfg = draft.personaChat[role.id];
                  const defaultPrompt = PERSONA_CHAT_ROLE_SYSTEM_PROMPTS[role.id];
                  const defaultModel = DEFAULT_SETTINGS.personaChat[role.id].model;
                  const isDefault =
                    cfg.systemPrompt === defaultPrompt && cfg.model === defaultModel;
                  return (
                    <div key={role.id} className="flex gap-3">
                      <img
                        src={PERSONA_IMAGES[role.id]}
                        alt={`${role.label} persona`}
                        className="hidden h-24 w-24 shrink-0 rounded-md object-cover sm:block dark:drop-shadow-[0_0_18px_rgba(0,242,254,0.3)]"
                      />
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-foreground">{role.label}</span>
                            <span className="text-xs text-muted-foreground">{role.description}</span>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>Model</span>
                              <select
                                value={cfg.model}
                                onChange={(e) =>
                                  persistDraft({
                                    ...draft,
                                    personaChat: {
                                      ...draft.personaChat,
                                      [role.id]: { ...cfg, model: e.target.value as NavigatorModel },
                                    },
                                  })
                                }
                                className="rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 dark:bg-background"
                              >
                                {modelOptions.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                    {RECOMMENDED_SYNTHESIZER.has(m) ? " (Recommended)" : ""}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <button
                            type="button"
                            disabled={isDefault}
                            onClick={() =>
                              persistDraft({
                                ...draft,
                                personaChat: {
                                  ...draft.personaChat,
                                  [role.id]: { model: defaultModel, systemPrompt: defaultPrompt },
                                },
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
                          >
                            <RotateCcw className="size-3" />
                            Reset
                          </button>
                        </div>
                        <textarea
                          value={cfg.systemPrompt}
                          onChange={(e) =>
                            persistDraft({
                              ...draft,
                              personaChat: {
                                ...draft.personaChat,
                                [role.id]: { ...cfg, systemPrompt: e.target.value },
                              },
                            })
                          }
                          rows={10}
                          className="w-full resize-y rounded-md border border-border bg-white px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus:border-foreground/30 focus:outline-none dark:bg-background"
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Mixture of Experts (MoE)</div>
                    <div className="text-xs text-muted-foreground">
                      Used for Auto-Pick and Expert Panel modes in post-report chat.
                    </div>
                  </div>

                  {([
                    {
                      key: "moeRouterPrompt" as const,
                      modelKey: "moeRouterModel" as const,
                      label: "Expert router",
                      hint: "Selects 1–3 experts (or 4–6 for panel questions) based on the user's question.",
                      defaultPrompt: MOE_ROUTER_SYSTEM_PROMPT,
                      showModel: true,
                    },
                    {
                      key: "moeExpertPrompt" as const,
                      modelKey: null,
                      label: "Expert answer instructions",
                      hint: "Appended to each persona's prompt. Each expert uses its own model from the persona above.",
                      defaultPrompt: MOE_EXPERT_ANSWER_INSTRUCTIONS,
                      showModel: false,
                    },
                    {
                      key: "moeModeratorPrompt" as const,
                      modelKey: "moeModeratorModel" as const,
                      label: "Moderator / synthesizer",
                      hint: "Combines expert responses into a single grounded answer.",
                      defaultPrompt: MOE_MODERATOR_SYSTEM_PROMPT,
                      showModel: true,
                    },
                  ]).map((f) => {
                    const value = draft[f.key];
                    const isDefault =
                      value === f.defaultPrompt &&
                      (!f.showModel || draft[f.modelKey!] === DEFAULT_SETTINGS[f.modelKey!]);
                    return (
                      <div key={f.key} className="rounded-md border border-border bg-background p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{f.label}</span>
                            <span className="text-xs text-muted-foreground">{f.hint}</span>
                            {f.showModel && f.modelKey && (
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>Model</span>
                                <select
                                  value={draft[f.modelKey]}
                                  onChange={(e) =>
                                    persistDraft({
                                      ...draft,
                                      [f.modelKey!]: e.target.value as NavigatorModel,
                                    } as UserSettings)
                                  }
                                  className="rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 dark:bg-background"
                                >
                                  {modelOptions.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                      {RECOMMENDED_SYNTHESIZER.has(m) ? " (Recommended)" : ""}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={isDefault}
                            onClick={() => {
                              const next: UserSettings = { ...draft, [f.key]: f.defaultPrompt } as UserSettings;
                              if (f.showModel && f.modelKey) {
                                (next as Record<string, unknown>)[f.modelKey] = DEFAULT_SETTINGS[f.modelKey];
                              }
                              persistDraft(next);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
                          >
                            <RotateCcw className="size-3" />
                            Reset
                          </button>
                        </div>
                        <textarea
                          value={value}
                          onChange={(e) =>
                            persistDraft({ ...draft, [f.key]: e.target.value } as UserSettings)
                          }
                          rows={8}
                          className="w-full resize-y rounded-md border border-border bg-white px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus:border-foreground/30 focus:outline-none dark:bg-background"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
