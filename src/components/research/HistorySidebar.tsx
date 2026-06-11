import { useEffect, useState } from "react";
import { History, Plus, Trash2, PanelLeftClose, PanelLeft, HelpCircle, LogOut, Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";

import {
  deleteEntry,
  loadHistory,
  type HistoryEntry,
} from "@/lib/research-history";
import { useIsMobile } from "@/hooks/use-mobile";
import { PERSONA_IMAGES } from "@/lib/persona-images";
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
    if (isMobile) {
      return (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="clay-neutral fixed right-3 top-3 z-40 inline-flex size-10 items-center justify-center rounded-full"
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      );
    }
    return (
      <aside className="sticky top-0 flex h-screen w-14 shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-3">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="clay-neutral inline-flex size-9 items-center justify-center rounded-full"
          title="Open menu"
        >
          <Menu className="size-4" />
        </button>
        <button
          type="button"
          onClick={onNew}
          className="clay inline-flex size-9 items-center justify-center rounded-full"
          title="New research"
        >
          <Plus className="size-4" />
        </button>
      </aside>
    );
  }




  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setCollapsed(true)}
          aria-hidden
        />
      )}
    <aside className={`flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar ${isMobile ? "fixed inset-y-0 left-0 z-50" : "sticky top-0"}`}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <History className="size-3.5" />
          History
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="clay-neutral inline-flex size-8 items-center justify-center rounded-full"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>
      <div className="p-2">
        <button
          type="button"
          onClick={onNew}
          className="clay inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs"
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
                    <img
                      src={PERSONA_IMAGES[e.roleId ?? "researcher"]}
                      alt=""
                      className="size-8 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-xs font-medium ${isActive ? "text-background" : "text-foreground group-hover:text-background"}`} title={e.prompt}>
                        {e.title || e.prompt}
                      </div>
                      <div className={`mt-0.5 text-[10px] ${isActive ? "text-background/70" : "text-muted-foreground group-hover:text-background/70"}`}>
                        {formatDate(e.createdAt)} · {e.kind === "moe"
                          ? `MoE · ${(e.moe?.messages?.length ?? 0)} msgs`
                          : `${e.sources.length} sources`}
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
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground hover:bg-foreground hover:text-background"
        >
          <HelpCircle className="size-3.5" />
          How it Works
        </Link>
        <ThemeToggle />
      </div>
      <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
        Saved locally on this device only.
      </div>
      {onSignOut && (
        <div className="border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground hover:bg-foreground hover:text-background"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      )}


    </aside>
    </>
  );
}
