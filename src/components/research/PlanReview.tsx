import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Check, Loader2, RotateCcw, Sparkles } from "lucide-react";

type Props = {
  prompt: string;
  plan: string | null;
  isGenerating: boolean;
  error: string | null;
  onAccept: () => void;
  onRevise: (edits: string) => void;
  onRegenerate: () => void;
  onCancel: () => void;
};

export function PlanReview({
  prompt,
  plan,
  isGenerating,
  error,
  onAccept,
  onRevise,
  onRegenerate,
  onCancel,
}: Props) {
  const [edits, setEdits] = useState("");

  const handleRevise = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = edits.trim();
    if (!trimmed || isGenerating || !plan) return;
    onRevise(trimmed);
    setEdits("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            Research plan
          </div>
          <h1 className="mt-3 text-xl font-semibold leading-snug text-foreground">
            {prompt}
          </h1>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          Cancel
        </button>
      </header>

      <section className="rounded-xl border border-border bg-card p-6">
        {isGenerating && !plan && (
          <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Thinking through a research plan…
          </div>
        )}

        {error && !isGenerating && (
          <div className="space-y-3">
            <div className="text-sm text-destructive">{error}</div>
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <RotateCcw className="size-3.5" />
              Try again
            </button>
          </div>
        )}

        {plan && (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Updating plan with your feedback…
              </div>
            )}
          </div>
        )}
      </section>

      {plan && (
        <form onSubmit={handleRevise} className="mt-5">
          <div className="relative rounded-2xl border border-border bg-card shadow-sm transition focus-within:border-foreground/30 focus-within:shadow-md">
            <textarea
              value={edits}
              onChange={(e) => setEdits(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRevise(e);
              }}
              placeholder="Suggest edits to the plan (e.g. 'Focus more on EU regulations', 'Add a section on cost', 'Skip the historical background')…"
              rows={3}
              disabled={isGenerating}
              className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:opacity-60"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
              <div className="text-xs text-muted-foreground">
                Edit the plan, or accept it as-is to start the deep research.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isGenerating || !edits.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp className="size-3.5" />
                  Update plan
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check className="size-3.5" />
                  Accept &amp; start research
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
