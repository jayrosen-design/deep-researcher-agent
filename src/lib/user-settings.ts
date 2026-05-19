// User-configurable settings stored in browser localStorage.
// Sent with each request to override server-side defaults.

import { DEFAULT_INVESTIGATOR_MODEL, DEFAULT_SYNTHESIS_MODEL, NAVIGATOR_MODELS, type NavigatorModel } from "./models";

const KEY = "dr-settings-v1";

export type UserSettings = {
  navigatorApiKey: string;
  tavilyApiKey: string;
  maxSources: number; // 10..100, increments of 10
  investigatorModel: NavigatorModel;
  synthesisModel: NavigatorModel;
};

export const DEFAULT_SETTINGS: UserSettings = {
  navigatorApiKey: "",
  tavilyApiKey: "",
  maxSources: 30,
  investigatorModel: DEFAULT_INVESTIGATOR_MODEL,
  synthesisModel: DEFAULT_SYNTHESIS_MODEL,
};

export const SOURCE_COUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function coerceModel(m: unknown, fallback: NavigatorModel): NavigatorModel {
  return typeof m === "string" && (NAVIGATOR_MODELS as readonly string[]).includes(m)
    ? (m as NavigatorModel)
    : fallback;
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
      maxSources:
        typeof parsed.maxSources === "number" &&
        SOURCE_COUNT_OPTIONS.includes(parsed.maxSources)
          ? parsed.maxSources
          : DEFAULT_SETTINGS.maxSources,
      investigatorModel: coerceModel(parsed.investigatorModel, DEFAULT_INVESTIGATOR_MODEL),
      synthesisModel: coerceModel(parsed.synthesisModel, DEFAULT_SYNTHESIS_MODEL),
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
