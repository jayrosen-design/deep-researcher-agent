import { useEffect, useState } from "react";
import { ArrowUp, Settings as SettingsIcon, Sparkles, LayoutTemplate } from "lucide-react";
import { NAVIGATOR_MODELS, type NavigatorModel } from "@/lib/models";
import {
  DEFAULT_SETTINGS,
  SOURCE_COUNT_OPTIONS,
  loadSettings,
  saveSettings,
  type UserSettings,
} from "@/lib/user-settings";
import { RESEARCH_TEMPLATES } from "@/lib/research-templates";

export function PromptInput({
  onSubmit,
  model,
  onModelChange,
  settings,
  onSettingsChange,
}: {
  onSubmit: (prompt: string) => void;
  model: NavigatorModel;
  onModelChange: (m: NavigatorModel) => void;
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
}) {
  const [value, setValue] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [draft, setDraft] = useState<UserSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

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
    <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center px-6">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        <Sparkles className="size-3.5" />
        Autonomous deep research
      </div>
      <h1 className="text-center text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        What should we research?
      </h1>
      <p className="mt-3 text-center text-base text-muted-foreground">
        I'll plan, search the web, and synthesize a cited report.
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-1">Model</span>
                <select
                  value={model}
                  onChange={(e) => onModelChange(e.target.value as NavigatorModel)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                >
                  {NAVIGATOR_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
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
                onClick={() => setShowSettings((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <SettingsIcon className="size-3.5" />
                API keys
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
      </form>

      {showSettings && (
        <div className="mt-4 w-full rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">Your API keys</div>
            <button
              type="button"
              onClick={() => persistDraft(DEFAULT_SETTINGS)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Reset
            </button>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Stored only in your browser (localStorage) and sent with each request.
            Leave blank to use the server's default keys.
          </p>
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
        </div>
      )}
    </div>
  );
}
