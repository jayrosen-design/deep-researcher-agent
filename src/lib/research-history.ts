// Persistent history of completed deep researches.
// Stored only in the browser's localStorage (per-device, never sent to the server).

import type { SearchResult } from "./web-search.functions";

const KEY = "dr-history-v1";
const MAX_ENTRIES = 100;

export type HistoryEntry = {
  id: string;
  prompt: string;
  plan: string | null;
  report: string;
  sources: SearchResult[];
  createdAt: number;
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
        typeof e.report === "string" &&
        typeof e.createdAt === "number",
    );
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

export function deleteEntry(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  persist(next);
  return next;
}

export function clearHistory(): void {
  persist([]);
}
