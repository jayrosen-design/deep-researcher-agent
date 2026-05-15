## Deep Research Assistant

A single-page agentic research app: user enters a prompt → LLM drafts a search plan → web searches run in parallel → LLM synthesizes a cited Markdown report.

### Stack note
This project runs on TanStack Start (not classic Vite + Supabase Edge Functions). I'll implement the two "edge functions" as **TanStack server functions** (`createServerFn`) — same security guarantees (keys stay server-side, never bundled to the client), no Supabase needed. If you specifically want them as Supabase Edge Functions, say so and I'll enable Lovable Cloud and switch.

### Transient memory
- No database, no localStorage, no file writes.
- All state (prompt, plan, search results, report) lives in React `useState` only.
- Server functions hold data only for the duration of the request.

---

### 1. Server functions (`src/lib/`)

**`navigator-chat.functions.ts`** — proxies UF NaviGator
- POST to `https://api.ai.it.ufl.edu/v1/chat/completions`
- `Authorization: Bearer ${process.env.UF_NAVIGATOR_API_KEY}`
- Input: `{ messages, model?, temperature?, responseFormat? }`
- Default model: `gemini-1.5-pro`
- Returns assistant message content (string)

**`web-search.functions.ts`** — proxies Tavily
- POST to `https://api.tavily.com/search` with `process.env.TAVILY_API_KEY`
- Input: `{ query: string }`
- Returns top 5 results: `[{ url, title, content }]`

Both use Zod input validation and return clean DTOs. Errors return `{ error: string }` so the UI can retry per-step.

**Secrets to add:** `UF_NAVIGATOR_API_KEY`, `TAVILY_API_KEY` (I'll request via secrets tool after you approve).

---

### 2. Frontend state machine (`src/routes/index.tsx` + `src/components/research/`)

State phases: `idle → planning → searching → synthesizing → done | error`

```text
idle ──submit──▶ planning ──plan[]──▶ searching ──results──▶ synthesizing ──report──▶ done
                    │                      │                      │
                    └──────────────────────┴──────────────────────┴──▶ error (retry per phase)
```

- **Phase 1 (planning):** call `navigatorChat` with system prompt: "You are a research planner. Output a JSON array of 3–5 optimized search queries. Respond with JSON only." Parse into `string[]`.
- **Phase 2 (searching):** `Promise.all` over queries → `webSearch` per query. Aggregate into `{ query, results: [{url, title, content}] }[]`. Display current query as it resolves.
- **Phase 3 (synthesis):** build context block with numbered sources, send to `navigatorChat` with system prompt: "Expert analyst. Write comprehensive Markdown report with inline citations as `[Title](URL)` linking to sources provided." Return Markdown string.

Retry logic: each phase failure shows error + "Retry this step" button that re-runs only that phase using cached prior results.

---

### 3. UI components

- **`PromptInput`** — centered hero with large `<textarea>` + "Start Research" button (idle state).
- **`ProgressTracker`** — vertical step list showing phase status with icons (pending/active/done/error). During search shows "Searching: {currentQuery}".
- **`ReportView`** — `react-markdown` + `remark-gfm` rendering, prose styling, clickable links open in new tab.
- **`SourcesPanel`** — collapsible footer/sidebar listing all unique URLs with title + favicon.
- **`Header`** — minimal: app name + "New Research" button (visible after first run).

Design: minimalist, generous whitespace, single accent color, system font stack — Perplexity/Gemini feel. All colors via existing `src/styles.css` semantic tokens.

**Dependencies to add:** `react-markdown`, `remark-gfm`, `zod` (likely already present).

---

### 4. File map

```text
src/
├── routes/index.tsx                       # state machine + page composition
├── lib/
│   ├── navigator-chat.functions.ts        # server fn → UF NaviGator
│   ├── web-search.functions.ts            # server fn → Tavily
│   └── research-prompts.ts                # shared system prompts
└── components/research/
    ├── PromptInput.tsx
    ├── ProgressTracker.tsx
    ├── ReportView.tsx
    └── SourcesPanel.tsx
```

---

### Open questions before I build

1. **Server functions vs Supabase Edge Functions?** The project's stack uses TanStack server functions natively. I recommend those (simpler, no Supabase setup). Confirm or say "use Supabase".
2. **Search provider:** Tavily (you have an API key) or Firecrawl connector (managed OAuth, no key needed)?
3. **Model default** `gemini-1.5-pro` confirmed, or prefer `gpt-4o` / something else available on the NaviGator gateway?

Reply with answers (or "go with defaults") and I'll implement.