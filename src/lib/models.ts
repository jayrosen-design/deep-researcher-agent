export const NAVIGATOR_MODELS = [
  "gpt-oss-120b",
  "nemotron-3-super-120b-a12b",
  "llama-3.3-70b-instruct",
  "llama-3.1-70b-instruct",
  "gpt-oss-20b",
  "llama-3.1-8b-instruct",
  "llama-3.1-nemotron-nano-8B-v1",
] as const;

export type NavigatorModel = (typeof NAVIGATOR_MODELS)[number];

// Legacy single-model default (kept for backwards compatibility).
export const DEFAULT_MODEL: NavigatorModel = "gpt-oss-120b";

// Smaller, faster model for the ReAct investigator (JSON tool calls only).
export const DEFAULT_INVESTIGATOR_MODEL: NavigatorModel = "llama-3.1-8b-instruct";

// Larger model reserved for the synthesizer (long-form prose + reasoning).
export const DEFAULT_SYNTHESIS_MODEL: NavigatorModel = "gpt-oss-120b";
