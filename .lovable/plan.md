## Goal

1. API keys typed into Settings should stick to the device between visits.
2. The server-side fallback to built-in NaviGator / Firecrawl / Tavily keys is removed — every user must bring their own.
3. People can still browse, pick personas, draft prompts, and open panels. They only get blocked when they actually click **Send / Start research**. At that point a dialog explains a key is missing and jumps them straight into Settings → API Keys.

## Changes

### 1. Settings persistence (already auto-saves — verify only)
`SettingsMenu.persistDraft` already calls `saveSettings()` on each keystroke, and `loadSettings()` runs on app mount. No code change needed; mention this so the user knows their key is saved as soon as it is typed.

### 2. Remove server-side default keys
- `src/lib/navigator-chat.functions.ts`: stop reading `process.env.UF_NAVIGATOR_API_KEY`. Require `data.apiKey`; throw `Missing NaviGator API key. Open Settings → API Keys to add one.` when absent.
- `src/lib/web-search.functions.ts` and `src/lib/read-url.functions.ts`: stop reading `process.env.TAVILY_API_KEY` / `process.env.FIRECRAWL_API_KEY`. Only use the keys passed from the client. If neither is configured, throw `Missing search API key. Open Settings → API Keys to add Firecrawl or Tavily.`

### 3. New "Missing API key" dialog
Create `src/components/research/ApiKeyMissingDialog.tsx` using shadcn `Dialog`:
- Title: "API key required"
- Body: short message listing which key(s) are missing (NaviGator, Firecrawl/Tavily).
- Buttons: **Cancel** and **Enter API Key** (primary). The primary button dispatches `window.dispatchEvent(new CustomEvent("app:open-settings", { detail: { tab: "apikeys" } }))` then closes the dialog.

### 4. SettingsMenu reacts to the open event
In `src/components/research/SettingsMenu.tsx`, add a `useEffect` listening for `app:open-settings`; when fired it sets `setShowPrompts(true)` and `setPromptsTab(detail.tab ?? "apikeys")`.

### 5. Gate Send buttons
Add a small helper `getMissingKeys(settings, { needsSearch })` → returns `{ navigator: boolean, search: boolean }`.

Wire gating before each network call (no key check done in disabled state — buttons stay clickable so the dialog can teach the user):

- `src/components/research/PromptInput.tsx` — in `handleSubmit`, if `navigatorApiKey` empty OR (firecrawl AND tavily) empty → show dialog instead of calling `onSubmit`. Needs `settings` (already passed) and a new local `dialogOpen` state.
- `src/components/research/ResearchChat.tsx` — in `handleSend`, require `navigatorApiKey`; show dialog if missing.
- `src/components/research/MoeChatWorkspace.tsx` — same, in `handleSend`.

Each component renders `<ApiKeyMissingDialog open=… onOpenChange=… missing=… />`.

### 6. Copy update
On the API Keys tab in Settings, replace "Leave blank to use the server's default keys." with "An API key is required to run searches and chats."

## Technical notes

- `loadSettings()` already reads from `localStorage` (`dr-settings-v1`), so persistence works the moment we save — no migration needed.
- Throwing inside server functions surfaces the message in the existing error toasts/`fatalError` flow, so even if a user bypasses the dialog (e.g. clears a key mid-run) they still get a clear message.
- No business-logic changes beyond key enforcement; deep-research orchestration, MoE flow, and history all stay intact.

## Out of scope

- No new persistence layer (still localStorage, per device, as requested).
- No changes to other Settings tabs (prompts, models).
- No server-side secret management — keys remain BYO-key on the client.