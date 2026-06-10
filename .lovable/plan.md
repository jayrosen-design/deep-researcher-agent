## 1. Move "API keys" and "System prompts" to the top navbar

- Lift `showSettings` and `showPrompts` state (and the two `<Dialog>` modals) out of `PromptInput.tsx` into a new shared component `src/components/research/SettingsMenu.tsx` that renders two navbar buttons + both dialogs. It receives `settings`, `onSettingsChange` (and the model list it currently fetches).
- Update `Navbar.tsx` to accept `settings` + `onSettingsChange` props and render `<SettingsMenu />` alongside Theme/How-it-works/Sign out, so the buttons are visible in every workflow mode (Deep Research, plan, research, and MoE Chat).
- Remove the "API keys" and "System prompts" buttons (and the two `<Dialog>` blocks) from `PromptInput.tsx`. The "Templates" button stays in the Deep Research prompt bar.
- In `routes/index.tsx`, pass `settings`/`setSettings` into `<Navbar>` everywhere it's rendered.

## 2. Templates button under MoE Chat

- Add a `<LayoutTemplate>` "Templates" button at the top of `MoeChatWorkspace.tsx` (next to the mode tabs).
- Clicking opens a collapsible panel that lists curated MoE conversation starters. Source the list from `RESEARCH_ROLE_GROUPS` in `src/lib/research-templates.ts`:
  - **Single mode**: show the templates for the currently selected single expert.
  - **Auto mode**: show templates from the user's preferred `roleId` (fallback Researcher).
  - **Panel mode**: show a merged, deduped set from all experts in the active preset (cap ~8 items).
- Clicking a template fills the textarea (`setInput(template.prompt)`) and collapses the panel.

## 3. New MoE panel presets + descriptions

Update `src/lib/moe-prompts.ts`:

```ts
export type PanelPresetId =
  | "education"
  | "higher-education"
  | "product-design"
  | "implementation-strategy"
  | "technical-feasibility"
  | "default";

export const MOE_PANEL_PRESETS: Record<PanelPresetId, MoeExpertId[]> = {
  education: ["researcher","school-teacher","instructional-designer","education-leader"],
  "higher-education": ["researcher","higher-education-instructor","instructional-designer","experience-designer"],
  "product-design": ["experience-designer","software-developer","communications-marketing","business-operations"],
  "implementation-strategy": ["researcher","education-leader","business-operations","communications-marketing"],
  "technical-feasibility": ["researcher","software-developer","experience-designer","business-operations"],
  default: ["researcher","experience-designer","software-developer","business-operations"],
};

export const MOE_PANEL_PRESET_META: Record<PanelPresetId, { label: string; bestFor: string; description: string }> = {
  education: { label: "Education Panel",
    bestFor: "K-12 learning, classroom use, curriculum decisions, instructional strategy, school implementation.",
    description: "Evaluates research through classroom practice, learning design, and education leadership perspectives." },
  "higher-education": { label: "Higher Education Panel",
    bestFor: "College teaching, online courses, academic integrity, student engagement, course design, and assessment.",
    description: "Combines research evidence, university teaching practice, learning design, and student experience." },
  "product-design": { label: "Product Design Panel",
    bestFor: "Turning research into an app, website, platform, prototype, or user-facing product.",
    description: "Reviews the idea from UX, technical feasibility, audience positioning, and operational sustainability." },
  "implementation-strategy": { label: "Implementation Strategy Panel",
    bestFor: "Adoption planning, stakeholder buy-in, funding, rollout strategy, policy alignment, and organizational change.",
    description: "Translates research into a practical implementation plan with leadership, communication, and operational considerations." },
  "technical-feasibility": { label: "Technical Feasibility Panel",
    bestFor: "Evaluating whether an idea can realistically be built, scaled, maintained, and supported.",
    description: "Assesses evidence, system architecture, user experience, cost, staffing, privacy, security, and long-term maintainability." },
  default: { label: "Default Panel", bestFor: "General multi-perspective analysis.",
    description: "Balanced cross-functional panel covering research, UX, engineering, and operations." },
};
```

## 4. Render presets + default to Expert Panel / Education

In both `MoeChatWorkspace.tsx` and `ResearchChat.tsx`:

- Replace the hard-coded `[default, education, custom]` button list with a loop over `MOE_PANEL_PRESET_META` (custom appended last). Each button shows the preset label; below the chips, render the active preset's **description** and a small "Best for: …" line, pulled from `MOE_PANEL_PRESET_META`.
- `panelPreset` state type becomes `PanelPresetId | "custom"`.

In `MoeChatWorkspace.tsx`:
- Change default mode: `useState<MoeMode>("panel")` (was `"auto"`).
- Change default preset: `useState<PanelPresetId | "custom">("education")` (was `"default"`).

`ResearchChat.tsx` keeps its current defaults (it already opens to "auto" for report chat); only the preset list/description rendering changes there.

## Out of scope

- No backend, schema, or routing changes.
- No edits to existing research workflow logic.
