## 1. Make "Chat with this report" window opaque and expandable

File: `src/components/research/ResearchChat.tsx`

- The floating panel uses `bg-card` which can read as translucent over the report. Swap to a fully opaque surface (`bg-background`) and add a stronger border + shadow so it visibly separates from the page.
- Add an `expanded` state alongside the existing `open` state. New header control next to the minimize button:
  - Collapsed (default): current size — `h-[min(720px,calc(100vh-3rem))] w-[min(480px,calc(100vw-3rem))]` anchored bottom-right.
  - Expanded: near-fullscreen — `inset-4` (or `h-[calc(100vh-2rem)] w-[calc(100vw-2rem)]`) centered, same opaque surface.
- Use `Maximize2` / `Minimize2` icons from `lucide-react` for the toggle, with proper aria-labels.
- Keep the minimized "Chat with this report" pill button unchanged.

## 2. Home page workflow mode toggle: Deep Research vs MoE Chat

Goal: from the landing screen, the user can flip between the existing Deep Research workflow and a standalone MoE Chat workspace (same MoE experience as the post-report chat, but with no prior report — user just types a topic/question and the experts respond).

### UI

File: `src/routes/index.tsx`

- Add a centered pill toggle (mirroring the Deep Research / Chat toggle inside the System Prompts modal) directly under `<Navbar>` on the input phase, with two options: **Deep Research** and **MoE Chat**.
- New local state `workflowMode: "research" | "moe"`, default `"research"`. Only shown when `phase === "input"` (once a research run starts, the workflow is locked in).
- When `workflowMode === "research"`: render the existing `WorkflowStepper` + `PromptInput` flow unchanged.
- When `workflowMode === "moe"`: render a new `<MoeChatWorkspace />` component instead of the stepper/prompt. Keep `Navbar`, `HistorySidebar`, and `Disclaimer` around it.

### New component

File: `src/components/research/MoeChatWorkspace.tsx` (new)

- Full-page chat surface (max-w-4xl, vertical layout) reusing the MoE logic already in `ResearchChat`:
  - Mode tabs: Single Expert / Auto-Pick / Expert Panel.
  - Persona buttons / panel preset chips identical to `ResearchChat`.
  - Message list + composer styled like `ResearchChat`'s body but sized for full page.
- Calls `runMoeTurn` from `@/lib/moe-chat` with an **empty docs array** (no report grounding). For Single mode, calls `navigatorChat` with the persona's chat system prompt from `settings` (same path `ResearchChat` uses today) and no docs block.
- Passes `settings` and optional initial `roleId` as props; reuses `PERSONA_IMAGES`, `MOE_EXPERT_*` constants.
- Refactor: extract the shared rendering pieces (`MarkdownBlock`, `ExpertChip`, expert-answer accordion) from `ResearchChat.tsx` into `src/components/research/moe-shared.tsx` so both `ResearchChat` and `MoeChatWorkspace` import them. No behavior change to `ResearchChat`.

### Prompts/grounding

File: `src/lib/moe-prompts.ts` (small tweak)

- `buildExpertContextBlock` (and any equivalents) already accept a docs array. When called with `[]`, ensure the assembled system prompt tells experts to answer from general expertise since no report is provided (small wording branch). No schema changes.

### History

- Out of scope for this turn — MoE Chat workspace sessions are ephemeral. Existing research history sidebar still shows research entries only.

## Technical notes

- No new dependencies.
- No server function changes; reuses `navigatorChat` / `runMoeTurn`.
- `ResearchChat`'s post-report behavior is unchanged except for the opaque background and the new expand/collapse control.
- Mode toggle styling reuses the same Tailwind pattern already used by the System Prompts modal's Deep Research / Chat switch for visual consistency.
