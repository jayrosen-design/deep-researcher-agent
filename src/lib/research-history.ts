// Persistent history of completed deep researches.
// Stored only in the browser's localStorage (per-device, never sent to the server).

import type { SearchResult } from "./web-search.functions";
import type { UserRoleId } from "./research-templates";

const KEY = "dr-history-v1";
const MAX_ENTRIES = 100;

export type MoeHistoryPayload = {
  mode: "single" | "auto" | "panel";
  panelPreset?: string;
  customPanel?: string[];
  singleExpert?: string;
  messages: unknown[]; // serialized ChatMsg[] from MoeChatWorkspace
};

export type HistoryEntry = {
  id: string;
  prompt: string;
  title?: string;
  plan: string | null;
  report: string;
  sources: SearchResult[];
  createdAt: number;
  roleId?: UserRoleId;
  kind?: "research" | "moe";
  moe?: MoeHistoryPayload;
};

function safeParse(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        e &&
        typeof e === "object" &&
        typeof e.id === "string" &&
        typeof e.prompt === "string" &&
        typeof e.createdAt === "number" &&
        (typeof e.report === "string" || (e.kind === "moe" && e.moe && Array.isArray(e.moe.messages))),
    ).map((e: HistoryEntry) => ({
      ...e,
      report: typeof e.report === "string" ? e.report : "",
      sources: Array.isArray(e.sources) ? e.sources : [],
      plan: e.plan ?? null,
    }));
  } catch {
    return [];
  }
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

function persist(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* quota exceeded — silently drop */
  }
}

export function saveEntry(entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `r_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  const all = [full, ...loadHistory()];
  persist(all);
  return full;
}

export function updateEntry(id: string, patch: Partial<Omit<HistoryEntry, "id">>): HistoryEntry | null {
  const all = loadHistory();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...patch };
  all[idx] = updated;
  persist(all);
  return updated;
}

export function deleteEntry(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  persist(next);
  return next;
}

export function clearHistory(): void {
  persist([]);
}
