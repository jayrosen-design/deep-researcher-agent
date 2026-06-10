// User-configurable settings stored in browser localStorage.
// Sent with each request to override server-side defaults.

import { DEFAULT_INVESTIGATOR_MODEL, DEFAULT_SYNTHESIS_MODEL, DEFAULT_PLAN_MODEL, type NavigatorModel } from "./models";
import { AGENT_SYSTEM_PROMPT, SYNTHESIS_SYSTEM_PROMPT } from "./agent-prompts";
import { PLAN_SYSTEM_PROMPT } from "./plan-prompts";

const KEY = "dr-settings-v1";

export type SearchProvider = "firecrawl" | "tavily";

export type UserSettings = {
  navigatorApiKey: string;
  tavilyApiKey: string;
  firecrawlApiKey: string;
  searchProvider: SearchProvider;
  maxSources: number; // 10..100, increments of 10
  investigatorModel: NavigatorModel;
  synthesisModel: NavigatorModel;
  planModel: NavigatorModel;
  planSystemPrompt: string;
  agentSystemPrompt: string;
  synthesisSystemPrompt: string;
};

export const DEFAULT_SETTINGS: UserSettings = {
  navigatorApiKey: "",
  tavilyApiKey: "",
  firecrawlApiKey: "",
  searchProvider: "firecrawl",
  maxSources: 30,
  investigatorModel: DEFAULT_INVESTIGATOR_MODEL,
  synthesisModel: DEFAULT_SYNTHESIS_MODEL,
  planModel: DEFAULT_PLAN_MODEL,
  planSystemPrompt: PLAN_SYSTEM_PROMPT,
  agentSystemPrompt: AGENT_SYSTEM_PROMPT,
  synthesisSystemPrompt: SYNTHESIS_SYSTEM_PROMPT,
};

export const SOURCE_COUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function coerceModel(m: unknown, fallback: NavigatorModel): NavigatorModel {
  // Accept any non-empty string so dynamically-discovered models work too.
  if (typeof m === "string" && m.length > 0) return m as NavigatorModel;
  return fallback;
}


function coerceString(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim().length > 0 ? v : fallback;
}

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      navigatorApiKey: parsed.navigatorApiKey ?? "",
      tavilyApiKey: parsed.tavilyApiKey ?? "",
      firecrawlApiKey: parsed.firecrawlApiKey ?? "",
      searchProvider:
        parsed.searchProvider === "tavily" || parsed.searchProvider === "firecrawl"
          ? parsed.searchProvider
          : DEFAULT_SETTINGS.searchProvider,
      maxSources:
        typeof parsed.maxSources === "number" &&
        SOURCE_COUNT_OPTIONS.includes(parsed.maxSources)
          ? parsed.maxSources
          : DEFAULT_SETTINGS.maxSources,
      investigatorModel: coerceModel(parsed.investigatorModel, DEFAULT_INVESTIGATOR_MODEL),
      synthesisModel: coerceModel(parsed.synthesisModel, DEFAULT_SYNTHESIS_MODEL),
      planModel: coerceModel(parsed.planModel, DEFAULT_PLAN_MODEL),
      planSystemPrompt: coerceString(parsed.planSystemPrompt, PLAN_SYSTEM_PROMPT),
      agentSystemPrompt: coerceString(parsed.agentSystemPrompt, AGENT_SYSTEM_PROMPT),
      synthesisSystemPrompt: coerceString(parsed.synthesisSystemPrompt, SYNTHESIS_SYSTEM_PROMPT),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: UserSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
