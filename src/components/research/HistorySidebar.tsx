import { useEffect, useState } from "react";
import { History, Plus, Trash2, PanelLeftClose, PanelLeft, HelpCircle, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";

import {
  deleteEntry,
  loadHistory,
  type HistoryEntry,
} from "@/lib/research-history";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onNew: () => void;
  refreshKey?: number;
  onSignOut?: () => void;
};


function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function HistorySidebar({ activeId, onSelect, onNew, refreshKey, onSignOut }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on mobile so the sidebar doesn't eat the screen.
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  useEffect(() => {
    setEntries(loadHistory());
  }, [refreshKey]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEntries(deleteEntry(id));
  };


  if (collapsed) {
    return (
      <aside className="sticky top-0 flex h-screen w-12 shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-3">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="rounded-md p-2 text-muted-foreground hover:bg-foreground hover:text-background"
          title="Open history"
        >
          <PanelLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={onNew}
          className="rounded-md p-2 text-muted-foreground hover:bg-foreground hover:text-background"
          title="New research"
        >
          <Plus className="size-4" />
        </button>
        <div className="mt-auto flex flex-col items-center gap-2 md:hidden">
          <Link
            to="/how-it-works"
            className="rounded-md p-2 text-muted-foreground hover:bg-foreground hover:text-background"
            title="How it Works"
          >
            <HelpCircle className="size-4" />
          </Link>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md p-2 text-muted-foreground hover:bg-foreground hover:text-background"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </aside>
    );
  }


  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <History className="size-3.5" />
          History
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1 text-muted-foreground hover:bg-foreground hover:text-background"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>
      <div className="p-2">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
        >
          <Plus className="size-3.5" />
          New research
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {entries.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            No past researches yet.
          </div>
        ) : (
          <ul className="space-y-1">
            {entries.map((e) => {
              const isActive = e.id === activeId;
              return (
                <li key={e.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(e)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        onSelect(e);
                      }
                    }}
                    className={`group flex w-full cursor-pointer items-start gap-2 rounded-md border px-2 py-2 text-left transition ${
                      isActive
                        ? "border-foreground/30 bg-foreground text-background"
                        : "border-transparent hover:border-border hover:bg-foreground hover:text-background"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-xs font-medium ${isActive ? "text-background" : "text-foreground"}`} title={e.prompt}>
                        {e.title || e.prompt}
                      </div>
                      <div className={`mt-0.5 text-[10px] ${isActive ? "text-background/70" : "text-muted-foreground"}`}>
                        {formatDate(e.createdAt)} · {e.sources.length} sources
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(ev) => handleDelete(ev, e.id)}
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-background hover:text-destructive group-hover:opacity-100"
                      title="Delete"
                      aria-label="Delete research"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-border px-3 py-2 md:hidden">
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          <HelpCircle className="size-3.5" />
          How it Works
        </Link>
        <ThemeToggle />
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        )}
      </div>
      <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
        Saved locally on this device only.
      </div>

    </aside>
  );
}
