# MoE Mode for Chat with Research

Extend the existing `ResearchChat` panel with three chat modes for follow-up questions on a completed report. Existing single-persona chat stays intact (becomes "Single Expert" mode). No new web search, no changes to the research/report flow.

## New files

**`src/lib/moe-prompts.ts`** — system prompts and JSON schemas for:
- Expert router (selects 1–3 experts, or 4–6 for panel-style questions). Uses the prompt in the spec; output validated by Zod.
- Expert answer (each expert returns `{ expertId, answer, confidence, evidenceUsed, missingEvidence, recommendations }`).
- Moderator/synthesizer (returns one synthesized markdown answer with the required sections: Direct Answer, Expert Panel Synthesis, Trade-offs, Recommended Next Step, Evidence Gaps, Expert Contributions).
- Helpers `buildExpertContextBlock(docs)` so router/experts/moderator share grounding.

**`src/lib/moe-chat.ts`** (client-side orchestrator, no new server fn needed — reuses `navigatorChat`):
- `routeExperts({ question, docs, settings, preferredRoleId? })` → calls `navigatorChat` with `responseFormat: "json_object"` against the router prompt; parses+validates JSON; on failure falls back to `[preferredRoleId ?? "researcher"]`.
- `askExpert({ expertId, question, history, docs, settings })` → uses each persona's configured `chatModel`/`systemPrompt` from `settings.personaChat`; requests JSON; on parse failure wraps raw text into the expert-answer shape with `confidence: "low"`.
- `synthesizePanel({ question, expertAnswers, docs, settings })` → moderator call, returns markdown.
- `runMoeTurn(mode, …)` orchestrates router → parallel `askExpert` (Promise.allSettled so one failure doesn't block) → optional synthesis. Returns `{ selectedExperts, routerReasoning, expertAnswers, failures, synthesis }`.

## Edits

**`src/components/research/ResearchChat.tsx`**
- Add mode state: `"single" | "auto" | "panel"`, persona selection for single, panel composition (`"default" | "education" | "custom"` + custom expert set), and per-turn loading stages ("Routing question…", "Consulting experts…", "Synthesizing answer…").
- New header row above the message list: three mode tabs. Below the tabs, mode-specific controls:
  - Single: 9 persona buttons with `PERSONA_IMAGES` thumbnails (defaults to incoming `roleId`).
  - Auto: brief explanatory text only.
  - Panel: three preset chips (Default / Education / Custom) + when Custom is selected, multi-select chips for 2–6 experts (validated before send).
- Extend `ChatMsg` to `{ role: "user" } | { role: "assistant"; mode; content; experts?; routerReasoning?; failures? }`. Assistant rendering:
  - Single: existing markdown bubble (current behavior).
  - Auto / Panel: render synthesis markdown first, then a "Selected experts" line (chips with persona avatar + router reason), then a collapsible `<details>` per expert showing their `answer` markdown, `confidence`, `evidenceUsed`, `missingEvidence`, `recommendations`, and a clear notice for any expert that failed.
- `handleSend`: branch on mode. Single mode keeps current `navigatorChat` path (unchanged behavior). Auto/Panel call `runMoeTurn` with the staged loading messages.
- Reset chat when `currentDoc.id` changes (already done) and also when mode changes (clear messages to avoid mode mismatch in transcripts).

**`src/lib/user-settings.ts`**
- Add `moeRouterPrompt`, `moeExpertPrompt`, `moeModeratorPrompt`, `moeRouterModel`, `moeModeratorModel` (default to current synthesis model). Defaults sourced from `moe-prompts.ts`.
- Backfill in the existing settings-merge/migration so prior users get the new defaults.

**`src/components/research/PromptInput.tsx`** (System Prompts modal)
- Inside the existing Chat tab, add a "Mixture of Experts" subsection with editable router/expert-base/moderator prompts and model pickers, each with a Reset button — mirroring how the per-persona chat prompts are edited today. No new modal; same toggle scheme.

## Technical details

- All MoE calls reuse `navigatorChat` (no new server fn). Router and expert calls use `responseFormat: "json_object"`, parsed with Zod; moderator uses plain text (markdown).
- Expert calls run in parallel via `Promise.allSettled`. Failures surface inline ("Software Developer expert failed: …") and don't block synthesis as long as ≥1 expert succeeded; if all fail, show an error and don't call the moderator.
- Grounding context for every MoE call uses the same `buildDocsBlock` helper already in `ResearchChat`, lifted into `moe-prompts.ts` so router/expert/moderator share it.
- Per-expert system prompt = `PERSONA_CHAT_BASE_SYSTEM_PROMPT` + that persona's `PERSONA_CHAT_ROLE_SYSTEM_PROMPTS` entry + MoE expert-answer instructions (JSON shape + "answer only from your expert perspective"). Reuses the existing persona prompt library — no duplication.
- Auto mode passes the incoming template `roleId` as `preferredRoleId` so the user's chosen persona is favored when relevant.
- No new dependencies. All changes are frontend/presentation + prompt config.

## Acceptance checks

- Single mode behaves exactly like today (regression check: existing transcripts still render).
- Auto mode shows 1–3 expert chips + reasons, then synthesis + collapsible contributions.
- Panel mode (Default / Education / Custom 2–6) shows synthesis first, contributions collapsed.
- One expert failing still produces a synthesized answer plus a visible failure notice.
- Report generation flow is untouched.
