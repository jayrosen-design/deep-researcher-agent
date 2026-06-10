import { useEffect, useMemo, useState } from "react";
import { ArrowUp, Settings as SettingsIcon, FileText, RotateCcw, LayoutTemplate } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { NAVIGATOR_MODELS, type NavigatorModel } from "@/lib/models";
import {
  DEFAULT_SETTINGS,
  SOURCE_COUNT_OPTIONS,
  loadSettings,
  saveSettings,
  type UserSettings,
} from "@/lib/user-settings";
import { RESEARCH_ROLE_GROUPS, type UserRoleId } from "@/lib/research-templates";
import { listNavigatorModels } from "@/lib/navigator-models.functions";

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




export function PromptInput({
  onSubmit,
  settings,
  onSettingsChange,
}: {
  onSubmit: (prompt: string) => void;
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
}) {
  const [value, setValue] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeRoleId, setActiveRoleId] = useState<UserRoleId>("researcher");
  const [showPrompts, setShowPrompts] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [remoteModels, setRemoteModels] = useState<string[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);


  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Fetch the list of models actually available to this API key.
  useEffect(() => {
    let cancelled = false;
    setModelsError(null);
    setModelsLoading(true);
    listNavigatorModels({ data: { apiKey: settings.navigatorApiKey || undefined } })
      .then((res) => {
        if (cancelled) return;
        setRemoteModels(res.models.length > 0 ? res.models : null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setRemoteModels(null);
        setModelsError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [settings.navigatorApiKey]);

  // Merge remote list with bundled defaults so the current selection is
  // always pickable even if the API doesn't list it.
  const modelOptions = useMemo(() => {
    const base = remoteModels ?? (NAVIGATOR_MODELS as readonly string[]);
    const merged = new Set<string>(base);
    merged.add(settings.investigatorModel);
    merged.add(settings.synthesisModel);
    return Array.from(merged).sort();
  }, [remoteModels, settings.investigatorModel, settings.synthesisModel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const persistDraft = (next: UserSettings) => {
    setDraft(next);
    saveSettings(next);
    onSettingsChange(next);
  };

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center px-6">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        Deep Researcher Agent
      </div>
      <h1 className="text-center text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">


        What should we research?
      </h1>
      <p className="mt-3 text-center text-base text-muted-foreground">
        Multi-agents work together to plan, search the web, and synthesize a cited report.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 w-full">
        <div className="relative rounded-2xl border border-border bg-card shadow-sm transition focus-within:border-foreground/30 focus-within:shadow-md">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
            }}
            placeholder="e.g. Compare the latest fusion energy breakthroughs of 2025 and their commercial timelines."
            rows={4}
            className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <div className="flex flex-col gap-2 border-t border-border px-3 py-2">
            {/* Row 1: model selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-1">Searcher</span>
                <select
                  value={settings.investigatorModel}
                  onChange={(e) =>
                    persistDraft({ ...draft, investigatorModel: e.target.value as NavigatorModel })
                  }
                  title="Smaller/faster model for the ReAct JSON loop"
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                >
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                      {RECOMMENDED_INVESTIGATOR.has(m) ? " (Recommended)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-1">Writer</span>
                <select
                  value={settings.synthesisModel}
                  onChange={(e) =>
                    persistDraft({ ...draft, synthesisModel: e.target.value as NavigatorModel })
                  }
                  title="Larger model for the final Markdown report"
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                >
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                      {RECOMMENDED_SYNTHESIZER.has(m) ? " (Recommended)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <span className="text-[11px] text-muted-foreground/80">
                {modelsLoading
                  ? "Loading models…"
                  : remoteModels
                    ? `${remoteModels.length} models available for your key`
                    : modelsError
                      ? "Using bundled defaults (key has no model list)"
                      : "Using bundled defaults"}
              </span>
            </div>


            {/* Row 2: max sources + templates + api keys, with submit on the right */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-1">Max sources</span>
                  <select
                    value={settings.maxSources}
                    onChange={(e) =>
                      persistDraft({ ...draft, maxSources: Number(e.target.value) })
                    }
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                  >
                    {SOURCE_COUNT_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setShowTemplates((s) => !s)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <LayoutTemplate className="size-3.5" />
                  Templates
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings((s) => !s)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <SettingsIcon className="size-3.5" />
                  API keys
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrompts((s) => !s)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <FileText className="size-3.5" />
                  System prompts
                </button>

              </div>
              <button
                type="submit"
                disabled={!value.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start research
                <ArrowUp className="size-4" />
              </button>
            </div>
          </div>

        </div>
      </form>

      <Collapsible open={showTemplates} onOpenChange={setShowTemplates} className="w-full">
        <CollapsibleContent className="collapsible-content">
          <div className="mt-6 w-full">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              {RESEARCH_ROLE_GROUPS.map((role) => {
                const RoleIcon = role.icon;
                const isActive = role.id === activeRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setActiveRoleId(role.id)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition " +
                      (isActive
                        ? "border-foreground/40 bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:bg-foreground hover:text-background")
                    }
                  >
                    <RoleIcon className="size-3.5" />
                    {role.label}
                  </button>
                );
              })}
            </div>
            {(() => {
              const activeRole =
                RESEARCH_ROLE_GROUPS.find((r) => r.id === activeRoleId) ?? RESEARCH_ROLE_GROUPS[0];
              return (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-foreground">{activeRole.label} templates</div>
                    <div className="text-xs text-muted-foreground">
                      {activeRole.description}. Click one to load it, then replace [PLACEHOLDERS] with your specifics.
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {activeRole.templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setValue(template.prompt)}
                        className="group flex flex-col items-start gap-1 rounded-lg border border-border bg-background p-3 text-left transition hover:border-foreground/30 hover:bg-accent"
                      >
                        <div className="text-sm font-medium text-foreground">{template.label}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </CollapsibleContent>
      </Collapsible>


      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>Your API keys</DialogTitle>
                <DialogDescription>
                  Stored only in your browser (localStorage) and sent with each request.
                  Leave blank to use the server's default keys.
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => persistDraft(DEFAULT_SETTINGS)}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Reset
              </button>
            </div>
          </DialogHeader>
          <div className="space-y-3">
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrompts} onOpenChange={setShowPrompts}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>System prompts</DialogTitle>
                <DialogDescription>
                  Customize the system prompts for each agent role. Stored only in your browser.
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() =>
                  persistDraft({
                    ...draft,
                    planSystemPrompt: DEFAULT_SETTINGS.planSystemPrompt,
                    agentSystemPrompt: DEFAULT_SETTINGS.agentSystemPrompt,
                    synthesisSystemPrompt: DEFAULT_SETTINGS.synthesisSystemPrompt,
                  })
                }
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                <RotateCcw className="size-3" />
                Reset all
              </button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {([
              {
                key: "planSystemPrompt",
                label: "Strategist (plan)",
                hint: "Drafts the structured research plan.",
                defaultValue: DEFAULT_SETTINGS.planSystemPrompt,
              },
              {
                key: "agentSystemPrompt",
                label: "Searcher (ReAct loop)",
                hint: "JSON-only tool-calling loop. Edit with care.",
                defaultValue: DEFAULT_SETTINGS.agentSystemPrompt,
              },
              {
                key: "synthesisSystemPrompt",
                label: "Writer (final report)",
                hint: "Writes the final Markdown report from gathered sources.",
                defaultValue: DEFAULT_SETTINGS.synthesisSystemPrompt,
              },
            ] as const).map((field) => {
              const value = draft[field.key];
              const isDefault = value === field.defaultValue;
              return (
                <label key={field.key} className="block">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      <span className="text-foreground">{field.label}</span> — {field.hint}
                    </span>
                    <button
                      type="button"
                      disabled={isDefault}
                      onClick={() => persistDraft({ ...draft, [field.key]: field.defaultValue })}
                      className="inline-flex items-center gap-1 underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      <RotateCcw className="size-3" />
                      Reset
                    </button>
                  </div>
                  <textarea
                    value={value}
                    onChange={(e) => persistDraft({ ...draft, [field.key]: e.target.value })}
                    rows={10}
                    className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus:border-foreground/30 focus:outline-none"
                  />
                </label>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
