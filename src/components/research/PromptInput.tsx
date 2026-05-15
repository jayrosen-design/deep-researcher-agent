import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { NAVIGATOR_MODELS, type NavigatorModel } from "@/lib/models";

export function PromptInput({
  onSubmit,
  model,
  onModelChange,
}: {
  onSubmit: (prompt: string) => void;
  model: NavigatorModel;
  onModelChange: (m: NavigatorModel) => void;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
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
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
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
    </div>
  );
}
