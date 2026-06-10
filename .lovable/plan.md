# Add persona & agent images across the app

## 1. Move images into the app

Move the 18 images from `/images/` (project root, not currently served) into `src/assets/personas/` and import them statically so Vite fingerprints and bundles them.

Build a single shared module `src/lib/persona-images.ts` that exports:

- `PERSONA_IMAGES: Record<UserRoleId, string>` mapping each role id to its imported image URL.
- `AGENT_IMAGES: { strategist, searcher, writer, workingTogether }`.
- `STAGE_IMAGES: { plan, searching, report, final }` (alias of the agent images so stage headers stay easy to swap).

Role → file mapping:

| UserRoleId | File |
|---|---|
| researcher | researcher-agent.png |
| school-teacher | teacher.png |
| higher-education-instructor | higher-ed-instructor.png |
| instructional-designer | instructional-designer.png |
| education-leader | edu-leader.png |
| experience-designer | designer.png |
| software-developer | developer.png |
| communications-marketing | marketing.png |
| business-operations | business-ops.png |

Agent → file mapping:

| Agent | File |
|---|---|
| Strategist (plan) | strategist-agent.png |
| Searcher (ReAct) | searcher-agent.png |
| Writer (report) | writer-agent.png |
| Final report / How it Works hero | working-togeather.png |

## 2. Prompt page — persona image beside the prompt

In `src/components/research/PromptInput.tsx`:

- Lift `activeRoleId` so it is the source of truth for "currently selected persona" (default `researcher`). It already exists at line 48.
- Wrap the existing hero block (badge, H1, subtitle, form) in a two-column flex layout: persona portrait on the left (hidden < `md`, ~`w-40` to `w-56`, transparent PNG, soft cyan glow via existing `glow-primary` utility), content column on the right keeping its current max-width.
- Portrait renders `PERSONA_IMAGES[activeRoleId]` with the persona label as alt text. When the user switches persona in the Templates carousel, the image swaps with a subtle fade (`transition-opacity`).

No business-logic changes — purely a presentational left rail driven by `activeRoleId`.

## 3. System Prompts modal — agent next to each textarea

Still in `PromptInput.tsx`, inside the `Dialog open={showPrompts}` block (~lines 413–490):

- For each of the three prompt fields, render a two-column row: a ~`w-24` agent thumbnail on the left (`AGENT_IMAGES.strategist | searcher | writer`), and the existing label + textarea on the right.
- Keep the existing reset button and white textarea background; just add the image column.

## 4. How It Works page

In `src/routes/how-it-works.tsx`:

- Add a `working-togeather.png` hero image at the top of the page, centered, with a sonar-divider underneath.
- For the three agent description sections (Strategist, Searcher, Writer), render the matching agent image to the left of each description block using the same two-column pattern.

## 5. Workflow stage headers

In `src/routes/index.tsx`:

- Above the Plan UI (`PlanReview` render path), show `STAGE_IMAGES.plan` (strategist) with a small caption "Strategist is planning".
- Above the Searching UI (`ProgressTracker` block around line 923), show `STAGE_IMAGES.searching` (searcher) with "Searcher is investigating".
- Above the in-progress Report block, show `STAGE_IMAGES.report` (writer) with "Writer is drafting".
- Above the finished `ReportView` (around line 979), show `STAGE_IMAGES.final` (`working-togeather.png`) with "Your research team's final report".

These stage headers are small (e.g. `h-20` to `h-24`) so they don't push the content off-screen, but visible enough to identify the active agent.

## Technical notes

- All images imported as ES modules from `src/assets/personas/`; no `.asset.json` migration needed unless the user later asks to externalise them.
- No changes to agent prompts, model wiring, or research logic — UI only.
- Dark/light mode already handled by the existing theme; the PNGs are transparent so they sit naturally on both backgrounds. A subtle `drop-shadow-[0_0_24px_rgba(0,242,254,0.25)]` is added in dark mode for the bioluminescent feel.
- `activeRoleId` already exists; no new state in `index.tsx` beyond reading the current workflow phase to pick the stage image.
