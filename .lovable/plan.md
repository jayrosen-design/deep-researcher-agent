# Make MoE Chat feel like a live group chat

Today, in panel/auto mode, the UI shows one combined assistant bubble only after the router, every expert, and the moderator have all finished. We'll turn it into a live dialogue: each expert posts its own bubble the moment it returns, then each expert posts a short reaction round, then the moderator summary streams in token-by-token.

## New behavior (panel + auto modes)

Sequence after the user sends a question:

1. **User bubble** — appears immediately (already does).
2. **"Panel assembled" header bubble** — small chat row listing the selected experts (chips with avatars). For `auto`, this appears after routing finishes; for `panel`, immediately.
3. **Round 1 — first take (parallel, stream-in)**: kick off all experts in parallel (existing `askExpert`). As each promise resolves, append a chat bubble styled as that expert (avatar + name + answer). Failed experts get a muted "couldn't respond" bubble.
4. **Round 2 — reaction round (parallel, stream-in)**: once Round 1 is complete, ask each expert for a short reaction (1–2 short paragraphs) where they see the other experts' Round 1 answers and can agree, push back, or build on them. Each reaction bubble appears as soon as it returns.
5. **Moderator summary (token streaming)**: append a moderator bubble immediately with a typing/shimmer indicator; tokens stream into the bubble live as the moderator model generates them. When done, the bubble shows the final markdown summary.

Single-expert mode is unchanged.

## Technical changes

```text
src/
├── routes/api/
│   └── navigator-stream.ts        (NEW server route; SSE proxy)
├── lib/
│   ├── moe-chat.ts                (add askExpertReaction; add streamMoeTurn generator)
│   └── moe-prompts.ts             (add buildExpertReactionUserMessage + MOE_EXPERT_REACTION_INSTRUCTIONS)
└── components/research/
    └── MoeChatWorkspace.tsx       (rewrite panel/auto rendering as per-event bubbles)
```

### 1. Streaming server route

`src/routes/api/navigator-stream.ts` — TanStack server route, `POST`, accepts the same body shape as `navigatorChat` plus `stream: true`. It calls `https://api.ai.it.ufl.edu/v1/chat/completions` with `stream: true`, and pipes the upstream SSE body straight back as a streaming `Response` (`text/event-stream`). Used only for the moderator summary so we get token-level updates without changing the existing JSON-returning experts.

### 2. `moe-chat.ts`

- **`askExpertReaction({ expertId, question, docs, otherAnswers, settings })`** — calls `navigatorChat` (non-streaming, plain text, not JSON) with a new prompt that includes the other experts' Round 1 answers and asks for a brief reaction.
- **`streamModeratorSynthesis({ question, docs, expertAnswers, reactionAnswers, settings, onDelta, onDone })`** — fetches `/api/navigator-stream`, parses SSE `data:` lines, calls `onDelta(textChunk)` per token, `onDone(fullText)` at the end.
- **`runMoeTurnStreaming(args & { onEvent })`** — orchestrates Rounds 1, 2, moderator. Emits typed events: `routed`, `expertAnswer`, `expertFailed`, `reactionAnswer`, `moderatorStart`, `moderatorDelta`, `moderatorDone`. Existing `runMoeTurn` stays for any other callers.

### 3. `moe-prompts.ts`

- `MOE_EXPERT_REACTION_INSTRUCTIONS` — "You have just seen first responses from the other experts on the panel. Respond in 1–2 short paragraphs as <persona>. Agree, push back, or build on specific points. Address other experts by name. Plain text, no JSON, no headings."
- `buildExpertReactionUserMessage({ expertId, userQuestion, otherAnswers })` — formats the other experts' Round 1 answers as a labeled block.
- Moderator prompt builder extended to optionally include the reaction round so the summary reflects the discussion.

### 4. `MoeChatWorkspace.tsx`

Replace the single aggregated `MoeAssistantMsg` for panel/auto with a stream of chat rows. New `ChatMsg` variants:

```text
| { role:'panel-header', mode, selectedExperts, failures? }
| { role:'expert', round:1|2, expertId, content, status:'streaming'|'done'|'failed' }
| { role:'moderator', content, status:'streaming'|'done' }
```

Each expert bubble renders with the persona avatar from `PERSONA_IMAGES`/`PERSONA_ICONS` on the left, expert name as the bubble header, then markdown body — visually clearly a different speaker, like a group chat.

`handleSend` for panel/auto now calls `runMoeTurnStreaming` and appends/updates messages from the event callbacks instead of one trailing `setMessages`. Existing `loadingStage` chip is repurposed to show "Round 1", "Round 2", "Moderator" sub-stages. Auto-scroll on every append.

## Out of scope

- Token-level streaming for the expert bubbles themselves (kept as JSON responses so we can still surface confidence/evidence chips). Only the moderator summary streams token-by-token.
- Changing single-expert mode.
- Persistence of chat history.
