## Goal
Give every button across the app a soft, tactile "clay" appearance with a satisfying press-down feel — without hand-editing each button site.

## Approach
Drive the look from the design system so it propagates everywhere:

1. **Add clay tokens to `src/styles.css`** (light + dark) — clay surfaces, highlight/shadow colors, and a couple of shared gradients/shadow recipes used by the variants. Keeps colors semantic; no hardcoded hex in components.

2. **Extend `src/components/ui/button.tsx`** with clay variants and shared interaction styles:
   - New variants: `clay` (aqua primary CTA), `clayNeutral` (cream/light pill — for chips/secondary), `clayDark` (active/selected state).
   - Make existing variants (`default`, `secondary`, `outline`) inherit the clay treatment so buttons already in the app pick up the new look with no per-call changes.
   - Shared base adds: pill `rounded-full`, inset highlight + bottom "lip" shadow, soft outer shadow, `translate-y` press animation (hover lifts 2px, active presses down 3–4px with reduced lip shadow), `transition-[transform,box-shadow,filter]`.
   - Keep `ghost`, `link`, and `icon` size lightweight (no lip) so icon-only nav buttons in the sidebar/navbar don't look chunky — they still get subtle press feedback.

3. **Sweep ad-hoc button-like elements** that don't use the `Button` component so they match:
   - Persona/expert panel buttons (`src/components/research/PromptInput.tsx`)
   - Template chips, mode toggle tabs (Deep Research / Chat / API Keys), Start research CTA
   - Sidebar new-chat, hamburger, sign-out
   - Navbar pills (How It Works, Settings, theme toggle)
   Where they already use `<Button>`, just confirm the variant is right. Where they use raw `<button>`, swap to `<Button variant="…">` or apply a shared `clay-*` utility class.

4. **Respect motion preferences** — wrap the transform animation in `motion-safe:` so `prefers-reduced-motion` users get color/shadow change only.

5. **Verify** in the preview on desktop + mobile: hover lift, active press, dark mode parity, focus ring still visible.

## Scope guardrails
- Frontend/presentation only. No logic, routing, or data changes.
- No new dependencies.
- Keep current layout, sizes, and spacing — only visual + micro-interaction changes.
- Don't touch form inputs, cards, or non-button surfaces.

## Out of scope
- Redesigning the page background, prompt card, or template cards (the example HTML includes an aqua gradient page background and seafloor decoration — not part of this request).
- Changing button copy, order, or which buttons exist.

Confirm and I'll implement.