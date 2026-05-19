import { Loader2, Search, FileText, CheckCircle2, AlertCircle, Brain } from "lucide-react";

export type TraceStep =
  | { kind: "thought"; text: string }
  | { kind: "search"; query: string; resultCount?: number; resultUrls?: string[]; status: "active" | "done" | "error"; error?: string }
  | { kind: "read"; url: string; status: "active" | "done" | "error"; error?: string; chars?: number }
  | { kind: "finish"; status: "active" | "done" }
  | { kind: "error"; message: string };

function faviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function AgentTrace({ steps }: { steps: TraceStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center text-muted-foreground">
            {s.kind === "thought" && <Brain className="size-4" />}
            {s.kind === "search" && (s.status === "active" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />)}
            {s.kind === "read" && (s.status === "active" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />)}
            {s.kind === "finish" && (s.status === "active" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4 text-foreground" />)}
            {s.kind === "error" && <AlertCircle className="size-4 text-destructive" />}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            {s.kind === "thought" && (
              <div className="text-foreground">{s.text}</div>
            )}
            {s.kind === "search" && (
              <div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">Search:</span>{" "}
                  <span className="font-medium">"{s.query}"</span>
                </div>
                {s.status === "done" && s.resultUrls && s.resultUrls.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {s.resultUrls.slice(0, 12).map((u, idx) => (
                      <a
                        key={idx}
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        title={hostname(u)}
                        className="inline-flex size-5 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted"
                      >
                        <img
                          src={faviconUrl(u)}
                          alt=""
                          width={16}
                          height={16}
                          loading="lazy"
                          className="size-4"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                          }}
                        />
                      </a>
                    ))}
                  </div>
                )}
                {s.status === "done" && typeof s.resultCount === "number" && (
                  <div className="mt-1 text-xs text-muted-foreground">{s.resultCount} results</div>
                )}
                {s.status === "error" && s.error && (
                  <div className="mt-0.5 text-xs text-destructive">{s.error}</div>
                )}
              </div>
            )}
            {s.kind === "read" && (
              <div>
                <div className="flex items-center gap-1.5 text-foreground">
                  <img
                    src={faviconUrl(s.url)}
                    alt=""
                    width={16}
                    height={16}
                    loading="lazy"
                    className="size-4 shrink-0 rounded-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />
                  <span className="text-muted-foreground">Read:</span>{" "}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
                  >
                    {hostname(s.url)}
                  </a>
                </div>
                {s.status === "done" && typeof s.chars === "number" && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{s.chars.toLocaleString()} chars extracted</div>
                )}
                {s.status === "error" && s.error && (
                  <div className="mt-0.5 text-xs text-destructive">{s.error}</div>
                )}
              </div>
            )}
            {s.kind === "finish" && (
              <div className="text-foreground font-medium">
                {s.status === "active" ? "Writing final report…" : "Report complete"}
              </div>
            )}
            {s.kind === "error" && (
              <div className="text-destructive">{s.message}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
