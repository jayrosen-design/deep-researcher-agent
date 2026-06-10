## Goal

In MoE Chat mode, display a large (720×540) panel image at the top, centered. Image swaps with the selected Expert Panel preset. Default (and Single/Auto modes) show `product-design-moe.png`. Reorganize the header and shrink the question textarea to make room.

## Changes

### 1. Make panel images servable

The five PNGs currently live at `/images/*-moe.png` in the project root, which Vite does not serve. Move them into `public/moe/` so they're available at `/moe/<name>.png`:

- `images/education-moe.png` → `public/moe/education-moe.png`
- `images/higher-ed-moe.png` → `public/moe/higher-ed-moe.png`
- `images/product-design-moe.png` → `public/moe/product-design-moe.png`
- `images/implementation-strategy-moe.png` → `public/moe/implementation-strategy-moe.png`
- `images/technical-feasibility-moe.png` → `public/moe/technical-feasibility-moe.png`

(If file sizes are large we can upload via `lovable-assets` instead and import .asset.json pointers — same wiring otherwise.)

### 2. Add image map in `src/lib/moe-prompts.ts`

Add a `MOE_PANEL_PRESET_IMAGES: Record<PanelPresetId, string>` mapping each preset id to its `/moe/...png` URL. Default fallback = `product-design-moe.png`.

### 3. Reorganize `src/components/research/MoeChatWorkspace.tsx`

- Header block: keep the badge + "Chat with Mixture of Experts" title + subtitle, but center a `<img>` at 720×540 (responsive: `max-w-full h-auto`, `width={720} height={540}`) directly under the title. Image source resolves from the current panel preset when `mode === "panel"`, else the product-design default.
- Remove the "Best for:" line from the panel preset detail block (keep `description` and the expert chips).
- Shrink the composer textarea: drop from `rows={5}` / `min-h-[120px]` back to `rows={3}` / `min-h-[72px]` so the hero image fits comfortably above.
- Keep all other functionality (mode tabs, preset row, templates button under composer, messages area) unchanged.

### 4. Mirror on post-report chat (`ResearchChat.tsx`)

Out of scope — user only mentioned MoE Chat mode header. No change.

## Technical notes

- Image path resolution lives in the component as `const panelImage = mode === "panel" && panelPreset !== "custom" ? MOE_PANEL_PRESET_IMAGES[panelPreset] : MOE_PANEL_PRESET_IMAGES["product-design"];`
- Use `loading="eager"` and a fixed `aspect-[4/3]` wrapper so layout doesn't jump while the image loads.
- `alt` text = preset label + " panel".
