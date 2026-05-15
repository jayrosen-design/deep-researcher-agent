import { Check, Loader2, Circle, AlertCircle } from "lucide-react";

export type PhaseStatus = "pending" | "active" | "done" | "error";

export type Phase = {
  key: string;
  label: string;
  status: PhaseStatus;
  detail?: string;
};

export function ProgressTracker({
  phases,
  onRetry,
}: {
  phases: Phase[];
  onRetry?: (phaseKey: string) => void;
}) {
  return (
    <ol className="space-y-4">
      {phases.map((p) => (
        <li key={p.key} className="flex items-start gap-3">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center">
            {p.status === "done" && (
              <div className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                <Check className="size-3.5" />
              </div>
            )}
            {p.status === "active" && (
              <Loader2 className="size-5 animate-spin text-foreground" />
            )}
            {p.status === "pending" && <Circle className="size-5 text-muted-foreground/40" />}
            {p.status === "error" && <AlertCircle className="size-5 text-destructive" />}
          </div>
          <div className="flex-1">
            <div
              className={
                p.status === "pending"
                  ? "text-sm text-muted-foreground"
                  : "text-sm font-medium text-foreground"
              }
            >
              {p.label}
            </div>
            {p.detail && (
              <div className="mt-1 text-xs text-muted-foreground">{p.detail}</div>
            )}
            {p.status === "error" && onRetry && (
              <button
                onClick={() => onRetry(p.key)}
                className="mt-2 rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-accent"
              >
                Retry this step
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
