import { ExternalLink } from "lucide-react";
import type { SearchResult } from "@/lib/web-search.functions";

export function SourcesPanel({
  sources,
}: {
  sources: SearchResult[];
}) {
  if (sources.length === 0) return null;

  const seen = new Set<string>();
  const unique = sources.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  return (
    <aside className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Sources ({unique.length})
      </h2>
      <ol className="space-y-2.5">
        {unique.map((s, i) => {
          let host = "";
          try {
            host = new URL(s.url).hostname.replace(/^www\./, "");
          } catch {
            host = s.url;
          }
          return (
            <li key={s.url} className="flex gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {i + 1}.
              </span>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group min-w-0 flex-1"
              >
                <div className="line-clamp-1 font-medium text-foreground group-hover:underline">
                  {s.title}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <ExternalLink className="size-3" />
                  {host}
                </div>
              </a>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
