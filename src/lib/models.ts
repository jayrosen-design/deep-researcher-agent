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
export const DEFAULT_MODEL: NavigatorModel = "gpt-oss-120b";
