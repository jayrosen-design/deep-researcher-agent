import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkflowStepStatus = "pending" | "active" | "done";

export type WorkflowStep = {
  key: string;
  label: string;
  status: WorkflowStepStatus;
};

export function WorkflowStepper({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 pt-6">
      <ol className="flex w-full items-center gap-2 sm:gap-3">
        {steps.map((s, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    s.status === "done" &&
                      "border-foreground bg-foreground text-background",
                    s.status === "active" &&
                      "border-foreground bg-background text-foreground",
                    s.status === "pending" &&
                      "border-border bg-background text-muted-foreground",
                  )}
                >
                  {s.status === "done" ? (
                    <Check className="size-3.5" />
                  ) : s.status === "active" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-sm transition-colors",
                    s.status === "active" && "font-medium text-foreground",
                    s.status === "done" && "text-foreground",
                    s.status === "pending" && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-px flex-1 transition-colors",
                    s.status === "done" ? "bg-foreground/60" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
